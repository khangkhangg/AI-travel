'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MoreVertical, Briefcase, Lightbulb, Eye } from 'lucide-react';
import type { ViewMode } from '@/lib/types/marketplace';

interface ViewModeMenuProps {
  isBusiness: boolean;
  isOwner: boolean;
  currentView: ViewMode;
  tripId: string;
}

export default function ViewModeMenu({
  isBusiness,
  isOwner,
  currentView,
  tripId,
}: ViewModeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show menu if user can't switch views
  const canShowBusinessView = isBusiness;
  const canShowCreatorView = !isOwner;

  if (!canShowBusinessView && !canShowCreatorView) {
    return null;
  }

  const handleViewChange = (view: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'normal') {
      params.delete('view');
    } else {
      params.set('view', view);
    }
    const queryString = params.toString();
    router.push(`/trips/${tripId}${queryString ? `?${queryString}` : ''}`);
    setIsOpen(false);
  };

  const getViewLabel = (view: ViewMode) => {
    switch (view) {
      case 'business':
        return 'Business View';
      case 'creator':
        return 'Creator View';
      default:
        return 'Normal View';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        title="Switch view mode"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
            View Mode
          </div>

          {/* Normal View - always show when in other views */}
          {currentView !== 'normal' && (
            <button
              onClick={() => handleViewChange('normal')}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-gray-500" />
              Normal View
            </button>
          )}

          {/* Business View */}
          {canShowBusinessView && currentView !== 'business' && (
            <button
              onClick={() => handleViewChange('business')}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-green-600" />
              <span>Business View</span>
              <span className="ml-auto text-xs text-green-600 font-medium">Bid</span>
            </button>
          )}

          {/* Creator View */}
          {canShowCreatorView && currentView !== 'creator' && (
            <button
              onClick={() => handleViewChange('creator')}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Creator View</span>
              <span className="ml-auto text-xs text-amber-600 font-medium">Suggest</span>
            </button>
          )}

          {/* Current view indicator */}
          <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100 mt-1">
            Current: {getViewLabel(currentView)}
          </div>
        </div>
      )}
    </div>
  );
}
