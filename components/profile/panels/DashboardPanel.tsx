'use client';

import Link from 'next/link';
import {
  Eye,
  Copy,
  Map,
  TrendingUp,
  Plus,
  ExternalLink,
} from 'lucide-react';

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

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent activity</p>
          </div>
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
