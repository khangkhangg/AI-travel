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
}

interface CuratedTripViewProps {
  trip: Trip;
  onBack?: () => void;
}

export default function CuratedTripView({ trip, onBack }: CuratedTripViewProps) {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(1);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const dayRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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
  const mapLocations = (trip.itinerary_items || [])
    .filter((item) => item.location_lat && item.location_lng)
    .map((item) => ({
      id: item.id,
      title: item.title,
      lat: Number(item.location_lat),
      lng: Number(item.location_lng),
      dayNumber: item.day_number,
      category: item.category,
    }));

  // Debug logging
  console.log('DEBUG: itinerary_items count:', trip.itinerary_items?.length);
  console.log('DEBUG: mapLocations count:', mapLocations.length);
  console.log('DEBUG: Items with location:', trip.itinerary_items?.filter(i => i.location_lat || i.location_lng));

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
    setSaved(!saved);
    // TODO: Implement actual save/favorite functionality
  };

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
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className={`p-2 rounded-lg transition-colors ${
                  saved
                    ? 'bg-rose-50 text-rose-500'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={saved ? 'Saved' : 'Save'}
              >
                <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
              </button>
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
                    />
                  );
                })}
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
              {/* Creator Card */}
              <CreatorCard
                creator={creator}
                curatorInfo={curatorInfo}
                defaultExpanded={true}
              />

              {/* Map - fills remaining viewport height on desktop, fixed on mobile */}
              <div className="h-[300px] lg:flex-1 lg:h-auto lg:min-h-0">
                <TripMap
                  locations={mapLocations}
                  activeDay={activeDay}
                  totalDays={allDays.length}
                  height="100%"
                  onPinClick={handleMapPinClick}
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
                          const ref = dayRefs.current.get(day);
                          if (ref) {
                            ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          activeDay === day
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Day {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Creator Profile (Bottom) */}
      <CreatorProfile
        creator={creator}
        curatorInfo={curatorInfo}
        paymentLinks={trip.payment_links}
      />
    </div>
  );
}
