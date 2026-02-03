'use client';

import { FileText } from 'lucide-react';

export default function BusinessProposalsPanel() {
  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Proposals</h2>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No proposals yet</p>
          <p className="text-sm text-gray-500 mt-1">
            When you submit proposals to trip requests, they will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
