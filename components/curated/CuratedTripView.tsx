'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Share2,
  Copy,
  Check,
  Users2,
  DollarSign,
  Bookmark,
} from 'lucide-react';
import TripMap from './TripMap';
import CreatorCard from './CreatorCard';
import CreatorProfile from './CreatorProfile';
import DayTimeline from './DayTimeline';
import TripImageUpload from './TripImageUpload';
import AuthModal from '@/components/auth/AuthModal';
import { ViewModeMenu, ServiceSuggestionsGrid } from '@/components/marketplace';
import type { ViewMode, UserMarketplaceContext, Proposal, TripSuggestion, BidFormData, SuggestionFormData } from '@/lib/types/marketplace';

interface Activity {
  id: string;
  title: string;
  description?: string;
  category?: string;
  time_slot?: string;
  estimated_cost?: number;
  location_name?: string;
  location_address?: string;
  source_url?: string;
  location_lat?: number;
  location_lng?: number;
  day_number: number;
  order_index: number;
}

interface Badge {
  badge_type: string;
  metadata?: any;
}

interface PaymentLink {
  platform: string;
  value: string;
  is_primary?: boolean;
}

interface Creator {
  id: string;
  name: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  badges?: Badge[];
  trip_count?: number;
  countries_count?: number;
}

interface CuratorInfo {
  is_local?: string;
  years_lived?: string;
  experience?: string;
}

interface Trip {
  id: string;
  title: string;
  city?: string;
  visibility?: string;
  share_code?: string;
  user_id: string;
  user_role?: string;
  curator_is_local?: string;
  curator_years_lived?: string;
  curator_experience?: string;
  itinerary_items?: Activity[];
  generated_content?: {
    itinerary?: any[];
    travelers?: any[];
  };
  creator?: Creator;
  payment_links?: PaymentLink[];
  love_count?: number;
  is_loved?: boolean;
}

interface CuratedTripViewProps {
  trip: Trip;
  onBack?: () => void;
  viewMode?: ViewMode;
  userMarketplaceContext?: UserMarketplaceContext;
  proposalCounts?: Record<string, number>;
  suggestionCounts?: Record<string, number>;
  hasNonHotelBid?: boolean;
}

interface TripImage {
  id: string;
  image_url: string;
  display_order: number;
}

