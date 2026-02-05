'use client';

import { useState } from 'react';
import { Send, X, DollarSign, Calendar, FileText, Hotel, Link as LinkIcon, MapPin, Loader2 } from 'lucide-react';
import type { BidFormData, Business } from '@/lib/types/marketplace';

interface HotelStayInfo {
  checkInDay: number;
  checkOutDay: number;
  totalNights: number;
}

interface BidFormProps {
  tripId: string;
  activityId?: string;
  business: Business;
  onSubmit: (data: BidFormData) => Promise<void>;
  onCancel?: () => void;
  isLoggedIn?: boolean;
  onAuthRequired?: () => void;
  tripVisibility?: string;
  activityCategory?: string;
  hotelStayInfo?: HotelStayInfo | null;
  hasNonHotelBid?: boolean;
}

export default function BidForm({
  tripId,
  activityId,
  business,
  onSubmit,
  onCancel,
  isLoggedIn = true,
  onAuthRequired,
  tripVisibility,
  activityCategory,
  hotelStayInfo,
  hasNonHotelBid = false,
}: BidFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<BidFormData>({
    total_price: 0,
    currency: 'USD',
    expires_at: '',
    message: '',
    services_offered: [],
  });
  const [error, setError] = useState<string | null>(null);

  // Hotel duration validation state
  const [canProvideFullDuration, setCanProvideFullDuration] = useState(false);
  const [alternativeDuration, setAlternativeDuration] = useState('');

  // Location URL state
  const [locationUrl, setLocationUrl] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationData, setLocationData] = useState<{
    name?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  } | null>(null);

  const isHotel = activityCategory === 'hotel' || activityCategory === 'accommodation';
  const isMultiDayHotel = isHotel && hotelStayInfo && hotelStayInfo.totalNights > 1;

  // Debug logging
  console.log('[BidForm Debug]', {
    activityId,
    activityCategory,
    hotelStayInfo,
    isHotel,
    isMultiDayHotel,
  });

  const handleFetchLocation = async () => {
    if (!locationUrl.trim()) return;

    setFetchingLocation(true);
    setError(null);

    try {
      const response = await fetch('/api/places/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: locationUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setLocationData({
          name: data.place.name,
          address: data.place.address,
          coordinates: data.place.coordinates,
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch location from URL');
      }
    } catch (err) {
      setError('Failed to fetch location. Please check the URL.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.total_price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (!formData.expires_at) {
      setError('Please set a validity date');
      return;
    }

    // Validate hotel duration confirmation
    if (isMultiDayHotel && !canProvideFullDuration) {
      setError('Please confirm you can provide accommodation for the entire duration');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the data with required fields for API validation
      const submissionData: BidFormData = {
        ...formData,
        // API requires services_offered to be a non-empty array
        services_offered: [{
          service_name: 'Service Bid',
          description: formData.message || 'Business service offering',
        }],
        // API requires pricing_breakdown - create a simple breakdown from total_price
        pricing_breakdown: [{
          item: 'Total bid amount',
          unit_price: formData.total_price,
          total: formData.total_price,
        }],
        // Include hotel duration data if applicable
        ...(isMultiDayHotel && hotelStayInfo ? {
          hotel_duration: {
            can_provide_full_duration: canProvideFullDuration,
            original_nights: hotelStayInfo.totalNights,
            original_check_in: hotelStayInfo.checkInDay,
            original_check_out: hotelStayInfo.checkOutDay,
            alternative_offer: alternativeDuration || null,
          },
        } : {}),
        // Include location data if fetched
        ...(locationData ? {
          location_name: locationData.name,
          location_address: locationData.address,
          coordinates: locationData.coordinates,
          source_url: locationUrl,
        } : {}),
      };
      await onSubmit(submissionData);
      // Reset form after successful submission
      setFormData({
        total_price: 0,
        currency: 'USD',
        expires_at: '',
        message: '',
        services_offered: [],
      });
      setCanProvideFullDuration(false);
      setAlternativeDuration('');
      setLocationUrl('');
      setLocationData(null);
      setIsExpanded(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleExpandClick = () => {
    // If user is not logged in, trigger auth modal
    if (!isLoggedIn && onAuthRequired) {
      onAuthRequired();
      return;
    }
    setIsExpanded(true);
  };

  // Hide bid form if trip is not in marketplace status
  if (tripVisibility && tripVisibility !== 'marketplace') {
    return null;
  }

  // Hide bid form for non-hotel activities if business already has an active non-hotel bid
  if (hasNonHotelBid && !isHotel) {
    return null;
  }

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpandClick}
        className="w-full p-4 border-2 border-dashed border-green-400 rounded-lg text-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
      >
        <DollarSign className="w-5 h-5" />
        <span className="font-medium">Submit a Bid</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-dashed border-green-400 rounded-lg p-4 bg-green-50/30"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          Submit Your Bid
        </h4>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            onCancel?.();
          }}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Price
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.total_price || ''}
                onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="VND">VND</option>
            </select>
          </div>
        </div>

        {/* Validity Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Valid Until
          </label>
          <input
            type="date"
            min={getMinDate()}
            value={formData.expires_at}
            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Message/Proposal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FileText className="w-4 h-4 inline mr-1" />
            Your Proposal
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Describe what you're offering, any special inclusions, and why they should choose you..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
          />
        </div>

        {/* Location URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location (Google Maps or Website URL)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="Paste Google Maps link or website URL..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              type="button"
              onClick={handleFetchLocation}
              disabled={fetchingLocation || !locationUrl.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {fetchingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Fetch'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Add your business location so it appears on the map
          </p>
        </div>

        {/* Fetched Location Preview */}
        {locationData && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900">{locationData.name}</p>
                {locationData.address && (
                  <p className="text-xs text-green-700 mt-0.5">{locationData.address}</p>
                )}
                {locationData.coordinates && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Location saved ({locationData.coordinates.lat.toFixed(6)}, {locationData.coordinates.lng.toFixed(6)})
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hotel Duration Validation */}
        {isMultiDayHotel && hotelStayInfo && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Hotel className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-1">
                  Multi-Night Stay Required
                </h4>
                <p className="text-sm text-amber-800">
                  This hotel booking is for{' '}
                  <span className="font-bold">{hotelStayInfo.totalNights} night{hotelStayInfo.totalNights > 1 ? 's' : ''}</span>
                  {' '}(Day {hotelStayInfo.checkInDay} to Day {hotelStayInfo.checkInDay + hotelStayInfo.totalNights - 1},
                  check-out Day {hotelStayInfo.checkOutDay})
                </p>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={canProvideFullDuration}
                onChange={(e) => setCanProvideFullDuration(e.target.checked)}
                className="mt-1 w-4 h-4 text-green-600 border-amber-400 rounded focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-amber-900 group-hover:text-amber-950">
                I confirm my hotel can provide accommodation for the entire {hotelStayInfo.totalNights}-night duration
              </span>
            </label>

            {/* Optional: Alternative Duration */}
            {!canProvideFullDuration && (
              <div className="pl-7 space-y-1">
                <label className="block text-sm text-amber-700">
                  If you cannot provide the full duration, please specify what you can offer:
                </label>
                <textarea
                  value={alternativeDuration}
                  onChange={(e) => setAlternativeDuration(e.target.value)}
                  placeholder="e.g., We can only accommodate for 2 nights (Day 3-4)"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !!(isMultiDayHotel && !canProvideFullDuration)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={isMultiDayHotel && !canProvideFullDuration ? 'Please confirm hotel duration above' : ''}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : (isMultiDayHotel && !canProvideFullDuration ? 'Confirm Duration Above' : 'Submit Bid')}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              onCancel?.();
            }}
            className="px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
