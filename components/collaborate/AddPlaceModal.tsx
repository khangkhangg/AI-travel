'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Link as LinkIcon, Loader2, MapPin, Star, Clock, DollarSign, PenLine } from 'lucide-react';
import { PlaceData } from '@/lib/types/collaborate';

interface AddPlaceModalProps {
  tripId: string;
  dayNumber: number;
  totalDays: number;
  onClose: () => void;
  onPlaceAdded: () => void;
  defaultCategory?: string;
}

export default function AddPlaceModal({
  tripId,
  dayNumber,
  totalDays,
  onClose,
  onPlaceAdded,
  defaultCategory = 'attraction',
}: AddPlaceModalProps) {
  const [mode, setMode] = useState<'url' | 'manual'>('url');
  const [url, setUrl] = useState('');
  const [selectedDay, setSelectedDay] = useState(dayNumber);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PlaceData | null>(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [estimatedCost, setEstimatedCost] = useState<number | undefined>();
  const [timeStart, setTimeStart] = useState('');

  // Manual entry fields
  const [manualName, setManualName] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  // Track if we've already fetched for this URL
  const lastFetchedUrl = useRef<string>('');

  const isHotelMode = defaultCategory === 'hotel';

  // Auto-fetch when a valid URL is pasted
  useEffect(() => {
    const trimmedUrl = url.trim();

    // Skip if empty, same as last fetch, or doesn't look like a URL
    if (!trimmedUrl ||
        trimmedUrl === lastFetchedUrl.current ||
        !trimmedUrl.match(/^https?:\/\//i)) {
      return;
    }

    // Check if it looks like a complete URL (has domain)
    if (!trimmedUrl.match(/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i)) {
      return;
    }

    // Debounce - wait 500ms after typing stops
    const timeoutId = setTimeout(() => {
      lastFetchedUrl.current = trimmedUrl;
      handleFetchPreview();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [url]);

  const handleFetchPreview = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setPreview(null);

    try {
      const response = await fetch('/api/places/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.place);
        if (data.place.priceLevel) {
          // Convert price level to estimated cost
          const priceLevelMap: Record<string, number> = {
            '$': 15,
            '$$': 30,
            '$$$': 60,
            '$$$$': 100,
          };
          setEstimatedCost(priceLevelMap[data.place.priceLevel] || 25);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch place information');
      }
    } catch (err) {
      setError('Failed to fetch place information. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlace = async () => {
    if (!preview) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/trips/${tripId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: selectedDay,
          title: preview.name,
          description: preview.description,
          locationName: preview.name,
          locationAddress: preview.address,
          category,
          estimatedCost,
          timeStart,
          sourceUrl: url,
          placeData: preview,
          coordinates: preview.coordinates,
        }),
      });

      if (response.ok) {
        onPlaceAdded();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add place');
      }
    } catch (err) {
      setError('Failed to add place. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualPlace = async () => {
    if (!manualName.trim()) {
      setError('Please enter a place name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/trips/${tripId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: selectedDay,
          title: manualName,
          description: manualDescription,
          locationName: manualName,
          locationAddress: manualLocation,
          category,
          estimatedCost,
          timeStart,
        }),
      });

      if (response.ok) {
        onPlaceAdded();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add place');
      }
    } catch (err) {
      setError('Failed to add place. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {isHotelMode ? 'Add Hotel' : 'Add Place'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              mode === 'url'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            From URL
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              mode === 'manual'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PenLine className="w-4 h-4" />
            Manual Entry
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {mode === 'url' ? (
            <>
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Place URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste Google Maps or website URL..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleFetchPreview}
                    disabled={loading || !url.trim()}
                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Fetch'
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supports Google Maps links, restaurant websites, and attraction pages
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Preview Card */}
              {preview && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-gray-900">{preview.name}</h3>

                  {preview.rating && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{preview.rating}</span>
                      {preview.reviewCount && (
                        <span className="text-gray-500">({preview.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}

                  {preview.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{preview.address}</span>
                    </div>
                  )}

                  {preview.hours && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{preview.hours}</span>
                    </div>
                  )}

                  {preview.priceLevel && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>{preview.priceLevel}</span>
                    </div>
                  )}

                  {preview.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {preview.description}
                    </p>
                  )}

                  {preview.categories && preview.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {preview.categories.slice(0, 3).map((cat, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Activity Details for URL mode */}
              {preview && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* Day Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add to Day
                    </label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          Day {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="attraction">Attraction</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="cafe">Cafe</option>
                      <option value="shopping">Shopping</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="transport">Transport</option>
                      <option value="hotel">Hotel</option>
                    </select>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time (optional)
                    </label>
                    <input
                      type="time"
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Estimated Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Cost (per person)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={estimatedCost || ''}
                        onChange={(e) => setEstimatedCost(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Manual Entry Mode */
            <div className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Place Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Place Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g., Tokyo Tower, Sushi Dai..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Location/Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location / Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="e.g., Minato City, Tokyo, Japan"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Brief description of the place..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Day Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add to Day
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Day {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="attraction">Attraction</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="shopping">Shopping</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="transport">Transport</option>
                  <option value="hotel">Hotel</option>
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Estimated Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost (per person)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={estimatedCost || ''}
                    onChange={(e) => setEstimatedCost(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(preview || mode === 'manual') && (
          <div className="p-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={mode === 'url' ? handleAddPlace : handleAddManualPlace}
              disabled={loading || (mode === 'manual' && !manualName.trim())}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Add to Trip'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
