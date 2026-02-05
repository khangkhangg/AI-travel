'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/landing/Header';
import type { ViewMode, UserMarketplaceContext } from '@/lib/types/marketplace';

// Dynamic import to avoid SSR issues with Leaflet
const CuratedTripView = dynamic(
  () => import('@/components/curated/CuratedTripView'),
  { ssr: false }
);

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMarketplaceContext, setUserMarketplaceContext] = useState<UserMarketplaceContext>({
    isBusiness: false,
    isGuide: false,
    isOwner: false,
    isLoggedIn: false,
    currentUser: null,
  });
  const [proposalCounts, setProposalCounts] = useState<Record<string, number>>({});
  const [suggestionCounts, setSuggestionCounts] = useState<Record<string, number>>({});
  const [hasNonHotelBid, setHasNonHotelBid] = useState(false);

  // Get view mode from URL params
  const requestedView = searchParams.get('view') as ViewMode | null;

  // Compute effective view mode based on permissions
  const viewMode = useMemo<ViewMode>(() => {
    if (requestedView === 'business' && userMarketplaceContext.isBusiness) {
      return 'business';
    }
    if (requestedView === 'creator' && !userMarketplaceContext.isOwner) {
      return 'creator';
    }
    return 'normal';
  }, [requestedView, userMarketplaceContext]);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  // Fetch business's own proposals when in business view
  useEffect(() => {
    if (viewMode === 'business' && userMarketplaceContext.isBusiness) {
      fetchBusinessProposals();
    }
  }, [viewMode, userMarketplaceContext.isBusiness, tripId]);

  const fetchBusinessProposals = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/proposals?forBusiness=true`);
      if (response.ok) {
        const data = await response.json();
        // Check if business has any active non-hotel proposals
        const hasNonHotel = data.proposals?.some((p: any) => {
          const isActive = p.status !== 'declined' && p.status !== 'expired' && p.status !== 'withdrawn';
          // We need to check the activity category from trip data
          // For now, we'll fetch this info from the activity
          return isActive && !isHotelActivity(p);
        });
        setHasNonHotelBid(hasNonHotel || false);
      }
    } catch (err) {
      console.error('Failed to fetch business proposals:', err);
    }
  };

  const isHotelActivity = (proposal: any) => {
    if (!trip || !proposal.activity_id) return false;
    const activity = trip.itinerary?.find((item: any) => item.id === proposal.activity_id);
    return activity?.category === 'hotel' || activity?.category === 'accommodation';
  };

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.ok) {
        const data = await response.json();
        setTrip(data.trip);

        // Set marketplace context from API response
        if (data.userMarketplaceContext) {
          setUserMarketplaceContext({
            ...data.userMarketplaceContext,
            isOwner: data.trip.user_role === 'owner',
          });
        } else {
          setUserMarketplaceContext(prev => ({
            ...prev,
            isOwner: data.trip.user_role === 'owner',
          }));
        }

        // Set counts from API response
        if (data.proposalCounts) {
          setProposalCounts(data.proposalCounts);
        }
        if (data.suggestionCounts) {
          setSuggestionCounts(data.suggestionCounts);
        }
      } else if (response.status === 404) {
        setError('Trip not found');
      } else if (response.status === 403) {
        setError('You do not have permission to view this trip');
      } else {
        setError('Failed to load trip');
      }
    } catch (err) {
      console.error('Failed to fetch trip:', err);
      setError('Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trip...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Trip not found'}
            </h2>
            <p className="text-gray-500 mb-4">
              The trip you're looking for doesn't exist or you don't have access.
            </p>
            <button
              onClick={() => router.push('/my-trips')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              Back to My Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CuratedTripView
      trip={trip}
      onBack={() => router.push('/my-trips')}
      viewMode={viewMode}
      userMarketplaceContext={userMarketplaceContext}
      proposalCounts={proposalCounts}
      suggestionCounts={suggestionCounts}
      hasNonHotelBid={hasNonHotelBid}
    />
  );
}
