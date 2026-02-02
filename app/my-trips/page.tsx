'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Calendar, Users, Eye, Heart, Trash2, Share2,
  Plus, Compass, Lock, Globe, Building2, Star, Edit3, Users2,
  Copy, ChevronDown, Check, Loader2, AlertTriangle,
} from 'lucide-react';
import Header from '@/components/landing/Header';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';
import { format, isPast, parseISO } from 'date-fns';

type ItineraryVisibility = 'public' | 'private' | 'marketplace' | 'curated';

interface Trip {
  id: string;
  user_id: string;
  title: string;
  city?: string;
  description?: string;
  visibility: ItineraryVisibility;
  share_code?: string;
  start_date?: string;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  items_count?: number;
  clone_count?: number;
  generated_content?: {
    travelers?: any[];
    itinerary?: any[];
  };
}

const visibilityIcons = {
  private: Lock,
  public: Globe,
  marketplace: Building2,
  curated: Star,
};

const visibilityLabels = {
  private: 'Private',
  public: 'Public',
  marketplace: 'Marketplace',
  curated: 'Curated',
};

const visibilityOptions: { value: ItineraryVisibility; label: string; description: string; icon: typeof Lock }[] = [
  { value: 'private', label: 'Private', description: 'Only you can access', icon: Lock },
  { value: 'public', label: 'Public', description: 'Anyone can view', icon: Globe },
  { value: 'marketplace', label: 'Marketplace', description: 'Travel companies can bid', icon: Building2 },
  { value: 'curated', label: 'Curated', description: 'Share as local expert', icon: Star },
];

