'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Users, Loader2, Search, Filter, ChevronDown, MapPin } from 'lucide-react';
import Header from '@/components/landing/Header';
import { CreatorCard, FeaturedSection } from '@/components/creators';
import { Creator, CreatorCategory, INTEREST_CATEGORIES, InterestCategory } from '@/lib/types/user';

interface FeaturedCategories {
  [key: string]: {
    emoji: string;
    label: string;
    creators: Creator[];
    isAlgorithmic: boolean;
  };
}

export default function CreatorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state from URL
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState<CreatorCategory | 'all'>(
    (searchParams.get('category') as CreatorCategory | 'all') || 'all'
  );
  const [interests, setInterests] = useState<string[]>(
    searchParams.get('interests')?.split(',').filter(Boolean) || []
  );
  const [city, setCity] = useState(searchParams.get('city') || '');

  // Data state
  const [featuredCategories, setFeaturedCategories] = useState<FeaturedCategories>({});
  const [creators, setCreators] = useState<Creator[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Loading state
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = search || category !== 'all' || interests.length > 0 || city;

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setInterests([]);
    setCity('');
  };

  const toggleInterest = (interestId: string) => {
    if (interests.includes(interestId)) {
      setInterests(interests.filter((i) => i !== interestId));
    } else {
      setInterests([...interests, interestId]);
    }
  };

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category !== 'all') params.set('category', category);
    if (interests.length > 0) params.set('interests', interests.join(','));
    if (city) params.set('city', city);

    const newUrl = params.toString() ? `?${params.toString()}` : '/creators';
    router.replace(newUrl, { scroll: false });
  }, [search, category, interests, city, router]);

  // Fetch featured creators
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoadingFeatured(true);
        const res = await fetch('/api/creators/featured');
        if (res.ok) {
          const data = await res.json();
          setFeaturedCategories(data.categories || {});
        }
      } catch (error) {
        console.error('Failed to fetch featured creators:', error);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch creators with filters
  const fetchCreators = useCallback(
    async (loadMore = false) => {
      try {
        if (loadMore) {
          setLoadingMore(true);
        } else {
          setLoadingCreators(true);
          setOffset(0);
        }

        const currentOffset = loadMore ? offset + 12 : 0;
        const params = new URLSearchParams({
          limit: '12',
          offset: currentOffset.toString(),
        });
        if (search) params.set('search', search);
        if (category !== 'all') params.set('category', category);
        if (interests.length > 0) params.set('interests', interests.join(','));
        if (city) params.set('city', city);

        const res = await fetch(`/api/creators?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (loadMore) {
            setCreators((prev) => [...prev, ...data.creators]);
          } else {
            setCreators(data.creators);
          }
          setTotal(data.total);
          setHasMore(data.hasMore);
          setOffset(currentOffset);
          if (data.availableCities) {
            setAvailableCities(data.availableCities);
          }
        }
      } catch (error) {
        console.error('Failed to fetch creators:', error);
      } finally {
        setLoadingCreators(false);
        setLoadingMore(false);
      }
    },
    [search, category, interests, city, offset]
  );

  // Fetch creators when filters change
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCreators(false);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, category, interests, city]);

  // Show featured sections only when no filters are active
  const showFeatured =
    !search && category === 'all' && interests.length === 0 && !city;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Compact Gradient Banner */}
      <div className="pt-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold">Discover Creators</h1>
          <p className="text-emerald-100 text-sm">
            Find local experts and travel enthusiasts who share amazing itineraries
          </p>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators by name..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-emerald-300 focus:bg-white focus:outline-none"
              />
            </div>

            {/* City Dropdown */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                title="Filter by city"
                className={`pl-9 pr-8 py-3 rounded-xl border appearance-none bg-white cursor-pointer transition-colors ${
                  city
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <option value="">All Cities</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                showFilters || (category !== 'all' || interests.length > 0)
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {(category !== 'all' || interests.length > 0) && (
                <span className="px-1.5 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                  {(category !== 'all' ? 1 : 0) + interests.length}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Filter by</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Creator Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Creator Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Creators' },
                    { value: 'guide', label: 'Verified Guides' },
                    { value: 'local_expert', label: 'Local Experts' },
                    { value: 'regular', label: 'Regular Creators' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCategory(option.value as CreatorCategory | 'all')}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        category === option.value
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(INTEREST_CATEGORIES).map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        interests.includes(interest.id)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
                      }`}
                    >
                      <span>{interest.emoji}</span>
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Sections */}
        {showFeatured && !loadingFeatured && (
          <div className="mb-8">
            {Object.entries(featuredCategories).map(([categoryId, categoryData]) => {
              const interestCategory: InterestCategory = {
                id: categoryId,
                emoji: categoryData.emoji,
                label: categoryData.label,
                displayOrder: INTEREST_CATEGORIES[categoryId]?.displayOrder || 0,
              };
              return (
                <FeaturedSection
                  key={categoryId}
                  category={interestCategory}
                  creators={categoryData.creators}
                  isAlgorithmic={categoryData.isAlgorithmic}
                />
              );
            })}
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {showFeatured ? 'All Creators' : 'Search Results'}
            {!loadingCreators && (
              <span className="text-gray-500 font-normal ml-2">({total} creators)</span>
            )}
          </h2>
        </div>

        {/* Creators Grid */}
        {loadingCreators ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No creators found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {creators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => fetchCreators(true)}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${total - creators.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
