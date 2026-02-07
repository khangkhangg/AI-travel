'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Calendar, Users, Eye, Heart, Trash2, Share2,
  Plus, Compass, Lock, Globe, Building2, Star, Edit3, Users2,
  Copy, ChevronDown, Check, Loader2, AlertTriangle, Sparkles, PenLine,
} from 'lucide-react';
import Header from '@/components/landing/Header';
import Footer from '@/components/Footer';
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
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [savingTitle, setSavingTitle] = useState<string | null>(null);
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);
  const [editingDestinationValue, setEditingDestinationValue] = useState('');
  const [savingDestination, setSavingDestination] = useState<string | null>(null);
  const [editingTravelersId, setEditingTravelersId] = useState<string | null>(null);
  const [editingTravelersValue, setEditingTravelersValue] = useState<number>(1);
  const [savingTravelers, setSavingTravelers] = useState<string | null>(null);
  const [editingDatesId, setEditingDatesId] = useState<string | null>(null);
  const [editingStartDate, setEditingStartDate] = useState('');
  const [savingDates, setSavingDates] = useState<string | null>(null);
  const [editingDaysId, setEditingDaysId] = useState<string | null>(null);
  const [editingDaysValue, setEditingDaysValue] = useState<string>('');
  const [savingDays, setSavingDays] = useState<string | null>(null);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);
  const deleteMenuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const travelersInputRef = useRef<HTMLInputElement>(null);
  const datesInputRef = useRef<HTMLInputElement>(null);
  const daysInputRef = useRef<HTMLInputElement>(null);
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

  const handleCreateCustomTrip = async () => {
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: '',
          visibility: 'private',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/trips/${data.trip.id}/collaborate`);
      } else {
        console.error('Failed to create trip');
      }
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
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

  const handleStartEditTitle = (trip: Trip) => {
    setEditingTitleId(trip.id);
    setEditingTitleValue(trip.title || '');
    // Focus input after render
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleSaveTitle = async (tripId: string) => {
    const trimmedTitle = editingTitleValue.trim();
    if (!trimmedTitle) {
      // Don't save empty titles, just cancel
      setEditingTitleId(null);
      return;
    }

    // Check if title actually changed
    const currentTrip = trips.find(t => t.id === tripId);
    if (currentTrip?.title === trimmedTitle) {
      setEditingTitleId(null);
      return;
    }

    setSavingTitle(tripId);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      if (response.ok) {
        setTrips(trips.map(t => t.id === tripId ? { ...t, title: trimmedTitle } : t));
      } else {
        alert('Failed to update title');
      }
    } catch (error) {
      console.error('Failed to update title:', error);
    } finally {
      setSavingTitle(null);
      setEditingTitleId(null);
    }
  };

  const handleCancelEditTitle = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  // Destination editing handlers
  const handleStartEditDestination = (trip: Trip) => {
    setEditingDestinationId(trip.id);
    setEditingDestinationValue(trip.city || '');
    setTimeout(() => destinationInputRef.current?.focus(), 0);
  };

  const handleSaveDestination = async (tripId: string) => {
    const trimmedDestination = editingDestinationValue.trim();

    // Check if destination actually changed
    const currentTrip = trips.find(t => t.id === tripId);
    if (currentTrip?.city === trimmedDestination) {
      setEditingDestinationId(null);
      return;
    }

    setSavingDestination(tripId);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: trimmedDestination }),
      });

      if (response.ok) {
        setTrips(trips.map(t => t.id === tripId ? { ...t, city: trimmedDestination } : t));
      } else {
        alert('Failed to update destination');
      }
    } catch (error) {
      console.error('Failed to update destination:', error);
    } finally {
      setSavingDestination(null);
      setEditingDestinationId(null);
    }
  };

  const handleCancelEditDestination = () => {
    setEditingDestinationId(null);
    setEditingDestinationValue('');
  };

  // Travelers editing handlers
  const handleStartEditTravelers = (trip: Trip) => {
    const currentCount = trip.generated_content?.travelers?.length || 1;
    setEditingTravelersId(trip.id);
    setEditingTravelersValue(currentCount);
    setTimeout(() => travelersInputRef.current?.focus(), 0);
  };

  const handleSaveTravelers = async (tripId: string) => {
    const newCount = Math.max(1, Math.min(20, editingTravelersValue)); // Clamp 1-20

    // Check if count actually changed
    const currentTrip = trips.find(t => t.id === tripId);
    const currentCount = currentTrip?.generated_content?.travelers?.length || 0;
    if (currentCount === newCount) {
      setEditingTravelersId(null);
      return;
    }

    setSavingTravelers(tripId);
    try {
      // Create travelers array with the specified count
      const travelers = Array.from({ length: newCount }, (_, i) => ({
        name: `Traveler ${i + 1}`,
        type: 'adult' as const,
      }));

      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelers }),
      });

      if (response.ok) {
        setTrips(trips.map(t => t.id === tripId ? {
          ...t,
          generated_content: {
            ...t.generated_content,
            travelers,
          },
        } : t));
      } else {
        alert('Failed to update travelers');
      }
    } catch (error) {
      console.error('Failed to update travelers:', error);
    } finally {
      setSavingTravelers(null);
      setEditingTravelersId(null);
    }
  };

  const handleCancelEditTravelers = () => {
    setEditingTravelersId(null);
    setEditingTravelersValue(1);
  };

  // Dates editing handlers
  const handleStartEditDates = (trip: Trip) => {
    setEditingDatesId(trip.id);
    // Format existing date or use empty string
    const existingDate = trip.start_date ? trip.start_date.split('T')[0] : '';
    setEditingStartDate(existingDate);
    setTimeout(() => datesInputRef.current?.focus(), 0);
  };

  const handleSaveDates = async (tripId: string) => {
    // Check if date actually changed
    const currentTrip = trips.find(t => t.id === tripId);
    const currentDate = currentTrip?.start_date?.split('T')[0] || '';
    if (currentDate === editingStartDate) {
      setEditingDatesId(null);
      return;
    }

    setSavingDates(tripId);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: editingStartDate || null }),
      });

      if (response.ok) {
        setTrips(trips.map(t => t.id === tripId ? { ...t, start_date: editingStartDate || undefined } : t));
      } else {
        alert('Failed to update travel dates');
      }
    } catch (error) {
      console.error('Failed to update dates:', error);
    } finally {
      setSavingDates(null);
      setEditingDatesId(null);
    }
  };

  const handleCancelEditDates = () => {
    setEditingDatesId(null);
    setEditingStartDate('');
  };

  // Days editing handlers
  const handleStartEditDays = (trip: Trip) => {
    const currentDays = trip.generated_content?.itinerary?.length || 1;
    setEditingDaysId(trip.id);
    setEditingDaysValue(String(currentDays));
    setTimeout(() => daysInputRef.current?.focus(), 0);
  };

  const handleSaveDays = async (tripId: string) => {
    // Parse and clamp 1-90 (allow up to 90 days for longer trips)
    const parsedDays = parseInt(editingDaysValue) || 1;
    const newDays = Math.max(1, Math.min(90, parsedDays));

    // Check if days actually changed
    const currentTrip = trips.find(t => t.id === tripId);
    const currentDays = currentTrip?.generated_content?.itinerary?.length || 0;
    if (currentDays === newDays) {
      setEditingDaysId(null);
      return;
    }

    setSavingDays(tripId);
    try {
      // Get existing itinerary or create empty array
      const existingItinerary = currentTrip?.generated_content?.itinerary || [];

      // Build new itinerary with the target number of days
      let newItinerary;
      if (newDays > existingItinerary.length) {
        // Add new empty days
        const daysToAdd = newDays - existingItinerary.length;
        const newDaysArray = Array.from({ length: daysToAdd }, (_, i) => ({
          day: existingItinerary.length + i + 1,
          title: `Day ${existingItinerary.length + i + 1}`,
          activities: [],
        }));
        newItinerary = [...existingItinerary, ...newDaysArray];
      } else {
        // Trim days from the end
        newItinerary = existingItinerary.slice(0, newDays);
      }

      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary: newItinerary }),
      });

      if (response.ok) {
        setTrips(trips.map(t => t.id === tripId ? {
          ...t,
          generated_content: {
            ...t.generated_content,
            itinerary: newItinerary,
          },
        } : t));
      } else {
        alert('Failed to update days');
      }
    } catch (error) {
      console.error('Failed to update days:', error);
    } finally {
      setSavingDays(null);
      setEditingDaysId(null);
    }
  };

  const handleCancelEditDays = () => {
    setEditingDaysId(null);
    setEditingDaysValue('');
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

      {/* Compact Gradient Banner */}
      <div className="pt-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Trips</h1>
              <p className="text-emerald-100 text-sm">
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'} saved
              </p>
            </div>
            <div
              className="relative"
              onMouseEnter={() => setShowPlanDropdown(true)}
              onMouseLeave={() => setShowPlanDropdown(false)}
            >
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-lg font-medium hover:bg-emerald-50 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Plan New Trip</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showPlanDropdown && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={() => router.push('/?action=start-planning')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-emerald-50 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium text-gray-900">AI Assist</div>
                      <div className="text-xs text-gray-500">Chat with AI to plan your trip</div>
                    </div>
                  </button>
                  <button
                    onClick={handleCreateCustomTrip}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-emerald-50 transition-colors border-t border-gray-100"
                  >
                    <PenLine className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium text-gray-900">Custom Manually</div>
                      <div className="text-xs text-gray-500">Build your itinerary from scratch</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

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
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/?action=start-planning')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Plan with AI
                </button>
                <button
                  onClick={handleCreateCustomTrip}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-700 border-2 border-emerald-200 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
                >
                  <PenLine className="w-4 h-4" />
                  Create Manually
                </button>
              </div>
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
                          {editingTitleId === trip.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                ref={titleInputRef}
                                type="text"
                                value={editingTitleValue}
                                onChange={(e) => setEditingTitleValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveTitle(trip.id);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditTitle();
                                  }
                                }}
                                onBlur={() => handleSaveTitle(trip.id)}
                                disabled={savingTitle === trip.id}
                                className="flex-1 px-2 py-1 text-sm font-semibold border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                                placeholder="Trip name"
                              />
                              {savingTitle === trip.id && (
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEditTitle(trip)}
                              className="text-left w-full group/title"
                              title="Click to edit title"
                            >
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 group-hover/title:text-emerald-600 transition-colors flex items-center gap-1">
                                {trip.title || 'Untitled Trip'}
                                <Edit3 className="w-3 h-3 opacity-0 group-hover/title:opacity-50 transition-opacity" />
                              </h3>
                            </button>
                          )}
                          {editingDestinationId === trip.id ? (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                              <input
                                ref={destinationInputRef}
                                type="text"
                                value={editingDestinationValue}
                                onChange={(e) => setEditingDestinationValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveDestination(trip.id);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditDestination();
                                  }
                                }}
                                onBlur={() => handleSaveDestination(trip.id)}
                                disabled={savingDestination === trip.id}
                                className="flex-1 px-2 py-0.5 text-sm border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                                placeholder="Enter destination"
                              />
                              {savingDestination === trip.id && (
                                <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEditDestination(trip)}
                              className={`flex items-center gap-1 text-sm mt-1 group/dest hover:text-emerald-600 transition-colors ${trip.city ? 'text-gray-500' : 'text-orange-400'}`}
                              title="Click to edit destination"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{trip.city || 'Add destination'}</span>
                              <Edit3 className="w-3 h-3 opacity-0 group-hover/dest:opacity-50 transition-opacity" />
                            </button>
                          )}
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
                        {editingDaysId === trip.id ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <input
                              ref={daysInputRef}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={editingDaysValue}
                              onChange={(e) => {
                                // Allow only digits and empty string for free typing
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setEditingDaysValue(value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveDays(trip.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditDays();
                                }
                              }}
                              onBlur={() => handleSaveDays(trip.id)}
                              disabled={savingDays === trip.id}
                              className="w-16 px-2 py-0.5 text-sm border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                              title="Number of days (1-90)"
                              placeholder="1"
                            />
                            <span className="text-gray-500">days</span>
                            {savingDays === trip.id && (
                              <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditDays(trip)}
                            className={`flex items-center gap-1 group/days hover:text-emerald-600 transition-colors ${days > 0 ? 'text-gray-500' : 'text-orange-400'}`}
                            title="Click to edit days"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>{days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : 'Add itinerary'}</span>
                            <Edit3 className="w-3 h-3 opacity-0 group-hover/days:opacity-50 transition-opacity" />
                          </button>
                        )}
                        {editingTravelersId === trip.id ? (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-emerald-500" />
                            <input
                              ref={travelersInputRef}
                              type="number"
                              min={1}
                              max={20}
                              value={editingTravelersValue}
                              onChange={(e) => setEditingTravelersValue(parseInt(e.target.value) || 1)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveTravelers(trip.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditTravelers();
                                }
                              }}
                              onBlur={() => handleSaveTravelers(trip.id)}
                              disabled={savingTravelers === trip.id}
                              className="w-14 px-2 py-0.5 text-sm border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                              title="Number of travelers"
                              placeholder="1"
                            />
                            {savingTravelers === trip.id && (
                              <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditTravelers(trip)}
                            className={`flex items-center gap-1 group/travelers hover:text-emerald-600 transition-colors ${travelers.length > 0 ? 'text-gray-500' : 'text-orange-400'}`}
                            title="Click to edit travelers"
                          >
                            <Users className="w-4 h-4" />
                            <span>{travelers.length > 0 ? travelers.length : 'Add travelers'}</span>
                            <Edit3 className="w-3 h-3 opacity-0 group-hover/travelers:opacity-50 transition-opacity" />
                          </button>
                        )}
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
                        {editingDatesId === trip.id ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            <input
                              ref={datesInputRef}
                              type="date"
                              value={editingStartDate}
                              onChange={(e) => setEditingStartDate(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveDates(trip.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditDates();
                                }
                              }}
                              onBlur={() => handleSaveDates(trip.id)}
                              disabled={savingDates === trip.id}
                              className="px-2 py-0.5 text-xs border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                              title="Start date"
                            />
                            {savingDates === trip.id && (
                              <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditDates(trip)}
                            className="group/dates flex items-center gap-1 hover:text-emerald-600 transition-colors"
                            title="Click to edit travel dates"
                          >
                            {trip.start_date ? (
                              <span className="text-xs text-gray-500 group-hover/dates:text-emerald-600">
                                <span className="font-medium">
                                  {format(parseISO(trip.start_date), 'MMM d')}
                                  {getTripEndDate(trip) && ` - ${format(parseISO(getTripEndDate(trip)!), 'MMM d, yyyy')}`}
                                </span>
                                {isTripPast(trip) && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">
                                    PAST
                                  </span>
                                )}
                                <Edit3 className="w-3 h-3 ml-1 inline opacity-0 group-hover/dates:opacity-50 transition-opacity" />
                              </span>
                            ) : (
                              <span className="text-xs text-orange-400 group-hover/dates:text-emerald-600 flex items-center gap-1">
                                Set travel dates
                                <Edit3 className="w-3 h-3 opacity-0 group-hover/dates:opacity-50 transition-opacity" />
                              </span>
                            )}
                          </button>
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

      <Footer />
    </div>
  );
}
