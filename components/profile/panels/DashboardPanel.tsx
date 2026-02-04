'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Eye,
  Copy,
  Map,
  TrendingUp,
  Plus,
  ExternalLink,
  MapPin,
  DollarSign,
  MessageSquare,
  Check,
  X,
  Clock,
  Loader2,
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'suggestion_made' | 'bid_made' | 'suggestion_received' | 'bid_received';
  title: string;
  subtitle: string;
  status: string;
  tripId: string;
  tripOwner?: string;
  suggesterAvatar?: string;
  businessLogo?: string;
  businessType?: string;
  createdAt: string;
}

interface DashboardPanelProps {
  stats: {
    totalViews: number;
    totalClones: number;
    itinerariesCount: number;
    publicItinerariesCount: number;
    countriesVisited: number;
  };
  username?: string;
}

export default function DashboardPanel({ stats, username }: DashboardPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch('/api/users/me/activity?limit=5');
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchActivity();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'suggestion_made':
        return <MapPin className="w-4 h-4 text-purple-600" />;
      case 'bid_made':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'suggestion_received':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'bid_received':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      default:
        return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'suggestion_made':
        return 'bg-purple-50';
      case 'bid_made':
        return 'bg-green-50';
      case 'suggestion_received':
        return 'bg-blue-50';
      case 'bid_received':
        return 'bg-emerald-50';
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

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalViews}</p>
                <p className="text-sm text-gray-500 mt-1">Total Views</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>Profile engagement</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClones}</p>
                <p className="text-sm text-gray-500 mt-1">Itineraries Cloned</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Copy className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
              <span>By other travelers</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.countriesVisited}</p>
                <p className="text-sm text-gray-500 mt-1">Countries Visited</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Map className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
              <span>Your travel footprint</span>
            </div>
          </div>
        </div>

        {/* Itineraries Overview */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Your Itineraries</h3>
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <span className="text-gray-600">Total Itineraries</span>
            <span className="font-semibold text-gray-900">{stats.itinerariesCount}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-gray-600">Public Itineraries</span>
            <span className="font-semibold text-gray-900">{stats.publicItinerariesCount}</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>

          {loadingActivity ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">
                Suggestions and bids you make will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/trips/${activity.tripId}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg ${getActivityBg(activity.type)} flex items-center justify-center flex-shrink-0`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{activity.subtitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(activity.status)}
                      <span className="text-xs text-gray-400">{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {username && (
              <Link
                href={`/profile/${username}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Profile
              </Link>
            )}
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium text-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Trip
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
