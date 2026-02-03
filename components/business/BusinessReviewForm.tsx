'use client';

import { useState } from 'react';
import {
  Star,
  Phone,
  MapPin,
  Package,
  DollarSign,
  Check,
  Loader2,
  X,
} from 'lucide-react';

interface BusinessReviewFormProps {
  businessId: string;
  businessName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: 'light' | 'dark';
}

export default function BusinessReviewForm({
  businessId,
  businessName,
  onSuccess,
  onCancel,
  variant = 'light',
}: BusinessReviewFormProps) {
  const isDark = variant === 'dark';

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [verifications, setVerifications] = useState({
    contact: false,
    location: false,
    services: false,
    pricing: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/businesses/${businessId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          review_text: reviewText.trim() || null,
          verified_contact: verifications.contact,
          verified_location: verifications.location,
          verified_services: verifications.services,
          verified_pricing: verifications.pricing,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const VerificationCheckbox = ({
    id,
    icon: Icon,
    label,
    description,
    checked,
    onChange,
  }: {
    id: string;
    icon: any;
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
        isDark
          ? checked
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : 'bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600'
          : checked
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
            checked
              ? 'bg-emerald-500 text-white'
              : isDark
                ? 'bg-zinc-700 border border-zinc-600'
                : 'bg-white border border-gray-300'
          }`}
        >
          {checked && <Check className="w-3 h-3" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${checked ? 'text-emerald-500' : isDark ? 'text-zinc-500' : 'text-gray-500'}`} />
          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</span>
        </div>
        <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
          {description}
        </p>
      </div>
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Write a Review
          </h3>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
            Share your experience with {businessName}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-zinc-500 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Star Rating */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
          Your Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : isDark
                      ? 'text-zinc-600'
                      : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className={`ml-2 text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
            {rating > 0 ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating] : 'Select rating'}
          </span>
        </div>
      </div>

      {/* Review Text */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
          Your Review <span className="text-zinc-500">(optional)</span>
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
          placeholder="Tell others about your experience..."
          className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
            isDark
              ? 'bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500'
              : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
          }`}
        />
      </div>

      {/* Verification Checkboxes */}
      <div>
        <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
          Help Others by Verifying <span className="text-zinc-500">(optional)</span>
        </label>
        <p className={`text-sm mb-3 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
          Check the items you can personally confirm are accurate:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <VerificationCheckbox
            id="verify-contact"
            icon={Phone}
            label="Contact Info"
            description="Phone/email is correct and responsive"
            checked={verifications.contact}
            onChange={(checked) => setVerifications({ ...verifications, contact: checked })}
          />
          <VerificationCheckbox
            id="verify-location"
            icon={MapPin}
            label="Location"
            description="Coverage areas are accurate"
            checked={verifications.location}
            onChange={(checked) => setVerifications({ ...verifications, location: checked })}
          />
          <VerificationCheckbox
            id="verify-services"
            icon={Package}
            label="Services"
            description="Services listed are as described"
            checked={verifications.services}
            onChange={(checked) => setVerifications({ ...verifications, services: checked })}
          />
          <VerificationCheckbox
            id="verify-pricing"
            icon={DollarSign}
            label="Pricing"
            description="Prices are accurate, no hidden fees"
            checked={verifications.pricing}
            onChange={(checked) => setVerifications({ ...verifications, pricing: checked })}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${
              isDark
                ? 'text-zinc-400 hover:bg-zinc-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </button>
      </div>
    </form>
  );
}
