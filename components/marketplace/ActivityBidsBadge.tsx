'use client';

import { Briefcase, Lightbulb } from 'lucide-react';

interface ActivityBidsBadgeProps {
  count: number;
  type: 'bids' | 'suggestions';
  onClick?: () => void;
}

export default function ActivityBidsBadge({
  count,
  type,
  onClick,
}: ActivityBidsBadgeProps) {
  if (count <= 0) return null;

  const isBids = type === 'bids';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
        isBids
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      }`}
    >
      {isBids ? (
        <Briefcase className="w-3 h-3" />
      ) : (
        <Lightbulb className="w-3 h-3" />
      )}
      {count} {type === 'bids' ? (count === 1 ? 'bid' : 'bids') : (count === 1 ? 'suggestion' : 'suggestions')}
    </button>
  );
}
