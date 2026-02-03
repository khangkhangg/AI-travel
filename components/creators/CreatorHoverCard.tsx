'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { MapPin, Eye, Copy, FileText, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { Creator, BADGE_DEFINITIONS } from '@/lib/types/user';

interface CreatorHoverCardProps {
  creator: {
    id?: string;
    username?: string;
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
    isGuide?: boolean;
    badges?: string[];
    stats?: {
      itineraryCount: number;
      totalViews: number;
      totalClones: number;
    };
    recentItineraries?: {
      id: string;
      title: string;
      coverImage?: string;
    }[];
  } | null;
  children: ReactNode;
  disabled?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export default function CreatorHoverCard({ creator, children, disabled = false }: CreatorHoverCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'below' | 'above'>('below');
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Don't show hover card if no username (can't link to profile)
  const canShowHoverCard = !disabled && creator?.username;

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const cardHeight = 320; // Approximate card height
    setPosition(spaceBelow < cardHeight ? 'above' : 'below');
  };

  const handleMouseEnter = () => {
    if (!canShowHoverCard) return;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    showTimeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, 300); // 300ms delay before showing
  };

  const handleMouseLeave = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150); // 150ms delay before hiding (allows moving to card)
  };

  const handleCardMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleCardMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  if (!canShowHoverCard) {
    return <>{children}</>;
  }

  const displayBadges = (creator.badges || []).slice(0, 4);
  const stats = creator.stats || { itineraryCount: 0, totalViews: 0, totalClones: 0 };
  const recentItineraries = creator.recentItineraries || [];

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          href={`/profile/${creator.username}`}
          onClick={(e) => e.stopPropagation()}
          className="block"
        >
          {children}
        </Link>
      </div>

      {isVisible && (
        <div
          ref={cardRef}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
          className={`absolute z-50 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 ${
            position === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 -translate-x-1/2`}
        >
          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start gap-3">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.fullName || ''}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ring-2 ring-white shadow">
                  <span className="text-white font-semibold text-lg">
                    {creator.fullName?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  {creator.fullName || 'Unknown'}
                </h4>
                <p className="text-sm text-gray-500">@{creator.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  {creator.location && (
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{creator.location}</span>
                    </span>
                  )}
                  {creator.isGuide && (
                    <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" />
                      Guide
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {creator.bio && (
            <div className="px-4 pb-3">
              <p className="text-sm text-gray-600 line-clamp-2">{creator.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {stats.itineraryCount} itineraries
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {formatNumber(stats.totalViews)}
              </span>
              <span className="flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" />
                {formatNumber(stats.totalClones)}
              </span>
            </div>
          </div>

          {/* Recent Itineraries */}
          {recentItineraries.length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-500 mb-2">Recent:</p>
              <div className="flex gap-1.5">
                {recentItineraries.slice(0, 3).map((itinerary) => (
                  <div
                    key={itinerary.id}
                    className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0"
                    title={itinerary.title}
                  >
                    {itinerary.coverImage ? (
                      <img
                        src={itinerary.coverImage}
                        alt={itinerary.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {displayBadges.length > 0 && (
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-1">
                {displayBadges.map((badge) => {
                  const badgeDef = BADGE_DEFINITIONS[badge as keyof typeof BADGE_DEFINITIONS];
                  if (!badgeDef) return null;
                  return (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                    >
                      {badgeDef.icon}
                      {badgeDef.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* View Profile Link */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <Link
              href={`/profile/${creator.username}`}
              className="flex items-center justify-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
