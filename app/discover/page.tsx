'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Copy,
  Eye,
  ArrowLeft,
  Filter,
  Globe,
  Sparkles,
  ChevronDown,
  Building2,
  Compass,
  Car,
  Heart,
  Hotel,
  DollarSign,
} from 'lucide-react';
import { Itinerary, UserSummary } from '@/lib/types/user';

const INTERESTS = [
  { id: 'food', label: 'Food & Dining', emoji: '🍜' },
  { id: 'culture', label: 'Culture', emoji: '🏛️' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'adventure', label: 'Adventure', emoji: '🎢' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'relaxation', label: 'Relaxation', emoji: '🧘' },
  { id: 'history', label: 'History', emoji: '📜' },
];

// Extended itinerary type for list views
interface ItineraryWithMeta extends Itinerary {
  collaboratorCount?: number;
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverLoading />}>
      <DiscoverContent />
    </Suspense>
  );
}

function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );
}

interface MarketplaceTrip {
  id: string;
  title: string;
  city: string;
  start_date: string;
  num_people: number;
  marketplace_needs: string[];
  marketplace_budget_min?: number;
  marketplace_budget_max?: number;
  creator_name: string;
  creator_avatar?: string;
  activity_count: number;
  proposal_count: number;
  service_needs: Array<{ service_type: string; notes?: string }>;
}

