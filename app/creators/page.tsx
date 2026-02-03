'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Users, Loader2 } from 'lucide-react';
import { CreatorCard, FeaturedSection, CreatorFilters } from '@/components/creators';
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
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Discover Creators</h1>
          </div>
          <p className="text-emerald-100 text-lg">
            Find local experts and travel enthusiasts who share amazing itineraries
          </p>
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

        {/* Filters */}
        <CreatorFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          interests={interests}
          onInterestsChange={setInterests}
          city={city}
          onCityChange={setCity}
          availableCities={availableCities}
        />

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
