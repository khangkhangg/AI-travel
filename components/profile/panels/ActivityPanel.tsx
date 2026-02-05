'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  MapPin,
  MessageSquare,
  Check,
  X,
  Clock,
  Loader2,
  ExternalLink,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  Heart,
} from 'lucide-react';

type ActivityType = 'suggestion_made' | 'bid_made' | 'suggestion_received' | 'bid_received' | 'trip_loved' | 'love_received';
type FilterType = 'all' | 'bids' | 'suggestions' | 'loves' | 'sent' | 'received';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  status: string;
  tripId: string;
  tripOwner?: string;
  suggesterAvatar?: string;
  businessLogo?: string;
  businessType?: string;
  message?: string;
  withdrawalReason?: string;
  createdAt: string;
}

export default function ActivityPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/users/me/activity?limit=50');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract the actual database ID from the composite activity ID
  const extractId = (activityId: string): string => {
    // IDs are formatted as: "bid-received-{uuid}", "received-{uuid}", "proposal-{uuid}", "suggestion-{uuid}"
    const parts = activityId.split('-');
    if (activityId.startsWith('bid-received-')) {
      return parts.slice(2).join('-');
    }
    return parts.slice(1).join('-');
  };

  const handleAcceptBid = async (activity: Activity) => {
    setActionLoading(activity.id);
    try {
      const proposalId = extractId(activity.id);
      const response = await fetch(`/api/trips/${activity.tripId}/proposals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId, status: 'accepted' }),
      });

      if (response.ok) {
        // Update local state
        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? { ...a, status: 'accepted' } : a))
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to accept bid');
      }
    } catch (error) {
      console.error('Failed to accept bid:', error);
      alert('Failed to accept bid');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineBid = async (activity: Activity) => {
    setActionLoading(activity.id);
    try {
      const proposalId = extractId(activity.id);
      const response = await fetch(`/api/trips/${activity.tripId}/proposals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId, status: 'declined' }),
      });

      if (response.ok) {
        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? { ...a, status: 'declined' } : a))
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to decline bid');
      }
    } catch (error) {
      console.error('Failed to decline bid:', error);
      alert('Failed to decline bid');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUseSuggestion = async (activity: Activity) => {
    setActionLoading(activity.id);
    try {
      const suggestionId = extractId(activity.id);
      const response = await fetch(`/api/trips/${activity.tripId}/suggestions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion_id: suggestionId, status: 'used' }),
      });

      if (response.ok) {
        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? { ...a, status: 'used' } : a))
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to mark suggestion as used');
      }
    } catch (error) {
      console.error('Failed to mark suggestion as used:', error);
      alert('Failed to mark suggestion as used');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissSuggestion = async (activity: Activity) => {
    setActionLoading(activity.id);
    try {
      const suggestionId = extractId(activity.id);
      const response = await fetch(`/api/trips/${activity.tripId}/suggestions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion_id: suggestionId, status: 'dismissed' }),
      });

      if (response.ok) {
        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? { ...a, status: 'dismissed' } : a))
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to dismiss suggestion');
      }
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
      alert('Failed to dismiss suggestion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveWithdrawal = async (activity: Activity) => {
    setActionLoading(activity.id);
    try {
      const proposalId = extractId(activity.id);
      const response = await fetch(`/api/trips/${activity.tripId}/proposals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId, status: 'withdrawn' }),
      });

      if (response.ok) {
        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? { ...a, status: 'withdrawn' } : a))
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve withdrawal');
      }
    } catch (error) {
      console.error('Failed to approve withdrawal:', error);
      alert('Failed to approve withdrawal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithdrawal = async (activity: Activity) => {
    setActionLoading(activity.id);
    try {
      const proposalId = extractId(activity.id);
      const response = await fetch(`/api/trips/${activity.tripId}/proposals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId, status: 'accepted' }),
      });

      if (response.ok) {
        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? { ...a, status: 'accepted' } : a))
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject withdrawal');
      }
    } catch (error) {
      console.error('Failed to reject withdrawal:', error);
      alert('Failed to reject withdrawal');
    } finally {
      setActionLoading(null);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'suggestion_made':
        return <MapPin className="w-4 h-4 text-purple-600" />;
      case 'bid_made':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'suggestion_received':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'bid_received':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'trip_loved':
      case 'love_received':
        return <Heart className="w-4 h-4 text-rose-500 fill-current" />;
      default:
        return null;
    }
  };

  const getActivityBg = (type: ActivityType) => {
    switch (type) {
      case 'suggestion_made':
        return 'bg-purple-50';
      case 'bid_made':
        return 'bg-green-50';
      case 'suggestion_received':
        return 'bg-blue-50';
      case 'bid_received':
        return 'bg-emerald-50';
      case 'trip_loved':
      case 'love_received':
        return 'bg-rose-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'used':
      case 'accepted':
        return (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" />
            {status === 'used' ? 'Used' : 'Accepted'}
          </span>
        );
      case 'dismissed':
      case 'declined':
      case 'withdrawn':
        return (
          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <X className="w-3 h-3" />
            {status === 'dismissed' ? 'Dismissed' : status === 'withdrawn' ? 'Withdrawn' : 'Declined'}
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'withdrawal_requested':
        return (
          <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Withdrawal Requested
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeLabel = (type: ActivityType) => {
    switch (type) {
      case 'suggestion_made':
        return 'Suggestion Sent';
      case 'bid_made':
        return 'Bid Sent';
      case 'suggestion_received':
        return 'Suggestion Received';
      case 'bid_received':
        return 'Bid Received';
      case 'trip_loved':
        return 'Trip Loved';
      case 'love_received':
        return 'Love Received';
      default:
        return '';
    }
  };

  // Check if activity can have actions (received items with pending status)
  const canTakeAction = (activity: Activity) => {
    const isReceived = activity.type === 'bid_received' || activity.type === 'suggestion_received';
    const isPending = activity.status === 'pending';
    const isWithdrawalRequested = activity.status === 'withdrawal_requested';
    return isReceived && (isPending || isWithdrawalRequested);
  };

  const filteredActivities = activities.filter((activity) => {
    switch (filter) {
      case 'bids':
        return activity.type === 'bid_made' || activity.type === 'bid_received';
      case 'suggestions':
        return activity.type === 'suggestion_made' || activity.type === 'suggestion_received';
      case 'loves':
        return activity.type === 'trip_loved' || activity.type === 'love_received';
      case 'sent':
        return activity.type === 'bid_made' || activity.type === 'suggestion_made' || activity.type === 'trip_loved';
      case 'received':
        return activity.type === 'bid_received' || activity.type === 'suggestion_received' || activity.type === 'love_received';
      default:
        return true;
    }
  });

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Activity' },
    { value: 'bids', label: 'Bids Only' },
    { value: 'suggestions', label: 'Suggestions Only' },
    { value: 'loves', label: 'Loves Only' },
    { value: 'sent', label: 'Sent by Me' },
    { value: 'received', label: 'Received on My Trips' },
  ];

  // Count by type for stats
  const stats = {
    bidsSent: activities.filter((a) => a.type === 'bid_made').length,
    bidsReceived: activities.filter((a) => a.type === 'bid_received').length,
    suggestionsSent: activities.filter((a) => a.type === 'suggestion_made').length,
    suggestionsReceived: activities.filter((a) => a.type === 'suggestion_received').length,
    tripsLoved: activities.filter((a) => a.type === 'trip_loved').length,
    lovesReceived: activities.filter((a) => a.type === 'love_received').length,
    pendingBids: activities.filter(
      (a) => (a.type === 'bid_made' || a.type === 'bid_received') && a.status === 'pending'
    ).length,
    pendingSuggestions: activities.filter(
      (a) =>
        (a.type === 'suggestion_made' || a.type === 'suggestion_received') && a.status === 'pending'
    ).length,
  };

  const renderActionButtons = (activity: Activity) => {
    if (!canTakeAction(activity)) return null;

    const isLoading = actionLoading === activity.id;

    if (activity.status === 'withdrawal_requested' && activity.type === 'bid_received') {
      return (
        <div className="mt-2 space-y-2">
          {/* Withdrawal Reason */}
          {activity.withdrawalReason && (
            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs font-medium text-orange-800 mb-0.5">Withdrawal Reason:</p>
              <p className="text-xs text-orange-700">{activity.withdrawalReason}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleApproveWithdrawal(activity);
              }}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3" />
              )}
              Approve Withdrawal
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRejectWithdrawal(activity);
              }}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3 h-3" />
              Keep Active
            </button>
          </div>
        </div>
      );
    }

    if (activity.type === 'bid_received' && activity.status === 'pending') {
      return (
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAcceptBid(activity);
            }}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle className="w-3 h-3" />
            )}
            Accept
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDeclineBid(activity);
            }}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <XCircle className="w-3 h-3" />
            Decline
          </button>
        </div>
      );
    }

    if (activity.type === 'suggestion_received' && activity.status === 'pending') {
      return (
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleUseSuggestion(activity);
            }}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle className="w-3 h-3" />
            )}
            Mark as Used
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDismissSuggestion(activity);
            }}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <XCircle className="w-3 h-3" />
            Dismiss
          </button>
        </div>
      );
    }

    return null;
  };

  // Separate pending items that need action (received items with pending/withdrawal_requested status)
  const pendingItems = activities.filter(
    (a) =>
      (a.type === 'bid_received' || a.type === 'suggestion_received') &&
      (a.status === 'pending' || a.status === 'withdrawal_requested')
  );

  const pendingProposals = pendingItems.filter((a) => a.type === 'bid_received');
  const pendingSuggestions = pendingItems.filter((a) => a.type === 'suggestion_received');

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Activity</h2>
          <p className="text-sm text-gray-500 mt-1">Your proposals, bids, and suggestions</p>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Pending Items */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900">Pending Actions</h3>
              {pendingItems.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {pendingItems.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
                <p className="text-sm font-medium text-gray-600">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">
                  No pending proposals or suggestions
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pending Proposals Section */}
                {pendingProposals.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 bg-emerald-50/50">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800">
                          Pending Proposals
                        </span>
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {pendingProposals.length}
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {pendingProposals.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/trips/${activity.tripId}`}
                                className="text-sm font-medium text-gray-900 hover:text-emerald-600 transition-colors block"
                              >
                                {activity.title}
                              </Link>
                              <p className="text-xs text-gray-500 mt-0.5">{activity.subtitle}</p>
                              {activity.message && (
                                <div className="mt-2 p-2 bg-gray-50 border border-gray-100 rounded-lg">
                                  <p className="text-xs text-gray-600 line-clamp-2">{activity.message}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {getStatusBadge(activity.status)}
                                <span className="text-xs text-gray-400">{formatDate(activity.createdAt)}</span>
                              </div>
                              {renderActionButtons(activity)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Suggestions Section */}
                {pendingSuggestions.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 bg-blue-50/50">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Pending Suggestions
                        </span>
                        <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                          {pendingSuggestions.length}
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {pendingSuggestions.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/trips/${activity.tripId}`}
                                className="text-sm font-medium text-gray-900 hover:text-emerald-600 transition-colors block"
                              >
                                {activity.title}
                              </Link>
                              <p className="text-xs text-gray-500 mt-0.5">{activity.subtitle}</p>
                              {activity.message && (
                                <div className="mt-2 p-2 bg-gray-50 border border-gray-100 rounded-lg">
                                  <p className="text-xs text-gray-600 line-clamp-2">{activity.message}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {getStatusBadge(activity.status)}
                                <span className="text-xs text-gray-400">{formatDate(activity.createdAt)}</span>
                              </div>
                              {renderActionButtons(activity)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - All Activity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">All Activity</h3>
              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  {filterOptions.find((o) => o.value === filter)?.label}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showFilterMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      {filterOptions.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => {
                            setFilter(option.value);
                            setShowFilterMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                            filter === option.value ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{stats.bidsSent}</p>
                    <p className="text-xs text-gray-500">Bids Sent</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{stats.bidsReceived}</p>
                    <p className="text-xs text-gray-500">Bids Received</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{stats.suggestionsSent}</p>
                    <p className="text-xs text-gray-500">Suggestions Sent</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{stats.suggestionsReceived}</p>
                    <p className="text-xs text-gray-500">Suggestions Received</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-rose-500 fill-current" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{stats.tripsLoved}</p>
                    <p className="text-xs text-gray-500">Trips Loved</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-rose-500 fill-current" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{stats.lovesReceived}</p>
                    <p className="text-xs text-gray-500">Loves Received</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity List */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  {filter === 'all' ? 'All Activity' : filterOptions.find((o) => o.value === filter)?.label}
                  <span className="text-gray-400 font-normal ml-2">({filteredActivities.length})</span>
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Proposals and suggestions will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                  {filteredActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${getActivityBg(activity.type)} flex items-center justify-center shrink-0`}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-gray-400">{getTypeLabel(activity.type)}</span>
                        </div>
                        <Link
                          href={`/trips/${activity.tripId}`}
                          className="text-sm font-medium text-gray-900 hover:text-emerald-600 transition-colors block truncate"
                        >
                          {activity.title}
                        </Link>
                        <p className="text-xs text-gray-500 truncate">{activity.subtitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(activity.status)}
                          <span className="text-xs text-gray-400">{formatDate(activity.createdAt)}</span>
                        </div>
                      </div>
                      <Link
                        href={`/trips/${activity.tripId}`}
                        className="shrink-0 mt-1"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