const SERVICE_ICONS: Record<string, any> = {
  guide: Compass,
  hotel: Hotel,
  transport: Car,
  experience: Sparkles,
  health: Heart,
};

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'itineraries' | 'marketplace'>(
    searchParams.get('tab') === 'marketplace' ? 'marketplace' : 'itineraries'
  );
  const [itineraries, setItineraries] = useState<ItineraryWithMeta[]>([]);
  const [marketplaceTrips, setMarketplaceTrips] = useState<MarketplaceTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: searchParams.get('startDate') || '',
    end: searchParams.get('endDate') || '',
  });
  const [groupSize, setGroupSize] = useState<number | null>(null);

  const fetchItineraries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('destination', searchQuery);
      if (dateRange.start) params.set('startDate', dateRange.start);
      if (dateRange.end) params.set('endDate', dateRange.end);

      const response = await fetch(`/api/itineraries?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        // Client-side filtering for interests (can be moved to API later)
        let filtered = data.itineraries;
        if (selectedInterests.length > 0) {
          filtered = filtered.filter((i: ItineraryWithMeta) =>
            selectedInterests.some((interest) => i.interests?.includes(interest))
          );
        }
        if (groupSize) {
          filtered = filtered.filter((i: ItineraryWithMeta) => i.groupSize >= groupSize);
        }
        setItineraries(filtered);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch itineraries:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, dateRange, selectedInterests, groupSize]);

  const fetchMarketplace = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('destination', searchQuery);
      if (selectedServiceType) params.set('serviceType', selectedServiceType);
      if (dateRange.start) params.set('startDateFrom', dateRange.start);
      if (dateRange.end) params.set('startDateTo', dateRange.end);
      if (groupSize) params.set('travelers', groupSize.toString());

      const response = await fetch(`/api/marketplace?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setMarketplaceTrips(data.trips || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedServiceType, dateRange, groupSize]);

  useEffect(() => {
    if (activeTab === 'itineraries') {
      fetchItineraries();
    } else {
      fetchMarketplace();
    }
  }, [activeTab, fetchItineraries, fetchMarketplace]);

  const handleClone = async (id: string) => {
    try {
      const response = await fetch(`/api/itineraries/${id}/clone`, {
        method: 'POST',
      });

      if (response.status === 401) {
        router.push('/?signin=true');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        router.push(`/itinerary/${data.itinerary.id}`);
      }
    } catch (err) {
      console.error('Failed to clone:', err);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedInterests([]);
    setDateRange({ start: '', end: '' });
    setGroupSize(null);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedInterests.length > 0 ||
    dateRange.start ||
    dateRange.end ||
    groupSize;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-bold text-gray-900">Discover</h1>
                <p className="text-xs text-gray-500">
                  {total} {activeTab === 'itineraries' ? 'public itineraries' : 'marketplace opportunities'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'marketplace' && (
                <Link
                  href="/business/register"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  Join as Business
                </Link>
              )}
              <Link
                href="/trip/new"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Create Trip
              </Link>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 pb-2">
            <button
              onClick={() => setActiveTab('itineraries')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'itineraries'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Public Itineraries
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'marketplace'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Business Marketplace
            </button>
          </div>
        </div>
      </header>

      {/* Search & Filters Bar */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by destination (e.g., Tokyo, Japan)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-emerald-300 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <span className="px-1.5 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                  {selectedInterests.length + (dateRange.start ? 1 : 0) + (groupSize ? 1 : 0)}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Filter by</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Interests */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Trip Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedInterests.includes(interest.id)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
                      }`}
                    >
                      <span>{interest.emoji}</span>
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range & Group Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Traveling after
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Traveling before
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Group size (min)
                  </label>
                  <select
                    value={groupSize || ''}
                    onChange={(e) => setGroupSize(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-300 focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="1">Solo (1)</option>
                    <option value="2">Couple (2+)</option>
                    <option value="4">Group (4+)</option>
                    <option value="8">Large Group (8+)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'itineraries' ? (
          itineraries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itineraries.map((itinerary) => (
                <ItineraryCard
                  key={itinerary.id}
                  itinerary={itinerary}
                  onClone={() => handleClone(itinerary.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No itineraries found
              </h3>
              <p className="text-gray-500 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search terms'
                  : 'Be the first to share your travel plans!'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )
        ) : marketplaceTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketplaceTrips.map((trip) => (
              <MarketplaceTripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No marketplace trips found
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'No travelers are looking for services yet'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ItineraryCard({
  itinerary,
  onClone,
}: {
  itinerary: ItineraryWithMeta;
  onClone: () => void;
}) {
  const formatDateRange = () => {
    if (!itinerary.startDate && !itinerary.endDate) return null;
    const start = itinerary.startDate
      ? new Date(itinerary.startDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : '';
    const end = itinerary.endDate
      ? new Date(itinerary.endDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';
    return start && end ? `${start} - ${end}` : start || end;
  };

  const destination = [itinerary.destinationCity, itinerary.destinationCountry]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-emerald-400 to-teal-500">
        {/* Destination Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white line-clamp-2 mb-1">
            {itinerary.title}
          </h3>
          {destination && (
            <p className="text-white/90 text-sm flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {destination}
            </p>
          )}
        </div>

        {/* Marketplace Badge */}
        {itinerary.visibility === 'marketplace' && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
            Open to offers
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Author */}
        <div className="flex items-center gap-3 mb-3">
          {itinerary.user?.avatarUrl ? (
            <img
              src={itinerary.user.avatarUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-sm font-medium text-emerald-600">
                {itinerary.user?.fullName?.[0] || '?'}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {itinerary.user?.fullName || 'Anonymous'}
            </p>
            {formatDateRange() && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDateRange()}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {itinerary.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {itinerary.description}
          </p>
        )}

        {/* Interests Tags */}
        {itinerary.interests && itinerary.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {itinerary.interests.slice(0, 3).map((interest) => {
              const info = INTERESTS.find((i) => i.id === interest);
              return (
                <span
                  key={interest}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {info?.emoji} {info?.label || interest}
                </span>
              );
            })}
            {itinerary.interests.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{itinerary.interests.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats & Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {itinerary.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Copy className="w-4 h-4" />
              {itinerary.cloneCount}
            </span>
            {itinerary.groupSize > 1 && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {itinerary.groupSize}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/itinerary/${itinerary.id}`}
              className="px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              View
            </Link>
            <button
              onClick={onClone}
              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Clone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketplaceTripCard({ trip }: { trip: MarketplaceTrip }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const serviceNeeds = trip.marketplace_needs || [];

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group block"
    >
      {/* Header with gradient */}
      <div className="relative h-40 bg-gradient-to-br from-blue-500 to-indigo-600">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-bold text-white line-clamp-2 mb-1">{trip.title}</h3>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{trip.city}</span>
          </div>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 bg-blue-400/90 text-white text-xs font-medium rounded-full">
          {trip.proposal_count} proposal{trip.proposal_count !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Date & People */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(trip.start_date)}
          </span>
          {trip.num_people && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {trip.num_people} traveler{trip.num_people !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Services Needed */}
        {serviceNeeds.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1.5">Services needed:</p>
            <div className="flex flex-wrap gap-1.5">
              {serviceNeeds.map((service) => {
                const Icon = SERVICE_ICONS[service] || Building2;
                return (
                  <span
                    key={service}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full capitalize"
                  >
                    <Icon className="w-3 h-3" />
                    {service}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Budget */}
        {(trip.marketplace_budget_min || trip.marketplace_budget_max) && (
          <div className="flex items-center gap-1 text-sm text-emerald-600 mb-3">
            <DollarSign className="w-4 h-4" />
            <span>
              Budget: ${trip.marketplace_budget_min || 0} - ${trip.marketplace_budget_max || '∞'}
            </span>
          </div>
        )}

        {/* Creator */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {trip.creator_avatar ? (
            <img src={trip.creator_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {trip.creator_name?.[0] || '?'}
              </span>
            </div>
          )}
          <span className="text-sm text-gray-600">{trip.creator_name}</span>
        </div>
      </div>
    </Link>
  );
}
