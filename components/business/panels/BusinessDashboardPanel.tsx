'use client';

import Link from 'next/link';
import {
  Star,
  FileText,
  Eye,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface BusinessDashboardPanelProps {
  business: {
    id: string;
    businessName: string;
    businessType: string;
    rating: number;
    reviewCount: number;
    ekycStatus: 'pending' | 'verified' | 'rejected' | null;
  };
  stats: {
    totalProposals: number;
    pendingProposals: number;
    activeServices: number;
    profileViews: number;
  };
}

export default function BusinessDashboardPanel({ business, stats }: BusinessDashboardPanelProps) {
  const getEkycStatusBadge = () => {
    switch (business.ekycStatus) {
      case 'verified':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
            <ShieldCheck className="w-3 h-3" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
            Not Verified
          </span>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {business.businessName}</p>
        </div>
        {getEkycStatusBadge()}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {business.rating > 0 ? business.rating.toFixed(1) : '—'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Rating</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {business.reviewCount} {business.reviewCount === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProposals}</p>
                <p className="text-sm text-gray-500 mt-1">Total Proposals</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            {stats.pendingProposals > 0 && (
              <div className="mt-3 flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="w-3 h-3" />
                <span>{stats.pendingProposals} pending</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.activeServices}</p>
                <p className="text-sm text-gray-500 mt-1">Active Services</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.profileViews}</p>
                <p className="text-sm text-gray-500 mt-1">Profile Views</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Verification Alert */}
        {!business.ekycStatus && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">Complete your verification</h4>
              <p className="text-sm text-amber-700 mt-1">
                Upload your business license and owner ID to get verified and build trust with customers.
              </p>
              <Link
                href="/business?section=verification"
                className="inline-block mt-2 text-sm font-medium text-amber-700 hover:text-amber-800"
              >
                Start verification →
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/business/${business.id}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Profile
            </Link>
            <Link
              href="/business?section=proposals"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium text-emerald-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              View Proposals
            </Link>
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
      </div>
    </div>
  );
}
