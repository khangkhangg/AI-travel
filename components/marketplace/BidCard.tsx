'use client';

import { useState } from 'react';
import { Check, X, Clock, Star, Building2, AlertCircle, MapPin, ExternalLink, Hotel } from 'lucide-react';
import type { Proposal } from '@/lib/types/marketplace';

interface BidCardProps {
  proposal: Proposal;
  isOwner: boolean;
  isOwnBid?: boolean;  // True if viewing your own bid as a business user
  onAccept?: (proposalId: string) => void;
  onDecline?: (proposalId: string) => void;
  onWithdraw?: (proposalId: string) => void;
  onRequestWithdrawal?: (proposalId: string, reason?: string) => void;
  onApproveWithdrawal?: (proposalId: string) => void;
  onRejectWithdrawal?: (proposalId: string) => void;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  guide: 'Tour Guide',
  hotel: 'Hotel',
  transport: 'Transport',
  experience: 'Experience',
  health: 'Health & Wellness',
};

const BUSINESS_TYPE_COLORS: Record<string, string> = {
  guide: 'bg-blue-100 text-blue-700',
  hotel: 'bg-amber-100 text-amber-700',
  transport: 'bg-green-100 text-green-700',
  experience: 'bg-purple-100 text-purple-700',
  health: 'bg-pink-100 text-pink-700',
};

