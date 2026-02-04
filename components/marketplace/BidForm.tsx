'use client';

import { useState } from 'react';
import { Send, X, DollarSign, Calendar, FileText } from 'lucide-react';
import type { BidFormData, Business } from '@/lib/types/marketplace';

interface BidFormProps {
  tripId: string;
  activityId?: string;
  business: Business;
  onSubmit: (data: BidFormData) => Promise<void>;
  onCancel?: () => void;
  isLoggedIn?: boolean;
  onAuthRequired?: () => void;
  tripVisibility?: string;
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

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Bid'}
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
