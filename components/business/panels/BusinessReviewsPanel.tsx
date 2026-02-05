'use client';

import { useState, useEffect } from 'react';
import {
  Star,
  User,
  CheckCircle,
  MapPin,
  Phone,
  Package,
  DollarSign,
  Loader2,
  ChevronDown,
  MessageSquare,
  Send,
  Flag,
} from 'lucide-react';

type ReviewStatus = 'open' | 'resolved' | 'flagged';

interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  rating: number;
  review_text: string;
  verified_contact: boolean;
  verified_location: boolean;
  verified_services: boolean;
  verified_pricing: boolean;
  created_at: string;
  response_text?: string;
  response_at?: string;
  status: ReviewStatus;
}

interface VerificationCounts {
  verified_contact_count: number;
  verified_location_count: number;
  verified_services_count: number;
  verified_pricing_count: number;
}

interface BusinessReviewsPanelProps {
  businessId: string;
}

export default function BusinessReviewsPanel({ businessId }: BusinessReviewsPanelProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verificationCounts, setVerificationCounts] = useState<VerificationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating_high' | 'rating_low'>('recent');

  // Response form state
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<ReviewStatus>('resolved');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchReviews(1, true);
  }, [businessId, sortBy]);

  const fetchReviews = async (pageNum: number, reset = false) => {
    try {
      const response = await fetch(
        `/api/businesses/${businessId}/reviews?page=${pageNum}&limit=10&sortBy=${sortBy}`
      );
      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setReviews(data.reviews);
        } else {
          setReviews((prev) => [...prev, ...data.reviews]);
        }
        setTotalReviews(data.total);
        setAvgRating(parseFloat(data.averageRating) || 0);
        setHasMore(data.reviews.length === 10);
        setVerificationCounts(data.verificationCounts);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    fetchReviews(page + 1);
  };

  const handleStartResponse = (reviewId: string, currentStatus: ReviewStatus) => {
    setRespondingTo(reviewId);
    setResponseText('');
    setResponseStatus(currentStatus === 'open' ? 'resolved' : currentStatus);
  };

  const handleCancelResponse = () => {
    setRespondingTo(null);
    setResponseText('');
  };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;

    setSubmittingResponse(true);
    try {
      const response = await fetch(`/api/businesses/${businessId}/reviews`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          responseText: responseText.trim(),
          status: responseStatus,
        }),
      });

      if (response.ok) {
        // Update the review in local state
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  response_text: responseText.trim(),
                  response_at: new Date().toISOString(),
                  status: responseStatus,
                }
              : r
          )
        );
        setRespondingTo(null);
        setResponseText('');
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleUpdateStatus = async (reviewId: string, newStatus: ReviewStatus) => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/reviews`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const VerificationBadge = ({
    icon: Icon,
    label,
    verified,
    count,
  }: {
    icon: any;
    label: string;
    verified?: boolean;
    count?: number;
  }) => (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
        verified
          ? 'bg-emerald-50 text-emerald-700'
          : count
          ? 'bg-gray-50 text-gray-600'
          : 'bg-gray-50 text-gray-400'
      }`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      {count !== undefined && <span className="font-medium">({count})</span>}
    </div>
  );

  const StatusBadge = ({ status }: { status: ReviewStatus }) => {
    const styles = {
      open: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      flagged: 'bg-red-100 text-red-700',
    };
    const labels = {
      open: 'Open',
      resolved: 'Resolved',
      flagged: 'Flagged',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
          <p className="text-sm text-gray-500 mt-1">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            {avgRating > 0 && ` • ${avgRating.toFixed(1)} average`}
          </p>
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none px-4 py-2 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Verification Stats */}
        {verificationCounts && totalReviews > 0 && (
          <div className="bg-emerald-50/50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-3">User Verifications</h3>
            <div className="flex flex-wrap gap-2">
              <VerificationBadge
                icon={Phone}
                label="Contact Verified"
                count={verificationCounts.verified_contact_count}
              />
              <VerificationBadge
                icon={MapPin}
                label="Location Verified"
                count={verificationCounts.verified_location_count}
              />
              <VerificationBadge
                icon={Package}
                label="Services Verified"
                count={verificationCounts.verified_services_count}
              />
              <VerificationBadge
                icon={DollarSign}
                label="Pricing Verified"
                count={verificationCounts.verified_pricing_count}
              />
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No reviews yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Reviews from customers will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl border border-gray-100 p-5"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    {review.reviewer_avatar ? (
                      <img
                        src={review.reviewer_avatar}
                        alt={review.reviewer_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.reviewer_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-xs text-gray-500">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={review.status || 'open'} />
                        <select
                          value={review.status || 'open'}
                          onChange={(e) => handleUpdateStatus(review.id, e.target.value as ReviewStatus)}
                          className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white"
                          title="Change review status"
                          aria-label="Change review status"
                        >
                          <option value="open">Open</option>
                          <option value="resolved">Resolved</option>
                          <option value="flagged">Flagged</option>
                        </select>
                      </div>
                    </div>

                    {/* Review Text */}
                    {review.review_text && (
                      <p className="text-gray-700 mt-3">{review.review_text}</p>
                    )}

                    {/* Verification Badges */}
                    {(review.verified_contact ||
                      review.verified_location ||
                      review.verified_services ||
                      review.verified_pricing) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {review.verified_contact && (
                          <VerificationBadge
                            icon={Phone}
                            label="Contact"
                            verified
                          />
                        )}
                        {review.verified_location && (
                          <VerificationBadge
                            icon={MapPin}
                            label="Location"
                            verified
                          />
                        )}
                        {review.verified_services && (
                          <VerificationBadge
                            icon={Package}
                            label="Services"
                            verified
                          />
                        )}
                        {review.verified_pricing && (
                          <VerificationBadge
                            icon={DollarSign}
                            label="Pricing"
                            verified
                          />
                        )}
                      </div>
                    )}

                    {/* Existing Response */}
                    {review.response_text && (
                      <div className="mt-4 ml-0 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Your Response</span>
                          {review.response_at && (
                            <span className="text-xs text-blue-600">
                              {formatDate(review.response_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blue-900">{review.response_text}</p>
                      </div>
                    )}

                    {/* Response Form */}
                    {respondingTo === review.id ? (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Response
                        </label>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write your response to this review..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Set status:</label>
                            <select
                              value={responseStatus}
                              onChange={(e) => setResponseStatus(e.target.value as ReviewStatus)}
                              className="text-xs px-2 py-1 border border-gray-200 rounded-lg"
                              title="Set review status"
                              aria-label="Set review status"
                            >
                              <option value="open">Open</option>
                              <option value="resolved">Resolved</option>
                              <option value="flagged">Flagged</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCancelResponse}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubmitResponse(review.id)}
                              disabled={!responseText.trim() || submittingResponse}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submittingResponse ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Send
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : !review.response_text ? (
                      <button
                        type="button"
                        onClick={() => handleStartResponse(review.id, review.status || 'open')}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Respond to this review
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                Load more reviews
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
