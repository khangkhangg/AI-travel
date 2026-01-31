'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ArrowLeft,
  Filter,
  Building2,
  MessageSquare,
  ChevronDown,
  Send,
  X,
  Briefcase,
} from 'lucide-react';
import { Itinerary } from '@/lib/types/user';

// Itinerary type for marketplace views
type MarketplaceItinerary = Itinerary;

export default function MarketplacePage() {
  const router = useRouter();
  const [itineraries, setItineraries] = useState<MarketplaceItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [minGroupSize, setMinGroupSize] = useState<number | null>(null);

  // Offer modal
  const [selectedItinerary, setSelectedItinerary] = useState<MarketplaceItinerary | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const fetchItineraries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('openToOffers', 'true');
      if (searchQuery) params.set('destination', searchQuery);
      if (dateRange.start) params.set('startDate', dateRange.start);
      if (dateRange.end) params.set('endDate', dateRange.end);

      const response = await fetch(`/api/itineraries?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        let filtered = data.itineraries;
        if (minGroupSize) {
          filtered = filtered.filter((i: MarketplaceItinerary) => i.groupSize >= minGroupSize);
        }
        setItineraries(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace itineraries:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, dateRange, minGroupSize]);

  useEffect(() => {
    fetchItineraries();
  }, [fetchItineraries]);

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    setMinGroupSize(null);
  };

  const hasActiveFilters = searchQuery || dateRange.start || dateRange.end || minGroupSize;

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
                <h1 className="font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-500" />
                  Business Marketplace
                </h1>
                <p className="text-xs text-gray-500">
                  Connect with travelers open to offers
                </p>
              </div>
            </div>
            <Link
              href="/business/dashboard"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              My Business
            </Link>
          </div>
        </div>
      </header>

      {/* Info Banner */}
      <div className="bg-amber-50 border-b border-amber-100 py-3">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-sm text-amber-800">
            <strong>For Hotels & Tour Guides:</strong> Browse travelers who have opted in to receive offers.
            Send personalized offers for accommodations or guided tours.
          </p>
        </div>
      </div>

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
                placeholder="Search by destination (e.g., Bali, Tokyo)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-amber-300 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Filter travelers</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-amber-600 hover:text-amber-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Arriving after
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Departing before
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Min group size
                  </label>
                  <select
                    value={minGroupSize || ''}
                    onChange={(e) => setMinGroupSize(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-300 focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="2">2+ travelers</option>
                    <option value="4">4+ travelers</option>
                    <option value="6">6+ travelers</option>
                    <option value="10">10+ travelers</option>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-20 bg-gray-200 rounded mb-4" />
                <div className="h-10 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : itineraries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {itineraries.map((itinerary) => (
              <TravelerCard
                key={itinerary.id}
                itinerary={itinerary}
                onContact={() => {
                  setSelectedItinerary(itinerary);
                  setShowOfferModal(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No travelers currently seeking offers
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Check back soon for travelers visiting your area'}
            </p>
          </div>
        )}
      </main>

      {/* Offer Modal */}
      {showOfferModal && selectedItinerary && (
        <OfferModal
          itinerary={selectedItinerary}
          onClose={() => {
            setShowOfferModal(false);
            setSelectedItinerary(null);
          }}
          onSuccess={() => {
            setShowOfferModal(false);
            setSelectedItinerary(null);
            // Could show a success toast here
          }}
        />
      )}
    </div>
  );
}

function TravelerCard({
  itinerary,
  onContact,
}: {
  itinerary: MarketplaceItinerary;
  onContact: () => void;
}) {
  const formatDateRange = () => {
    if (!itinerary.startDate && !itinerary.endDate) return 'Dates flexible';
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
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            {itinerary.title}
          </h3>
          {destination && (
            <p className="text-amber-600 flex items-center gap-1 text-sm font-medium">
              <MapPin className="w-4 h-4" />
              {destination}
            </p>
          )}
        </div>
        <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
          Open to offers
        </div>
      </div>

      {/* Traveler Info */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
        {itinerary.user?.avatarUrl ? (
          <img
            src={itinerary.user.avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-sm font-medium text-amber-600">
              {itinerary.user?.fullName?.[0] || '?'}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">
            {itinerary.user?.fullName || 'Anonymous Traveler'}
          </p>
          <p className="text-sm text-gray-500">Traveler</p>
        </div>
      </div>

      {/* Trip Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{formatDateRange()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{itinerary.groupSize} {itinerary.groupSize === 1 ? 'traveler' : 'travelers'}</span>
        </div>
      </div>

      {/* Interests */}
      {itinerary.interests && itinerary.interests.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {itinerary.interests.slice(0, 4).map((interest) => (
            <span
              key={interest}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize"
            >
              {interest}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {itinerary.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {itinerary.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href={`/itinerary/${itinerary.id}`}
          className="flex-1 py-2.5 text-center rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          View Itinerary
        </Link>
        <button
          onClick={onContact}
          className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Send Offer
        </button>
      </div>
    </div>
  );
}

function OfferModal({
  itinerary,
  onClose,
  onSuccess,
}: {
  itinerary: MarketplaceItinerary;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [businessType, setBusinessType] = useState<'hotel' | 'guide'>('hotel');
  const [businessId, setBusinessId] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [offerDetails, setOfferDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, [businessType]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const endpoint = businessType === 'hotel' ? '/api/hotels?mine=true' : '/api/guides?mine=true';
      const response = await fetch(endpoint);
      const data = await response.json();
      setBusinesses(businessType === 'hotel' ? data.hotels || [] : data.guides || []);
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !offerDetails) {
      setError('Please select a business and provide offer details');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/business-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType,
          businessId,
          itineraryId: itinerary.id,
          offerDetails: { description: offerDetails },
          message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send offer');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Send Offer</h3>
            <p className="text-sm text-gray-500">to {itinerary.user?.fullName || 'Traveler'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a...
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBusinessType('hotel')}
                className={`flex-1 py-2.5 rounded-xl border-2 font-medium transition-colors ${
                  businessType === 'hotel'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Hotel / Property
              </button>
              <button
                type="button"
                onClick={() => setBusinessType('guide')}
                className={`flex-1 py-2.5 rounded-xl border-2 font-medium transition-colors ${
                  businessType === 'guide'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Tour Guide
              </button>
            </div>
          </div>

          {/* Business Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select your {businessType === 'hotel' ? 'property' : 'profile'}
            </label>
            {loading ? (
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : businesses.length > 0 ? (
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:border-amber-300 focus:bg-white focus:outline-none"
              >
                <option value="">Select...</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} - {b.city}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 py-2">
                No {businessType === 'hotel' ? 'hotels' : 'tour guide profiles'} registered.{' '}
                <Link href={businessType === 'hotel' ? '/hotel/register' : '/guide/register'} className="text-amber-600 hover:underline">
                  Register one first
                </Link>
              </p>
            )}
          </div>

          {/* Offer Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={offerDetails}
              onChange={(e) => setOfferDetails(e.target.value)}
              placeholder={businessType === 'hotel'
                ? 'e.g., "10% off your stay, free breakfast included, room upgrade..."'
                : 'e.g., "Half-day city tour, local food experience, airport pickup..."'
              }
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:border-amber-300 focus:bg-white focus:outline-none resize-none"
            />
          </div>

          {/* Personal Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note to the traveler..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:border-amber-300 focus:bg-white focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !businessId || !offerDetails}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
