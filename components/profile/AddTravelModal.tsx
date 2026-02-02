'use client';

import { useState } from 'react';
import { X, MapPin, Calendar, Search } from 'lucide-react';

interface AddTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TravelData) => Promise<void>;
  initialData?: TravelData;
  isWishlist?: boolean;
}

interface TravelData {
  id?: string;
  city: string;
  country: string;
  year?: number;
  month?: number;
  notes?: string;
  lat?: number;
  lng?: number;
  isWishlist?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const POPULAR_COUNTRIES = [
  'United States', 'Japan', 'France', 'Italy', 'Spain', 'Thailand',
  'United Kingdom', 'Germany', 'Australia', 'Canada', 'Mexico', 'Brazil'
];

export default function AddTravelModal({ isOpen, onClose, onSave, initialData, isWishlist = false }: AddTravelModalProps) {
  const [formData, setFormData] = useState<TravelData>(initialData || {
    city: '',
    country: '',
    year: undefined,
    month: undefined,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city || !formData.country) {
      setError('City and country are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Try to geocode the location
      let lat: number | undefined;
      let lng: number | undefined;

      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${formData.city}, ${formData.country}`)}&limit=1`
        );
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.length > 0) {
          lat = parseFloat(geocodeData[0].lat);
          lng = parseFloat(geocodeData[0].lon);
        }
      } catch (err) {
        console.warn('Geocoding failed:', err);
      }

      await onSave({ ...formData, lat, lng, isWishlist });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const searchLocation = async () => {
    if (!formData.city) return;

    setSearching(true);
    try {
      const query = formData.country
        ? `${formData.city}, ${formData.country}`
        : formData.city;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();

      if (data.length > 0) {
        // Parse the display name to extract city and country
        const parts = data[0].display_name.split(', ');
        const city = parts[0];
        const country = parts[parts.length - 1];

        setFormData(prev => ({
          ...prev,
          city,
          country,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        }));
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isWishlist ? 'border-amber-100 bg-amber-50' : 'border-gray-100'}`}>
          <h3 className={`font-semibold ${isWishlist ? 'text-amber-800' : 'text-gray-900'}`}>
            {initialData ? 'Edit Place' : isWishlist ? 'Add to Wishlist' : 'Add Place Visited'}
          </h3>
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

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                onBlur={searchLocation}
                placeholder="e.g., Tokyo"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:border-emerald-300 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={searchLocation}
                disabled={searching}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Search className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              placeholder="e.g., Japan"
              list="countries"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:border-emerald-300 focus:bg-white focus:outline-none"
            />
            <datalist id="countries">
              {POPULAR_COUNTRIES.map(country => (
                <option key={country} value={country} />
              ))}
            </datalist>
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={formData.month || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:border-emerald-300 focus:bg-white focus:outline-none"
              >
                <option value="">Select month</option>
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={formData.year || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:border-emerald-300 focus:bg-white focus:outline-none"
              >
                <option value="">Select year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={isWishlist ? "Why do you want to visit this place?" : "What did you love about this place?"}
              rows={3}
              className={`w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:bg-white focus:outline-none resize-none ${
                isWishlist ? 'focus:border-amber-300' : 'focus:border-emerald-300'
              }`}
            />
          </div>

          {/* Coordinates preview */}
          {formData.lat && formData.lng && (
            <p className="text-xs text-gray-500">
              📍 Coordinates: {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
            </p>
          )}

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
              disabled={saving || !formData.city || !formData.country}
              className={`flex-1 py-2.5 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                isWishlist
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {saving ? 'Saving...' : (initialData ? 'Update' : isWishlist ? 'Add to Wishlist' : 'Add Place')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
