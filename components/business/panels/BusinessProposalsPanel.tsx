'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Loader2,
  Clock,
  Check,
  X,
  MapPin,
  Calendar,
  ExternalLink,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

interface Proposal {
  id: string;
  trip_id: string;
  trip_title: string;
  trip_city?: string;
  trip_owner_name?: string;
  trip_owner_avatar?: string;
  trip_start_date?: string;
  activity_title?: string;
  total_price: number;
  currency: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired' | 'withdrawal_requested';
  message?: string;
  expires_at?: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  accepted: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: <Check className="w-3.5 h-3.5" />,
  },
  declined: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: <X className="w-3.5 h-3.5" />,
  },
  withdrawn: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    icon: <X className="w-3.5 h-3.5" />,
  },
  withdrawal_requested: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  expired: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

interface BusinessProposalsPanelProps {
  onStatsChange?: (totalProposals: number, pendingProposals: number) => void;
  isActive?: boolean; // True when this panel is the active section
}

export default function BusinessProposalsPanel({ onStatsChange, isActive = true }: BusinessProposalsPanelProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState<string | null>(null);
  const [withdrawalMessage, setWithdrawalMessage] = useState('');
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Helper to notify parent of stats changes
  const notifyStatsChange = (proposalsList: Proposal[]) => {
    if (onStatsChange) {
      const pendingCount = proposalsList.filter(p => p.status === 'pending').length;
      onStatsChange(proposalsList.length, pendingCount);
    }
  };

  // Fetch when filter changes
  useEffect(() => {
    fetchProposals();
  }, [filter]);

  // Refetch when panel becomes active (to get latest data after actions on other pages)
  useEffect(() => {
    if (isActive) {
      // Only refetch if it's been more than 2 seconds since last fetch (avoid double-fetch on mount)
      const now = Date.now();
      if (now - lastFetch > 2000) {
        fetchProposals();
      }
    }
  }, [isActive]);

  // Refetch when window gains focus (for cross-tab updates)
  useEffect(() => {
    const handleFocus = () => {
      // Only refetch if it's been more than 5 seconds since last fetch
      const now = Date.now();
      if (now - lastFetch > 5000) {
        fetchProposals();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [lastFetch]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setLastFetch(Date.now());
      const url = filter === 'all'
        ? '/api/businesses/me/proposals'
        : `/api/businesses/me/proposals?status=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const proposalsList = data.proposals || [];
        setProposals(proposalsList);
        // Notify parent of current stats (only when fetching all, to get accurate counts)
        if (filter === 'all') {
          notifyStatsChange(proposalsList);
        }
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Withdraw a pending proposal (immediate)
  const handleWithdraw = async (proposal: Proposal) => {
    setActionLoading(proposal.id);
    try {
      const response = await fetch(`/api/trips/${proposal.trip_id}/proposals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposal.id,
          status: 'withdrawn',
        }),
      });

      if (response.ok) {
        // Update local state
        const updatedProposals = proposals.map(p =>
          p.id === proposal.id ? { ...p, status: 'withdrawn' as const } : p
        );
        setProposals(updatedProposals);
        setConfirmWithdraw(null);
        // Notify parent of stats change
        notifyStatsChange(updatedProposals);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to withdraw proposal');
      }
    } catch (error) {
      console.error('Failed to withdraw proposal:', error);
      alert('Failed to withdraw proposal');
    } finally {
      setActionLoading(null);
    }
  };

  // Request withdrawal for accepted proposal (requires owner approval)
  const handleRequestWithdrawal = async (proposal: Proposal) => {
    setActionLoading(proposal.id);
    try {
      const response = await fetch(`/api/trips/${proposal.trip_id}/proposals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposal.id,
          status: 'withdrawal_requested',
          message: withdrawalMessage || 'Business has requested to withdraw this accepted proposal.',
        }),
      });

      if (response.ok) {
        const updatedProposals = proposals.map(p =>
          p.id === proposal.id ? { ...p, status: 'withdrawal_requested' as const } : p
        );
        setProposals(updatedProposals);
        setConfirmWithdraw(null);
        setWithdrawalMessage('');
        // Notify parent of stats change (withdrawal_requested is no longer 'pending')
        notifyStatsChange(updatedProposals);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to request withdrawal');
      }
    } catch (error) {
      console.error('Failed to request withdrawal:', error);
      alert('Failed to request withdrawal');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'USD') return `$${amount.toLocaleString()}`;
    if (currency === 'VND') return `${amount.toLocaleString()} ₫`;
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">My Proposals</h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter proposals by status"
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No proposals yet</p>
            <p className="text-sm text-gray-500 mt-1">
              When you submit proposals to trip requests, they will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const statusStyle = STATUS_STYLES[proposal.status] || STATUS_STYLES.pending;
              const isExpired = proposal.expires_at && new Date(proposal.expires_at) < new Date();

              return (
                <div
                  key={proposal.id}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/trips/${proposal.trip_id}?view=business`}
                          className="font-medium text-gray-900 hover:text-emerald-600 transition-colors"
                        >
                          {proposal.trip_title}
                        </Link>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.icon}
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                        {isExpired && proposal.status === 'pending' && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        {proposal.trip_city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {proposal.trip_city}
                          </span>
                        )}
                        {proposal.activity_title && (
                          <span className="text-purple-600">
                            for: {proposal.activity_title}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">
                        {formatCurrency(proposal.total_price, proposal.currency)}
                      </div>
                      {proposal.expires_at && proposal.status === 'pending' && !isExpired && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Valid until {formatDate(proposal.expires_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  {proposal.message && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{proposal.message}</p>
                  )}

                  {/* Withdraw Confirmation Dialog */}
                  {confirmWithdraw === proposal.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {proposal.status === 'pending' ? (
                        <>
                          <p className="text-sm text-gray-700 font-medium mb-3">
                            Withdraw this proposal?
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            This action cannot be undone. The trip owner will no longer see your proposal.
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleWithdraw(proposal)}
                              disabled={actionLoading === proposal.id}
                              className="flex-1 px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === proposal.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                              ) : (
                                'Yes, Withdraw'
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmWithdraw(null)}
                              disabled={actionLoading === proposal.id}
                              className="flex-1 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : proposal.status === 'accepted' ? (
                        <>
                          <p className="text-sm text-gray-700 font-medium mb-2">
                            Request withdrawal approval
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            Since this proposal was accepted, the trip owner must approve your withdrawal request.
                          </p>
                          <textarea
                            value={withdrawalMessage}
                            onChange={(e) => setWithdrawalMessage(e.target.value)}
                            placeholder="Explain why you need to withdraw (optional)..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3 resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleRequestWithdrawal(proposal)}
                              disabled={actionLoading === proposal.id}
                              className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === proposal.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                              ) : (
                                'Send Request'
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmWithdraw(null);
                                setWithdrawalMessage('');
                              }}
                              disabled={actionLoading === proposal.id}
                              className="flex-1 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      Submitted {formatDate(proposal.created_at)}
                      {proposal.trip_owner_name && (
                        <span>· to {proposal.trip_owner_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Withdraw button for pending proposals */}
                      {proposal.status === 'pending' && !isExpired && confirmWithdraw !== proposal.id && (
                        <button
                          type="button"
                          onClick={() => setConfirmWithdraw(proposal.id)}
                          className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          <X className="w-3 h-3" />
                          Withdraw
                        </button>
                      )}
                      {/* Request withdrawal for accepted proposals */}
                      {proposal.status === 'accepted' && confirmWithdraw !== proposal.id && (
                        <button
                          type="button"
                          onClick={() => setConfirmWithdraw(proposal.id)}
                          className="flex items-center gap-1 text-xs text-yellow-600 hover:text-yellow-700 font-medium"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Request Withdrawal
                        </button>
                      )}
                      {/* Pending withdrawal request notice */}
                      {proposal.status === 'withdrawal_requested' && (
                        <span className="text-xs text-yellow-600">
                          Awaiting owner approval
                        </span>
                      )}
                      <Link
                        href={`/trips/${proposal.trip_id}?view=business`}
                        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        View Trip <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
