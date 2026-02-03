'use client';

import { Store } from 'lucide-react';

export default function BusinessMarketplacePanel() {
  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="text-center py-12">
          <Store className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Trip Marketplace</p>
          <p className="text-sm text-gray-500 mt-1">
            Discover trip requests matching your coverage areas and services
          </p>
          <p className="text-sm text-gray-400 mt-4">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
