'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CreatorCard from './CreatorCard';
import { Creator, InterestCategory } from '@/lib/types/user';

interface FeaturedSectionProps {
  category: InterestCategory;
  creators: Creator[];
  isAlgorithmic?: boolean;
}

export default function FeaturedSection({ category, creators, isAlgorithmic = false }: FeaturedSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 280; // Card width + gap
    const newScrollLeft =
      direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  if (creators.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.emoji}</span>
          <h2 className="text-xl font-semibold text-gray-900">{category.label}</h2>
          {isAlgorithmic && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Trending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/creators?interests=${category.id}`}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            See all
          </Link>
          {/* Scroll buttons (only show if there are more than 3 creators) */}
          {creators.length > 3 && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => scroll('left')}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {creators.map((creator) => (
          <CreatorCard key={creator.id} creator={creator} compact />
        ))}
      </div>
    </section>
  );
}