export default function BidCard({
  proposal,
  isOwner,
  isOwnBid = false,
  onAccept,
  onDecline,
  onWithdraw,
  onRequestWithdrawal,
  onApproveWithdrawal,
  onRejectWithdrawal,
}: BidCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showWithdrawalReasonInput, setShowWithdrawalReasonInput] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');

  const handleAccept = async () => {
    if (!onAccept) return;
    setIsLoading(true);
    try {
      await onAccept(proposal.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;
    setIsLoading(true);
    try {
      await onDecline(proposal.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!onWithdraw) return;
    setIsLoading(true);
    try {
      await onWithdraw(proposal.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveWithdrawal = async () => {
    if (!onApproveWithdrawal) return;
    setIsLoading(true);
    try {
      await onApproveWithdrawal(proposal.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!onRequestWithdrawal) return;
    if (!withdrawalReason.trim()) {
      alert('Please provide a reason for withdrawal');
      return;
    }
    setIsLoading(true);
    try {
      await onRequestWithdrawal(proposal.id, withdrawalReason);
      setShowWithdrawalReasonInput(false);
      setWithdrawalReason('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!onRejectWithdrawal) return;
    setIsLoading(true);
    try {
      await onRejectWithdrawal(proposal.id);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = proposal.expires_at && new Date(proposal.expires_at) < new Date();
  const statusBadge = () => {
    if (proposal.status === 'accepted') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Accepted</span>;
    }
    if (proposal.status === 'declined') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Declined</span>;
    }
    if (proposal.status === 'withdrawn') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">Withdrawn</span>;
    }
    if (proposal.status === 'withdrawal_requested') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Withdrawal Requested</span>;
    }
    if (isExpired) {
      return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Expired</span>;
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-lg border ${proposal.status === 'accepted' ? 'border-green-300 bg-green-50/30' : 'border-gray-200'} p-4 shadow-sm`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Business Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {proposal.logo_url ? (
            <img src={proposal.logo_url} alt={proposal.business_name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Business Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-gray-900 truncate">{proposal.business_name}</h4>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${BUSINESS_TYPE_COLORS[proposal.business_type] || 'bg-gray-100 text-gray-600'}`}>
              {BUSINESS_TYPE_LABELS[proposal.business_type] || proposal.business_type}
            </span>
            {statusBadge()}
          </div>

          {/* Rating */}
          {(proposal.rating != null && Number(proposal.rating) > 0) && (
            <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>{Number(proposal.rating).toFixed(1)}</span>
              {proposal.review_count !== undefined && (
                <span className="text-gray-400">({proposal.review_count})</span>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-green-600">
            {proposal.currency === 'USD' ? '$' : proposal.currency}
            {proposal.total_price.toLocaleString()}
          </div>
          {proposal.expires_at && !isExpired && proposal.status === 'pending' && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <Clock className="w-3 h-3" />
              Valid until {formatDate(proposal.expires_at)}
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {proposal.message && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{proposal.message}</p>
      )}

      {/* Services Offered */}
      {proposal.services_offered && proposal.services_offered.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {proposal.services_offered.map((service, idx) => (
            <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {service.service_name}
            </span>
          ))}
        </div>
      )}

      {/* Hotel Duration Commitment */}
      {proposal.terms?.hotel_duration && (
        <div className={`mt-3 p-3 rounded-lg border ${
          proposal.terms.hotel_duration.can_provide_full_duration
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            <Hotel className={`w-4 h-4 ${
              proposal.terms.hotel_duration.can_provide_full_duration
                ? 'text-green-600'
                : 'text-yellow-600'
            }`} />
            <span className={`text-sm font-semibold ${
              proposal.terms.hotel_duration.can_provide_full_duration
                ? 'text-green-900'
                : 'text-yellow-900'
            }`}>
              {proposal.terms.hotel_duration.can_provide_full_duration
                ? `✓ Can host for entire ${proposal.terms.hotel_duration.original_nights}-night stay`
                : `⚠ Partial duration only`
              }
            </span>
          </div>
          {proposal.terms.hotel_duration.alternative_offer && (
            <p className="text-xs text-yellow-700 mt-1 pl-6">
              Alternative: {proposal.terms.hotel_duration.alternative_offer}
            </p>
          )}
          {proposal.terms.hotel_duration.original_check_in != null && (
            <p className="text-xs text-gray-600 mt-1 pl-6">
              Day {proposal.terms.hotel_duration.original_check_in} to Day{' '}
              {proposal.terms.hotel_duration.original_check_in! + proposal.terms.hotel_duration.original_nights - 1}
              {' '}(check-out Day {proposal.terms.hotel_duration.original_check_out})
            </p>
          )}
        </div>
      )}

      {/* Location Information */}
      {proposal.terms?.location && (proposal.terms.location.name || proposal.terms.location.address) && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              {proposal.terms.location.name && (
                <p className="text-sm font-semibold text-blue-900">{proposal.terms.location.name}</p>
              )}
              {proposal.terms.location.address && (
                <p className="text-xs text-blue-700 mt-0.5">{proposal.terms.location.address}</p>
              )}
              {proposal.terms.location.source_url && (
                <a
                  href={proposal.terms.location.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
                >
                  View on map
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons (Owner Only) */}
      {isOwner && proposal.status === 'pending' && !isExpired && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
          <button
            onClick={handleDecline}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Decline
          </button>
        </div>
      )}

      {/* Withdraw Button (Business User viewing their own pending bid) */}
      {isOwnBid && !isOwner && proposal.status === 'pending' && !isExpired && onWithdraw && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg border border-orange-200 hover:bg-orange-100 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Withdraw Bid
          </button>
        </div>
      )}

      {/* Request Withdrawal Button (Business User viewing their own accepted bid) */}
      {isOwnBid && !isOwner && proposal.status === 'accepted' && onRequestWithdrawal && (
        <div className="mt-4">
          {!showWithdrawalReasonInput ? (
            <button
              type="button"
              onClick={() => setShowWithdrawalReasonInput(true)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 text-sm font-medium rounded-lg border border-yellow-200 hover:bg-yellow-100 disabled:opacity-50 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              Request Withdrawal
            </button>
          ) : (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <label className="block text-sm font-medium text-yellow-900 mb-2">
                Reason for withdrawal request:
              </label>
              <textarea
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                placeholder="Please explain why you need to withdraw this accepted proposal..."
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                rows={3}
                disabled={isLoading}
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleRequestWithdrawal}
                  disabled={isLoading || !withdrawalReason.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawalReasonInput(false);
                    setWithdrawalReason('');
                  }}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Withdrawal Request Actions (Owner Only) */}
      {isOwner && proposal.status === 'withdrawal_requested' && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800 mb-3">
            The business has requested to withdraw this accepted proposal.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApproveWithdrawal}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
              Approve Withdrawal
            </button>
            <button
              type="button"
              onClick={handleRejectWithdrawal}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Keep Active
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