export default function CuratedTripView({
  trip,
  onBack,
  viewMode = 'normal',
  userMarketplaceContext = { isBusiness: false, isGuide: false, isOwner: false, isLoggedIn: false, currentUser: null },
  proposalCounts = {},
  suggestionCounts = {},
  hasNonHotelBid = false,
}: CuratedTripViewProps) {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(1);
  const [showAllDays, setShowAllDays] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tripImages, setTripImages] = useState<TripImage[]>([]);
  const dayRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const cloneButtonRef = useRef<HTMLButtonElement>(null);

  // Love state
  const [isLoved, setIsLoved] = useState(trip.is_loved || false);
  const [loveCount, setLoveCount] = useState(trip.love_count || 0);
  const [lovingTrip, setLovingTrip] = useState(false);

  // Marketplace state
  const [proposals, setProposals] = useState<Record<string, Proposal[]>>({});
  const [suggestions, setSuggestions] = useState<Record<string, TripSuggestion[]>>({});

  // Define fetchProposals before the useEffect that uses it
  const fetchProposals = useCallback(async () => {
    try {
      // For trip owners: fetch all proposals on their trip
      // For business users (non-owners): fetch only their own proposals with ?forBusiness=true
      const isBusinessNonOwner = userMarketplaceContext.isBusiness && !userMarketplaceContext.isOwner;
      const url = isBusinessNonOwner
        ? `/api/trips/${trip.id}/proposals?forBusiness=true`
        : `/api/trips/${trip.id}/proposals`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        // Group proposals by activity_id
        const grouped: Record<string, Proposal[]> = {};
        (data.proposals || []).forEach((p: Proposal) => {
          const key = p.activity_id || 'trip';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(p);
        });
        setProposals(grouped);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    }
  }, [trip.id, userMarketplaceContext.isBusiness, userMarketplaceContext.isOwner]);

  // Fetch proposals when in business or owner view
  useEffect(() => {
    if (viewMode === 'business' || userMarketplaceContext.isOwner) {
      fetchProposals();
    }
  }, [viewMode, userMarketplaceContext.isOwner, fetchProposals]);

  // Always fetch suggestions so they can show on the map for everyone
  // (Suggestions with coordinates will appear as purple pins)
  useEffect(() => {
    fetchSuggestions();
  }, [trip.id]);

  const fetchSuggestions = async () => {
    try {
      console.log('DEBUG: Fetching suggestions for trip:', trip.id);
      const response = await fetch(`/api/trips/${trip.id}/suggestions`);
      if (response.ok) {
        const data = await response.json();
        console.log('DEBUG: Raw suggestions from API:', data.suggestions);
        console.log('DEBUG: Suggestions with coordinates:', data.suggestions?.filter((s: any) => s.location_lat && s.location_lng));
        // Group suggestions by activity_id
        const grouped: Record<string, TripSuggestion[]> = {};
        (data.suggestions || []).forEach((s: TripSuggestion) => {
          const key = s.activity_id || 'trip';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(s);
        });
        setSuggestions(grouped);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  // Handle bid submission
  const handleSubmitBid = async (activityId: string | undefined, data: BidFormData) => {
    const response = await fetch(`/api/trips/${trip.id}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        activity_id: activityId,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit bid');
    }
    await fetchProposals();
  };

  // Handle suggestion submission
  const handleSubmitSuggestion = async (activityId: string | undefined, dayNumber: number | undefined, data: SuggestionFormData) => {
    const response = await fetch(`/api/trips/${trip.id}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        activity_id: activityId,
        day_number: dayNumber,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit suggestion');
    }
    await fetchSuggestions();
  };

  // Handle accept bid (owner only)
  const handleAcceptBid = async (proposalId: string) => {
    const response = await fetch(`/api/trips/${trip.id}/proposals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: proposalId, status: 'accepted' }),
    });
    if (response.ok) {
      await fetchProposals();
    }
  };

  // Handle decline bid (owner only)
  const handleDeclineBid = async (proposalId: string) => {
    const response = await fetch(`/api/trips/${trip.id}/proposals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: proposalId, status: 'declined' }),
    });
    if (response.ok) {
      await fetchProposals();
    }
  };

  // Handle withdraw bid (business user withdrawing their own bid)
  const handleWithdrawBid = async (proposalId: string) => {
    const response = await fetch(`/api/trips/${trip.id}/proposals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: proposalId, status: 'withdrawn' }),
    });
    if (response.ok) {
      await fetchProposals();
    }
  };

  // Handle request withdrawal (business user requesting withdrawal of accepted proposal)
  const handleRequestWithdrawal = async (proposalId: string, reason?: string) => {
    const response = await fetch(`/api/trips/${trip.id}/proposals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: proposalId,
        status: 'withdrawal_requested',
        message: reason || 'Business has requested to withdraw this proposal.',
      }),
    });
    if (response.ok) {
      await fetchProposals();
    }
  };

  // Handle approve withdrawal request (owner approving business's withdrawal request)
  const handleApproveWithdrawal = async (proposalId: string) => {
    const response = await fetch(`/api/trips/${trip.id}/proposals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: proposalId, status: 'withdrawn' }),
    });
    if (response.ok) {
      await fetchProposals();
    }
  };

  // Handle reject withdrawal request (owner rejecting, keeping proposal accepted)
  const handleRejectWithdrawal = async (proposalId: string) => {
    const response = await fetch(`/api/trips/${trip.id}/proposals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: proposalId, status: 'accepted' }),
    });
    if (response.ok) {
      await fetchProposals();
    }
  };

  // Handle mark suggestion as used (owner only)
  // Also updates the activity's source_url with the suggestion's URL
  const handleMarkSuggestionUsed = async (suggestionId: string) => {
    // Find the suggestion to get its source_url and activity_id
    const allSuggestions = Object.values(suggestions).flat();
    const suggestion = allSuggestions.find(s => s.id === suggestionId);

    const response = await fetch(`/api/trips/${trip.id}/suggestions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion_id: suggestionId, status: 'used' }),
    });

    if (response.ok) {
      // If suggestion has source_url and activity_id, update the activity's URL
      if (suggestion?.source_url && suggestion?.activity_id) {
        try {
          await fetch(`/api/trips/${trip.id}/items/${suggestion.activity_id}/url`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: suggestion.source_url }),
          });
        } catch (err) {
          console.error('Failed to update activity URL:', err);
        }
      }
      await fetchSuggestions();
    }
  };

  // Handle dismiss suggestion (owner only)
  const handleDismissSuggestion = async (suggestionId: string) => {
    const response = await fetch(`/api/trips/${trip.id}/suggestions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion_id: suggestionId, status: 'dismissed' }),
    });
    if (response.ok) {
      await fetchSuggestions();
    }
  };

  // Fetch trip images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/trips/${trip.id}/images`);
        if (response.ok) {
          const data = await response.json();
          setTripImages(data.images || []);
        }
      } catch (error) {
        console.error('Failed to fetch trip images:', error);
      }
    };
    fetchImages();
  }, [trip.id]);

  // Group activities by day
  const activitiesByDay = (trip.itinerary_items || []).reduce((acc, item) => {
    const day = item.day_number;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, Activity[]>);

  // Get unique sorted day numbers
  const days = Object.keys(activitiesByDay)
    .map(Number)
    .sort((a, b) => a - b);

  // If no items, check generated_content
  const generatedDays =
    days.length === 0
      ? (trip.generated_content?.itinerary || []).map((_, i) => i + 1)
      : days;

  const allDays = days.length > 0 ? days : generatedDays;

  // Build map locations from activities (use location_lat/location_lng from database)
  const activityLocations = (trip.itinerary_items || [])
    .filter((item) => item.location_lat && item.location_lng)
    .map((item) => ({
      id: item.id,
      title: item.title,
      lat: Number(item.location_lat),
      lng: Number(item.location_lng),
      dayNumber: item.day_number,
      category: item.category,
      type: 'activity' as const,
    }));

  // Build map locations from suggestions (purple pins)
  // Show pending and used suggestions, but not dismissed ones
  const suggestionLocations = Object.values(suggestions)
    .flat()
    .filter((s) => s.location_lat && s.location_lng && s.status !== 'dismissed')
    .map((s) => ({
      id: `suggestion-${s.id}`,
      title: s.place_name,
      lat: Number(s.location_lat),
      lng: Number(s.location_lng),
      dayNumber: s.day_number || 1,
      category: s.category,
      type: 'suggestion' as const,
    }));

  // Combine activities and suggestions for the map
  const mapLocations = [...activityLocations, ...suggestionLocations];

  // Debug logging
  console.log('DEBUG: itinerary_items count:', trip.itinerary_items?.length);
  console.log('DEBUG: mapLocations count:', mapLocations.length);
  console.log('DEBUG: Items with location:', trip.itinerary_items?.filter(i => i.location_lat || i.location_lng));
  console.log('DEBUG: All suggestions:', Object.values(suggestions).flat().map(s => ({
    place_name: s.place_name,
    status: s.status,
    has_coords: !!(s.location_lat && s.location_lng),
    lat: s.location_lat,
    lng: s.location_lng
  })));
  console.log('DEBUG: suggestionLocations count:', suggestionLocations.length);

  // Calculate stats
  const totalPlaces = (trip.itinerary_items || []).length;
  const totalCost = (trip.itinerary_items || []).reduce(
    (sum, item) => sum + (item.estimated_cost || 0),
    0
  );

  // Scroll spy - detect which day is currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const dayNum = parseInt(entry.target.getAttribute('data-day') || '1');
            setActiveDay(dayNum);
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    dayRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [allDays]);

  const handleCopyShareLink = async () => {
    if (!trip.share_code) return;
    const shareUrl = `${window.location.origin}/shared/${trip.share_code}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    // Show auth modal if user is not logged in
    if (!userMarketplaceContext.isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    setSaved(!saved);
    // TODO: Implement actual save/favorite functionality
  };

  const handleClone = async () => {
    setCloning(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}/clone`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresAuth) {
          setShowCloneModal(false);
          setShowAuthModal(true);
          return;
        }
        throw new Error(data.error || 'Failed to clone trip');
      }

      // Success - redirect to cloned trip
      router.push(`/trips/${data.tripId}`);
    } catch (error) {
      console.error('Clone error:', error);
    } finally {
      setCloning(false);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    // Retry clone after successful auth
    setShowCloneModal(true);
  };

  const handleLoveClick = async () => {
    // Check if user is logged in
    if (!userMarketplaceContext.isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    setLovingTrip(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}/love`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle love');
      }

      const data = await response.json();
      setIsLoved(data.isLoved);
      setLoveCount(data.loveCount);
    } catch (error) {
      console.error('Love error:', error);
    } finally {
      setLovingTrip(false);
    }
  };

  // Check if trip date has passed (for clone button visibility)
  // If no specific date, show clone for public/curated trips
  const canShowCloneButton = trip.visibility === 'public' || trip.visibility === 'curated';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/my-trips');
    }
  };

  const handleActivityMapView = useCallback((activityId: string) => {
    // Find the activity and scroll map to it
    const activity = trip.itinerary_items?.find((item) => item.id === activityId);
    if (activity) {
      setActiveDay(activity.day_number);
    }
  }, [trip.itinerary_items]);

  const handleMapPinClick = useCallback((locationId: string) => {
    // Scroll to the activity card
    const element = document.getElementById(`activity-${locationId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Check if current user is owner/editor
  const isOwner = trip.user_role === 'owner' || trip.user_role === 'editor';

  // Handle description update
  const handleUpdateDescription = useCallback(async (activityId: string, description: string) => {
    try {
      const response = await fetch(`/api/trips/${trip.id}/items/${activityId}/description`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (response.ok) {
        // Refresh the page to get updated data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update description:', error);
    }
  }, [trip.id]);

  // Handle URL update
  const handleUpdateUrl = useCallback(async (activityId: string, url: string) => {
    try {
      const response = await fetch(`/api/trips/${trip.id}/items/${activityId}/url`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update URL:', error);
    }
  }, [trip.id]);

  // Handle location update
  const handleUpdateLocation = useCallback(async (activityId: string, lat: number, lng: number, address?: string) => {
    try {
      const response = await fetch(`/api/trips/${trip.id}/items/${activityId}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, address }),
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }, [trip.id]);

  // Build curator info from trip data
  const curatorInfo: CuratorInfo = {
    is_local: trip.curator_is_local,
    years_lived: trip.curator_years_lived,
    experience: trip.curator_experience,
  };

  // Build creator from trip owner data
  const creator: Creator = trip.creator || {
    id: trip.user_id,
    name: 'Trip Creator',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{trip.title || 'Trip Itinerary'}</h1>
                {trip.city && (
                  <p className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {trip.city}
                  </p>
                )}
              </div>
            </div>

            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">{allDays.length} days</span>
              </div>
              {totalPlaces > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">{totalPlaces} places</span>
                </div>
              )}
              {totalCost > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">~${totalCost.toLocaleString()}</span>
                </div>
              )}
              {/* Trip marketplace status (show in business/creator view) */}
              {viewMode !== 'normal' && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                    trip.visibility === 'marketplace'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  title={
                    trip.visibility === 'marketplace'
                      ? 'Open for bids and suggestions'
                      : `Status: ${trip.visibility || 'private'} - Bidding not available`
                  }
                >
                  {trip.visibility === 'marketplace' ? (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span className="font-medium">Marketplace</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium capitalize">{trip.visibility || 'Private'}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Love Button */}
              <button
                onClick={handleLoveClick}
                disabled={lovingTrip}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  isLoved
                    ? 'bg-rose-50 text-rose-500'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={isLoved ? 'Loved' : 'Love this trip'}
              >
                <Heart className={`w-5 h-5 ${isLoved ? 'fill-current' : ''}`} />
                {loveCount > 0 && (
                  <span className={`text-sm font-medium ${isLoved ? 'text-rose-600' : 'text-gray-700'}`}>
                    {loveCount}
                  </span>
                )}
              </button>

              {/* Clone Button with Dropdown */}
              {canShowCloneButton && (
                <div className="relative">
                  <button
                    ref={cloneButtonRef}
                    onClick={() => setShowCloneModal(!showCloneModal)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                    title="Clone this trip"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Clone</span>
                  </button>

                  {/* Clone Confirmation Dropdown */}
                  {showCloneModal && (
                    <>
                      {/* Backdrop to close on click outside */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCloneModal(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Copy className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Clone this trip?</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Create your own copy of this itinerary to customize and plan your adventure.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowCloneModal(false)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleClone}
                            disabled={cloning}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cloning ? 'Cloning...' : 'Proceed to clone'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {trip.share_code && trip.visibility !== 'private' && (
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </>
                  )}
                </button>
              )}
              {trip.user_role && ['owner', 'editor'].includes(trip.user_role) && (
                <button
                  onClick={() => router.push(`/trips/${trip.id}/collaborate`)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Users2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Collaborate</span>
                </button>
              )}

              {/* View Mode Menu (3-dot) */}
              <ViewModeMenu
                isBusiness={userMarketplaceContext.isBusiness}
                isOwner={userMarketplaceContext.isOwner}
                currentView={viewMode}
                tripId={trip.id}
              />

              {/* User Avatar / Visitor indicator */}
              {userMarketplaceContext.isLoggedIn && userMarketplaceContext.currentUser ? (
                <div className="flex items-center gap-2">
                  {userMarketplaceContext.currentUser.avatar_url ? (
                    <img
                      src={userMarketplaceContext.currentUser.avatar_url}
                      alt={userMarketplaceContext.currentUser.full_name || 'User'}
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-sm border-2 border-emerald-200">
                      {(userMarketplaceContext.currentUser.full_name || userMarketplaceContext.currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                  title="Click to sign in"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-xs">
                    V
                  </div>
                  <span className="text-xs text-gray-500 font-medium pr-1">Visitor</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Itinerary (60%) */}
          <div className="w-full lg:w-3/5 order-2 lg:order-1">
            {allDays.length > 0 ? (
              <div className="space-y-8">
                {allDays.map((day) => {
                  const dayActivities = activitiesByDay[day] || [];
                  const generatedDay = trip.generated_content?.itinerary?.[day - 1];

                  return (
                    <DayTimeline
                      key={day}
                      ref={(el) => {
                        if (el) dayRefs.current.set(day, el);
                      }}
                      dayNumber={day}
                      dayTitle={generatedDay?.title}
                      activities={dayActivities}
                      onActivityMapView={handleActivityMapView}
                      onUpdateDescription={handleUpdateDescription}
                      onUpdateUrl={handleUpdateUrl}
                      onUpdateLocation={handleUpdateLocation}
                      isOwner={isOwner}
                      viewMode={viewMode}
                      proposals={proposals}
                      suggestions={suggestions}
                      proposalCounts={proposalCounts}
                      suggestionCounts={suggestionCounts}
                      business={userMarketplaceContext.business}
                      onSubmitBid={(activityId, data) => handleSubmitBid(activityId, data)}
                      onSubmitSuggestion={(activityId, data) => handleSubmitSuggestion(activityId, day, data)}
                      onAcceptBid={handleAcceptBid}
                      onDeclineBid={handleDeclineBid}
                      onWithdrawBid={handleWithdrawBid}
                      onRequestWithdrawal={handleRequestWithdrawal}
                      onApproveWithdrawal={handleApproveWithdrawal}
                      onRejectWithdrawal={handleRejectWithdrawal}
                      onMarkSuggestionUsed={handleMarkSuggestionUsed}
                      onDismissSuggestion={handleDismissSuggestion}
                      isLoggedIn={userMarketplaceContext.isLoggedIn}
                      onAuthRequired={() => setShowAuthModal(true)}
                      tripVisibility={trip.visibility}
                      hasNonHotelBid={hasNonHotelBid}
                    />
                  );
                })}

                {/* Service Suggestions Grid */}
                {(viewMode === 'business' || viewMode === 'creator') && (
                  <ServiceSuggestionsGrid
                    tripId={trip.id}
                    viewMode={viewMode}
                    business={userMarketplaceContext.business}
                    onSubmitBid={(serviceType, data) => handleSubmitBid(undefined, data)}
                    onSubmitSuggestion={(serviceType, data) => handleSubmitSuggestion(undefined, undefined, data)}
                    isLoggedIn={userMarketplaceContext.isLoggedIn}
                    onAuthRequired={() => setShowAuthModal(true)}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No itinerary yet</h3>
                <p className="text-gray-500 mb-4">This trip doesn't have any activities planned.</p>
                {trip.user_role && ['owner', 'editor'].includes(trip.user_role) && (
                  <button
                    onClick={() => router.push(`/trips/${trip.id}/collaborate`)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Start Planning
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Map & Creator Card (40%) */}
          <div className="w-full lg:w-2/5 order-1 lg:order-2">
            <div className="lg:sticky lg:top-16 space-y-3 lg:h-[calc(100vh-80px)] lg:flex lg:flex-col">
              {/* Creator Card - collapsed by default */}
              <CreatorCard
                creator={creator}
                curatorInfo={curatorInfo}
                defaultExpanded={false}
              />

              {/* Map - fills remaining viewport height on desktop, fixed on mobile */}
              <div className="h-[300px] lg:flex-1 lg:h-auto lg:min-h-0">
                <TripMap
                  locations={mapLocations}
                  activeDay={activeDay}
                  totalDays={allDays.length}
                  height="100%"
                  onPinClick={handleMapPinClick}
                  showAllDays={showAllDays}
                />
              </div>

              {/* Day Quick Nav - anchored at bottom */}
              {allDays.length > 1 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 lg:flex-shrink-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Jump to Day
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allDays.map((day) => (
                      <button
                        key={day}
                        onClick={() => {
                          setShowAllDays(false);
                          const ref = dayRefs.current.get(day);
                          if (ref) {
                            ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          !showAllDays && activeDay === day
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Day {day}
                      </button>
                    ))}
                    {/* Show All Locations button */}
                    <button
                      onClick={() => setShowAllDays(!showAllDays)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        showAllDays
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {showAllDays ? 'Showing All' : 'Show All'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Trip Photos Section - separate from main layout so it's always visible when scrolling */}
      {isOwner && (
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <TripImageUpload
            tripId={trip.id}
            images={tripImages}
            onImagesChange={setTripImages}
          />
        </div>
      )}

      {/* Full Creator Profile (Bottom) */}
      <CreatorProfile
        creator={creator}
        curatorInfo={curatorInfo}
        paymentLinks={trip.payment_links}
      />

      {/* Auth Modal for cloning when not logged in */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