export default function MyTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [openVisibilityMenu, setOpenVisibilityMenu] = useState<string | null>(null);
  const [updatingVisibility, setUpdatingVisibility] = useState<string | null>(null);
  const [cloningTrip, setCloningTrip] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<string | null>(null);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);
  const deleteMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (visibilityMenuRef.current && !visibilityMenuRef.current.contains(event.target as Node)) {
        setOpenVisibilityMenu(null);
      }
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target as Node)) {
        setConfirmDeleteId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      setCurrentUserId(session.user.id);
      await fetchTrips();
    };

    checkAuthAndFetch();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips');
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
      } else if (response.status === 401) {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    setDeletingTrip(tripId);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTrips(trips.filter(t => t.id !== tripId));
        setConfirmDeleteId(null);
      } else {
        alert('Failed to delete trip');
      }
    } catch (error) {
      console.error('Failed to delete trip:', error);
    } finally {
      setDeletingTrip(null);
    }
  };

  const handleCopyShareLink = async (shareCode: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared/${shareCode}`;
    await navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  const handleUpdateVisibility = async (tripId: string, newVisibility: ItineraryVisibility) => {
    setUpdatingVisibility(tripId);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (response.ok) {
        setTrips(trips.map(t => t.id === tripId ? { ...t, visibility: newVisibility } : t));
      } else {
        alert('Failed to update visibility');
      }
    } catch (error) {
      console.error('Failed to update visibility:', error);
    } finally {
      setUpdatingVisibility(null);
      setOpenVisibilityMenu(null);
    }
  };

  const handleClone = async (tripId: string) => {
    setCloningTrip(tripId);
    try {
      const response = await fetch(`/api/trips/${tripId}/clone`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to the new trip
        router.push(`/?tripId=${data.trip.id}`);
      } else {
        alert('Failed to clone trip');
      }
    } catch (error) {
      console.error('Failed to clone trip:', error);
    } finally {
      setCloningTrip(null);
    }
  };

  // Check if trip is in the past (based on start_date + itinerary length)
  const isTripPast = (trip: Trip): boolean => {
    const itinerary = trip.generated_content?.itinerary || [];
    const days = itinerary.length || 1;

    // If start_date exists, calculate end date and check if past
    if (trip.start_date) {
      try {
        const startDate = parseISO(trip.start_date);
        // End date is start_date + (days - 1)
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days - 1);
        return isPast(endDate);
      } catch {
        // Fall back if date parsing fails
      }
    }

    // No start_date set - trip is not considered "past"
    return false;
  };

  // Get trip end date for display
  const getTripEndDate = (trip: Trip): string | null => {
    if (!trip.start_date) return null;
    const itinerary = trip.generated_content?.itinerary || [];
    const days = itinerary.length || 1;
    try {
      const startDate = parseISO(trip.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      return endDate.toISOString();
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your trips...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Compass className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign in to view your trips</h2>
            <p className="text-gray-600 mb-6">
              Create an account or sign in to save and manage your travel itineraries.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-600 mt-1">
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'} saved
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Plan New Trip</span>
            </button>
          </div>

          {/* Empty State */}
          {trips.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Start planning your next adventure! Create an itinerary with our AI travel planner.
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
              >
                Plan Your First Trip
              </button>
            </div>
          )}

          {/* Trips Grid */}
          {trips.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => {
                const VisibilityIcon = visibilityIcons[trip.visibility] || Lock;
                const travelers = trip.generated_content?.travelers || [];
                const days = trip.generated_content?.itinerary?.length || 0;

                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-visible hover:shadow-lg transition-shadow group"
                  >
                    {/* Card Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                            {trip.title || 'Untitled Trip'}
                          </h3>
                          <div className={`flex items-center gap-1 text-sm mt-1 ${trip.city ? 'text-gray-500' : 'text-orange-400'}`}>
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{trip.city || 'Add destination'}</span>
                          </div>
                        </div>
                        {/* Visibility Dropdown */}
                        <div className="relative" ref={openVisibilityMenu === trip.id ? visibilityMenuRef : null}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenVisibilityMenu(openVisibilityMenu === trip.id ? null : trip.id);
                            }}
                            disabled={updatingVisibility === trip.id}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              trip.visibility === 'private' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' :
                              trip.visibility === 'public' ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' :
                              trip.visibility === 'marketplace' ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' :
                              'bg-amber-100 text-amber-600 hover:bg-amber-200'
                            }`}
                          >
                            {updatingVisibility === trip.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <VisibilityIcon className="w-3 h-3" />
                            )}
                            <span>{visibilityLabels[trip.visibility]}</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {/* Dropdown Menu */}
                          {openVisibilityMenu === trip.id && (
                            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                              {visibilityOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = trip.visibility === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isSelected) {
                                        handleUpdateVisibility(trip.id, option.value);
                                      }
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                                      isSelected
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    <div className="flex-1">
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-xs text-gray-500">{option.description}</div>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className={`flex items-center gap-1 ${days > 0 ? 'text-gray-500' : 'text-orange-400'}`}>
                          <Calendar className="w-4 h-4" />
                          <span>{days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : 'No itinerary'}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${travelers.length > 0 ? 'text-gray-500' : 'text-orange-400'}`}>
                          <Users className="w-4 h-4" />
                          <span>{travelers.length > 0 ? travelers.length : 'Add travelers'}</span>
                        </div>
                        {(trip.likes_count || 0) > 0 && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Heart className="w-4 h-4" />
                            <span>{trip.likes_count}</span>
                          </div>
                        )}
                        {(trip.clone_count || 0) > 0 && (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <Copy className="w-4 h-4" />
                            <span>{trip.clone_count} {trip.clone_count === 1 ? 'clone' : 'clones'}</span>
                          </div>
                        )}
                      </div>

                      {/* Travel Date */}
                      <div className="mt-3">
                        {trip.start_date ? (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">
                              {format(parseISO(trip.start_date), 'MMM d')}
                              {getTripEndDate(trip) && ` - ${format(parseISO(getTripEndDate(trip)!), 'MMM d, yyyy')}`}
                            </span>
                            {isTripPast(trip) && (
                              <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">
                                PAST
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-orange-400">
                            Set travel dates
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center border-t border-gray-100">
                      <button
                        onClick={() => router.push(`/trips/${trip.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => router.push(`/?tripId=${trip.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-l border-gray-100"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => router.push(`/trips/${trip.id}/collaborate`)}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors border-l border-gray-100"
                        title="Collaborate"
                      >
                        <Users2 className="w-4 h-4" />
                      </button>
                      {/* Clone Button - for past trips */}
                      {isTripPast(trip) && (
                        <button
                          onClick={() => handleClone(trip.id)}
                          disabled={cloningTrip === trip.id}
                          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors border-l border-gray-100 disabled:opacity-50"
                          title="Clone this trip"
                        >
                          {cloningTrip === trip.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {trip.share_code && trip.visibility !== 'private' && (
                        <button
                          onClick={() => handleCopyShareLink(trip.share_code!)}
                          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-l border-gray-100"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                      {/* Delete Button with Confirmation */}
                      {(() => {
                        const isOwner = trip.user_id === currentUserId;
                        const isPastTrip = isTripPast(trip);
                        const canDelete = isOwner && !isPastTrip;
                        const deleteTitle = !isOwner
                          ? 'Only the owner can delete this trip'
                          : isPastTrip
                            ? 'Past trips cannot be deleted'
                            : 'Delete trip';

                        return (
                          <div className="relative" ref={confirmDeleteId === trip.id ? deleteMenuRef : null}>
                            <button
                              onClick={() => {
                                if (!canDelete) return;
                                setConfirmDeleteId(confirmDeleteId === trip.id ? null : trip.id);
                              }}
                              disabled={!canDelete}
                              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-l border-gray-100 ${
                                !canDelete
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-red-500 hover:bg-red-50'
                              }`}
                              title={deleteTitle}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                        {/* Delete Confirmation Dropdown */}
                        {confirmDeleteId === trip.id && (
                          <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                            <div className="p-4">
                              <div className="flex items-center gap-2 text-red-600 mb-2">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-semibold">Delete Trip?</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-4">
                                This action cannot be undone. All itinerary data will be permanently deleted.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDelete(trip.id)}
                                  disabled={deletingTrip === trip.id}
                                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  {deletingTrip === trip.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                  ) : (
                                    'Delete'
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
