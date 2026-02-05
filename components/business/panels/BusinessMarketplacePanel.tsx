'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Heart,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Activity,
  ChevronRight,
  Grid3X3,
  List,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Settings,
  Sparkles
} from 'lucide-react';

interface TripCreator {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
}

interface MarketplaceTrip {
  id: string;
  title: string;
  city: string;
  startDate: string | null;
  endDate: string | null;
  duration: number | null;
  description: string;
  coverImageUrl?: string;
  activityCount: number;
  travelerCount: number;
  loveCount: number;
  bidCount: number;
  hasMyBid: boolean;
  creator: TripCreator;
}

interface MarketplaceData {
  trips: MarketplaceTrip[];
  matchedCities: string[];
  totalTrips: number;
  tripsWithMyBids: number;
  message?: string;
}

type ViewMode = 'grid' | 'list';

export default function BusinessMarketplacePanel() {
  const [data, setData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    fetchMarketplaceTrips();
  }, []);

  const fetchMarketplaceTrips = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/businesses/me/marketplace-trips');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Marketplace API error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch marketplace trips');
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Error fetching marketplace trips:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return 'Dates TBD';
    if (!startDate) return `Until ${formatDate(endDate)}`;
    if (!endDate) return `From ${formatDate(startDate)}`;
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Failed to load marketplace</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button
              type="button"
              onClick={fetchMarketplaceTrips}
              className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No coverage areas configured
  if (data?.message && data.trips.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Set Up Coverage Areas</p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {data.message}
            </p>
            <Link
              href="/business?section=profile"
              className="inline-flex items-center gap-2 mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Go to Profile Settings
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No matching trips
  if (!data || data.trips.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No Matching Trips</p>
            <p className="text-sm text-gray-500 mt-1">
              No marketplace trips match your coverage areas yet
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Check back later for new opportunities
            </p>
          </div>
        </div>
      </div>
    );
  }

  const featuredTrip = data.trips[0];
  const otherTrips = data.trips.slice(1);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing trips in: {data.matchedCities.join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Stats badges */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg">
              {data.totalTrips} trip{data.totalTrips !== 1 ? 's' : ''}
            </span>
            {data.tripsWithMyBids > 0 && (
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">
                {data.tripsWithMyBids} with bids
              </span>
            )}
          </div>
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Featured Trip */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Featured Trip</h3>
          </div>
          <FeaturedTripCard trip={featuredTrip} formatDateRange={formatDateRange} />
        </div>

        {/* Other Trips */}
        {otherTrips.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-3">
              All Opportunities ({otherTrips.length})
            </h3>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} formatDateRange={formatDateRange} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {otherTrips.map((trip) => (
                  <TripListItem key={trip.id} trip={trip} formatDateRange={formatDateRange} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Featured Trip Card - Magazine style
function FeaturedTripCard({
  trip,
  formatDateRange
}: {
  trip: MarketplaceTrip;
  formatDateRange: (start: string | null, end: string | null) => string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-emerald-50 to-white">
      <div className="flex">
        {/* Image section */}
        <div className="relative w-2/5 min-h-[200px]">
          {trip.coverImageUrl ? (
            <img
              src={trip.coverImageUrl}
              alt={trip.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-white/50" />
            </div>
          )}
          {trip.hasMyBid && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Bid Submitted
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {trip.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                {trip.city}
                <span className="text-gray-300">•</span>
                <Calendar className="w-4 h-4" />
                {formatDateRange(trip.startDate, trip.endDate)}
                {trip.duration && (
                  <>
                    <span className="text-gray-300">•</span>
                    {trip.duration} day{trip.duration !== 1 ? 's' : ''}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-rose-500">
              <Heart className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{trip.loveCount}</span>
            </div>
          </div>

          {trip.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
              {trip.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                {trip.activityCount} activities
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {trip.travelerCount} traveler{trip.travelerCount !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {trip.bidCount} bid{trip.bidCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Creator avatar */}
              <div className="flex items-center gap-2">
                {trip.creator.avatarUrl ? (
                  <img
                    src={trip.creator.avatarUrl}
                    alt={trip.creator.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    {trip.creator.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm text-gray-600">{trip.creator.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Link
              href={`/trips/${trip.id}`}
              className="flex-1 text-center py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Trip
            </Link>
            <Link
              href={`/trips/${trip.id}?view=business`}
              className="flex-1 text-center py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {trip.hasMyBid ? 'View My Bid' : 'Submit Bid'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Trip Card - Grid view
function TripCard({
  trip,
  formatDateRange
}: {
  trip: MarketplaceTrip;
  formatDateRange: (start: string | null, end: string | null) => string;
}) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-32">
        {trip.coverImageUrl ? (
          <img
            src={trip.coverImageUrl}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-300" />
          </div>
        )}
        {trip.hasMyBid && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Bid
          </div>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
          <Heart className="w-3 h-3 fill-current" />
          {trip.loveCount}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{trip.title}</h4>
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <MapPin className="w-3.5 h-3.5" />
          {trip.city}
        </div>
        <div className="text-xs text-gray-500 mb-3">
          {formatDateRange(trip.startDate, trip.endDate)}
          {trip.duration && ` • ${trip.duration} days`}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{trip.activityCount} activities</span>
          <span>{trip.bidCount} bid{trip.bidCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          {trip.creator.avatarUrl ? (
            <img src={trip.creator.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              {trip.creator.name.charAt(0)}
            </div>
          )}
          <span className="text-xs text-gray-600 truncate">{trip.creator.name}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/trips/${trip.id}`}
            className="flex-1 text-center py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50"
          >
            View
          </Link>
          <Link
            href={`/trips/${trip.id}?view=business`}
            className="flex-1 text-center py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
          >
            {trip.hasMyBid ? 'My Bid' : 'Bid'}
          </Link>
        </div>
      </div>
    </div>
  );
}

// Trip List Item - Compact list view
function TripListItem({
  trip,
  formatDateRange
}: {
  trip: MarketplaceTrip;
  formatDateRange: (start: string | null, end: string | null) => string;
}) {
  return (
    <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        {trip.coverImageUrl ? (
          <img src={trip.coverImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 truncate">{trip.title}</h4>
          {trip.hasMyBid && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              <CheckCircle2 className="w-3 h-3" />
              Bid
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {trip.city}
          </span>
          <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
            {trip.loveCount}
          </span>
          <span>{trip.bidCount} bid{trip.bidCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Creator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {trip.creator.avatarUrl ? (
          <img src={trip.creator.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
            {trip.creator.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/trips/${trip.id}`}
          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100"
        >
          View
        </Link>
        <Link
          href={`/trips/${trip.id}?view=business`}
          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
        >
          {trip.hasMyBid ? 'My Bid' : 'Bid'}
        </Link>
      </div>
    </div>
  );
}
