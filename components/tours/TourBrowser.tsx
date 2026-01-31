'use client';

import { useState, useEffect } from 'react';
import { Tour, TourTag } from '@/lib/types/tour';
import TourCard from './TourCard';
import { Search, Filter, X, ChevronDown, Compass, TrendingUp, MapPin } from 'lucide-react';

interface TourBrowserProps {
  destination?: string;
  compact?: boolean;
  onSelectTour?: (tour: Tour) => void;
  maxHeight?: string;
}

export default function TourBrowser({ destination, compact = false, onSelectTour, maxHeight }: TourBrowserProps) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [tags, setTags] = useState<TourTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'rating' | 'price_low' | 'price_high'>('featured');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch tags on mount
  useEffect(() => {
    fetch('/api/tours/tags')
      .then(res => res.json())
      .then(data => {
        if (data.tags) setTags(data.tags);
      })
      .catch(err => console.error('Failed to fetch tags:', err));
  }, []);

  // Fetch tours when filters change
  useEffect(() => {
    fetchTours();
  }, [destination, searchQuery, selectedTags, sortBy, page]);

  const fetchTours = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add destination filter if provided
      if (destination) {
        // Try to extract city from destination
        const cityMatch = destination.match(/([A-Z][a-zA-Z]+)/);
        if (cityMatch) {
          params.set('search', cityMatch[1]);
        }
      }

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      if (selectedTags.length > 0) {
        params.set('tags', selectedTags.join(','));
      }

      params.set('sort', sortBy);
      params.set('page', page.toString());
      params.set('limit', compact ? '5' : '10');

      const response = await fetch(`/api/tours?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTours(data.tours || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.error || 'Failed to fetch tours');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSortBy('featured');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || sortBy !== 'featured';

  if (compact) {
    return (
      <div className="h-full flex flex-col" style={{ maxHeight }}>
        {/* Compact Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={destination ? `Tours in ${destination}...` : 'Search tours...'}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-gray-100 border border-transparent focus:border-teal-300 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Quick tag filters */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
            {tags.slice(0, 6).map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tag.icon}</span>
                <span>{tag.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tour List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={fetchTours} className="mt-2 text-sm text-teal-600 hover:underline">
                Try again
              </button>
            </div>
          ) : tours.length === 0 ? (
            <div className="text-center py-8">
              <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No tours found</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-2 text-sm text-teal-600 hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {tours.map(tour => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  compact={true}
                  onSelect={onSelectTour}
                />
              ))}

              {/* Load more */}
              {page < totalPages && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="w-full py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  Load more ({total - tours.length} remaining)
                </button>
              )}
            </>
          )}
        </div>

        {/* Become a guide CTA */}
        <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
          <p className="text-xs text-gray-600 mb-2">Are you a local expert?</p>
          <a
            href="/guide/register"
            className="block w-full py-2 text-center text-sm font-semibold text-teal-700 bg-white rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors"
          >
            Become a Tour Guide
          </a>
        </div>
      </div>
    );
  }

  // Full browser view
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search tours, activities, experiences..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:border-teal-300 focus:bg-white focus:outline-none text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedTags.map(tagId => {
              const tag = tags.find(t => t.id === tagId);
              return tag ? (
                <span
                  key={tagId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs"
                >
                  {tag.icon} {tag.name}
                  <button onClick={() => toggleTag(tagId)} className="hover:text-teal-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : null;
            })}
            {sortBy !== 'featured' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                Sort: {sortBy.replace('_', ' ')}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {/* Sort options */}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Sort by</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'featured', label: 'Featured', icon: TrendingUp },
                  { value: 'rating', label: 'Top Rated', icon: TrendingUp },
                  { value: 'price_low', label: 'Price: Low to High', icon: ChevronDown },
                  { value: 'price_high', label: 'Price: High to Low', icon: ChevronDown },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as typeof sortBy)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      sortBy === option.value
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag filters */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Categories</p>
              <div className="flex gap-2 flex-wrap">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results info */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${total} tours found`}
            {destination && <span className="text-teal-600"> near {destination}</span>}
          </p>
        </div>
      </div>

      {/* Tours grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={fetchTours}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : tours.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Compass className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No tours found</h3>
            <p className="text-sm text-gray-500 text-center max-w-xs mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms'
                : destination
                  ? `No tours available in ${destination} yet. Be the first to create one!`
                  : 'No tours available. Be the first to create one!'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tours.map(tour => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  onSelect={onSelectTour}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Become a guide CTA */}
      <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Share your local expertise</p>
            <p className="text-sm text-gray-600">Create tours and earn as a guide</p>
          </div>
          <a
            href="/guide/register"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Become a Guide
          </a>
        </div>
      </div>
    </div>
  );
}
