'use client';

import { Tour } from '@/lib/types/tour';
import { MapPin, Clock, Users, Star, Calendar } from 'lucide-react';

interface TourCardProps {
  tour: Tour;
  compact?: boolean;
  onSelect?: (tour: Tour) => void;
}

export default function TourCard({ tour, compact = false, onSelect }: TourCardProps) {
  const coverImage = tour.images?.find(img => img.isCover) || tour.images?.[0];

  if (compact) {
    return (
      <div
        onClick={() => onSelect?.(tour)}
        className="p-3 rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer bg-white"
      >
        <div className="flex gap-3">
          {/* Image */}
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 flex-shrink-0 overflow-hidden">
            {coverImage ? (
              <img
                src={coverImage.url}
                alt={tour.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {tour.tags?.[0]?.icon || '🌍'}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 truncate">{tour.name}</h4>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {tour.city}, {tour.country}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-current" />
                {tour.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">({tour.reviewsCount})</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-teal-700">${tour.pricePerPerson}</p>
            <p className="text-xs text-gray-500">per person</p>
          </div>
        </div>

        {/* Tags */}
        {tour.tags && tour.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {tour.tags.slice(0, 3).map(tag => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600"
              >
                {tag.icon} {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect?.(tour)}
      className="rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all cursor-pointer bg-white overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-teal-100 to-cyan-100 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage.url}
            alt={tour.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {tour.tags?.[0]?.icon || '🌍'}
          </div>
        )}

        {/* Featured badge */}
        {tour.isFeatured && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
            ⭐ Featured
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
          <span className="font-bold text-teal-700">${tour.pricePerPerson}</span>
          <span className="text-xs text-gray-500">/person</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tags */}
        {tour.tags && tour.tags.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {tour.tags.slice(0, 3).map(tag => (
              <span
                key={tag.id}
                className={`px-2 py-0.5 text-xs rounded-full ${tag.color || 'bg-gray-100'} text-white`}
              >
                {tag.icon}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{tour.name}</h3>

        <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
          <MapPin className="w-4 h-4" />
          {tour.city}, {tour.country}
        </p>

        {tour.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{tour.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{tour.durationDays} {tour.durationDays === 1 ? 'day' : 'days'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>Max {tour.maxGroupSize}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold">{tour.rating.toFixed(1)}</span>
            <span className="text-gray-400">({tour.reviewsCount})</span>
          </div>
        </div>

        {/* Guide info */}
        {tour.guide && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
              {tour.guide.user?.avatarUrl ? (
                <img src={tour.guide.user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-teal-700">
                  {tour.guide.user?.fullName?.charAt(0) || 'G'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {tour.guide.businessName || tour.guide.user?.fullName}
              </p>
              {tour.guide.isVerified && (
                <span className="text-xs text-teal-600">✓ Verified Guide</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
