'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X, MapPin, MessageSquare, Tag, Link, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import type { SuggestionFormData } from '@/lib/types/marketplace';

interface SuggestionFormProps {
  tripId: string;
  activityId?: string;
  dayNumber?: number;
  onSubmit: (data: SuggestionFormData) => Promise<void>;
  onCancel?: () => void;
  isLoggedIn?: boolean;
  onAuthRequired?: () => void;
}

interface FetchedPlace {
  name?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  priceLevel?: string;
  hours?: string;
  categories?: string[];
  coordinates?: { lat: number; lng: number };
}

const CATEGORY_OPTIONS = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'attraction', label: 'Attraction' },
  { value: 'museum', label: 'Museum' },
  { value: 'park', label: 'Park' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'other', label: 'Other' },
];

export default function SuggestionForm({
  tripId,
  activityId,
  dayNumber,
  onSubmit,
  onCancel,
  isLoggedIn = true,
  onAuthRequired,
}: SuggestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<SuggestionFormData>({
    place_name: '',
    reason: '',
    category: '',
  });
  const [error, setError] = useState<string | null>(null);

  // URL fetch state
  const [urlValue, setUrlValue] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [fetchedPlace, setFetchedPlace] = useState<FetchedPlace | null>(null);
  const lastFetchedUrl = useRef<string>('');

  // Auto-fetch when URL is pasted
  useEffect(() => {
    if (!isExpanded) {
      setFetchedPlace(null);
      return;
    }

    const trimmedUrl = urlValue.trim();

    // Skip if empty, same as last fetch, or doesn't look like a URL
    if (!trimmedUrl ||
        trimmedUrl === lastFetchedUrl.current ||
        !trimmedUrl.match(/^https?:\/\//i)) {
      return;
    }

    // Check if it looks like a complete URL
    if (!trimmedUrl.match(/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i)) {
      return;
    }

    // Debounce - wait 500ms after typing stops
    const timeoutId = setTimeout(async () => {
      lastFetchedUrl.current = trimmedUrl;
      setFetchingUrl(true);
      setFetchedPlace(null);

      try {
        const response = await fetch('/api/places/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedUrl }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.place?.name || data.place?.coordinates) {
            const place: FetchedPlace = {
              name: data.place.name,
              description: data.place.description,
              rating: data.place.rating,
              reviewCount: data.place.reviewCount,
              address: data.place.address,
              priceLevel: data.place.priceLevel,
              hours: data.place.hours,
              categories: data.place.categories,
              coordinates: data.place.coordinates,
            };
            setFetchedPlace(place);

            // Auto-fill form data from fetched place
            setFormData(prev => ({
              ...prev,
              place_name: place.name || prev.place_name,
              location_lat: place.coordinates?.lat,
              location_lng: place.coordinates?.lng,
              location_address: place.address,
              source_url: trimmedUrl,
              // Try to match category
              category: place.categories?.[0]?.toLowerCase() || prev.category,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch URL metadata:', error);
      } finally {
        setFetchingUrl(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [urlValue, isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.place_name.trim()) {
      setError('Please enter a place name');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please share why you recommend this place');
      return;
    }

    setIsSubmitting(true);
    try {
      // Include the URL if we have fetched place data
      const submitData = {
        ...formData,
        source_url: urlValue.trim() || undefined,
      };
      await onSubmit(submitData);
      // Reset form after successful submission
      setFormData({
        place_name: '',
        reason: '',
        category: '',
      });
      setUrlValue('');
      setFetchedPlace(null);
      setIsExpanded(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpandClick = () => {
    // If user is not logged in, trigger auth modal
    if (!isLoggedIn && onAuthRequired) {
      onAuthRequired();
      return;
    }
    setIsExpanded(true);
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={handleExpandClick}
        className="w-full p-4 border-2 border-dashed border-amber-400 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
      >
        <MapPin className="w-5 h-5" />
        <span className="font-medium">Suggest a Place</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-dashed border-amber-400 rounded-lg p-4 bg-amber-50/30"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-600" />
          Suggest a Better Place
        </h4>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setUrlValue('');
            setFetchedPlace(null);
            onCancel?.();
          }}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Google Maps URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Link className="w-4 h-4 inline mr-1" />
            Google Maps URL (Optional)
          </label>
          <div className="relative">
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="Paste Google Maps URL to auto-fill details..."
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            {fetchingUrl && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              </div>
            )}
            {!fetchingUrl && fetchedPlace && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>

          {/* Fetched Place Preview */}
          {fetchedPlace && (
            <div className="mt-2 p-3 bg-amber-100 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 text-sm">
                    {fetchedPlace.name || 'Unknown Place'}
                  </h5>
                  {fetchedPlace.address && (
                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      {fetchedPlace.address}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {fetchedPlace.rating && (
                      <span className="text-xs text-amber-600 font-medium">
                        ★ {fetchedPlace.rating}
                      </span>
                    )}
                    {fetchedPlace.categories?.[0] && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-200 text-amber-700 rounded">
                        {fetchedPlace.categories[0]}
                      </span>
                    )}
                    {fetchedPlace.coordinates && (
                      <span className="text-xs text-green-600 flex items-center gap-0.5">
                        📍 Location detected ({fetchedPlace.coordinates.lat.toFixed(4)}, {fetchedPlace.coordinates.lng.toFixed(4)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Place Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Place Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.place_name}
            onChange={(e) => setFormData({ ...formData, place_name: e.target.value })}
            placeholder="e.g., Ben Thanh Market, Pho Hung Restaurant"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Tag className="w-4 h-4 inline mr-1" />
            Category (Optional)
          </label>
          <select
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">Select a category</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reason/Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Why do you recommend this? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Share your experience! Why is this place special? What makes it worth visiting?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setUrlValue('');
              setFetchedPlace(null);
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
