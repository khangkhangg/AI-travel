'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface TripFormProps {
  onSubmit: (trip: any) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export default function TripForm({ onSubmit, isGenerating, setIsGenerating }: TripFormProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    numPeople: 1,
    budgetPerPerson: '',
    city: '',
    budgetRange: '',
    travelType: [] as string[],
    ageRange: '',
    description: '',
  });

  const [error, setError] = useState('');

  const travelTypes = [
    'Fun', 'Sightseeing', 'Museum', 'Adventure', 'Beach',
    'Food Tour', 'Shopping', 'Nightlife', 'Nature', 'Culture', 'Relaxation'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.startDate || !formData.endDate) {
      setError('Please select travel dates');
      return;
    }

    if (formData.travelType.length === 0) {
      setError('Please select at least one travel type');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          numPeople: parseInt(formData.numPeople.toString()),
          budgetPerPerson: formData.budgetPerPerson ? parseFloat(formData.budgetPerPerson) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate trip');
      }

      onSubmit(data.trip);
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const toggleTravelType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      travelType: prev.travelType.includes(type)
        ? prev.travelType.filter(t => t !== type)
        : [...prev.travelType, type]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Sparkles className="w-6 h-6 text-blue-600" />
        <h3 className="text-2xl font-bold text-gray-900">Tell us about your trip</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Number of People and Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of People <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            required
            value={formData.numPeople}
            onChange={(e) => setFormData({ ...formData, numPeople: parseInt(e.target.value) || 1 })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget per Person (USD)
          </label>
          <input
            type="number"
            min="0"
            placeholder="e.g., 1000"
            value={formData.budgetPerPerson}
            onChange={(e) => setFormData({ ...formData, budgetPerPerson: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* City and Budget Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination City
          </label>
          <input
            type="text"
            placeholder="e.g., Paris, Tokyo, New York"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Range
          </label>
          <select
            value={formData.budgetRange}
            onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select range</option>
            <option value="budget">Budget ($ - $$)</option>
            <option value="moderate">Moderate ($$ - $$$)</option>
            <option value="luxury">Luxury ($$$$ - $$$$$)</option>
          </select>
        </div>
      </div>

      {/* Travel Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Type of Travel <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {travelTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleTravelType(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                formData.travelType.includes(type)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Age Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Age Range
        </label>
        <select
          value={formData.ageRange}
          onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select age range</option>
          <option value="kids">Kids (0-12)</option>
          <option value="teens">Teens (13-19)</option>
          <option value="young-adults">Young Adults (20-35)</option>
          <option value="adults">Adults (36-60)</option>
          <option value="seniors">Seniors (60+)</option>
          <option value="mixed">Mixed Ages</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Details
        </label>
        <textarea
          rows={4}
          placeholder="Tell us more about your preferences, dietary restrictions, accessibility needs, or anything else we should know..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating Your Perfect Trip...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate My Itinerary</span>
          </>
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Free users: 1 trip, then 1 per month. Upgrade to Premium for unlimited trips!
      </p>
    </form>
  );
}
