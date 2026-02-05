'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Home, Calendar, MessageCircle, User, Compass } from 'lucide-react';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import TripCategories from '@/components/landing/TripCategories';
import PopularDestinations from '@/components/landing/PopularDestinations';
import CuratedItineraries from '@/components/landing/CuratedItineraries';
import MarketplaceItineraries from '@/components/landing/MarketplaceItineraries';
import GlassCTA from '@/components/landing/GlassCTA';
import ChatPanel, { AIMetrics } from '@/components/landing/ChatPanel';
import ItineraryDisplay from '@/components/landing/ItineraryDisplay';
import { MarketplaceSettings } from '@/components/landing/ShareModal';
import AuthModal from '@/components/auth/AuthModal';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';
import { ItineraryVisibility, CuratorInfo } from '@/lib/types/user';

interface TripContext {
  destination?: string;
  duration?: string;
  travelType?: string[];
  budget?: string;
}

interface ItineraryActivity {
  id?: string;
  time: string;
  title: string;
  type: 'activity' | 'food' | 'transport' | 'accommodation' | 'nightlife';
  description?: string;
  cost?: number;
  location?: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  date?: string;
  activities: ItineraryActivity[];
}

interface Traveler {
  id: string;
  name: string;
  age: number;
  isChild: boolean;
  email?: string;
  phone?: string;
}

interface HotelResult {
  placeId: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number;
  vicinity: string;
  photos?: string[];
  location: { lat: number; lng: number };
  types: string[];
  mapsUrl: string;
}

interface SelectedHotels {
  [day: number]: HotelResult;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const tripIdFromUrl = searchParams.get('tripId');
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [mobileChat, setMobileChat] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [tripContext, setTripContext] = useState<TripContext | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | undefined>();
  const [currentTripId, setCurrentTripId] = useState<string | undefined>();
  const [visibility, setVisibility] = useState<ItineraryVisibility>('private');
  const [curatorInfo, setCuratorInfo] = useState<CuratorInfo | undefined>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedHotels, setSelectedHotels] = useState<SelectedHotels>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAutoSave, setPendingAutoSave] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);
  const [aiMetrics, setAIMetrics] = useState<AIMetrics | null>(null);

  // Check auth state and restore pending session on mount
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Check current auth state and refresh session to ensure cookies are set
    const checkAuthAndRestoreSession = async () => {
      // First try to get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Refresh session to ensure cookies are properly set with @supabase/ssr
        await supabase.auth.refreshSession();
        setIsLoggedIn(true);

        // Check for pending trip session to restore
        const savedSession = localStorage.getItem('pendingTripSession');
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession);
            // Check if session is less than 1 hour old
            if (Date.now() - sessionData.timestamp < 60 * 60 * 1000) {
              // Restore the session data
              if (sessionData.itinerary?.length > 0) {
                setItinerary(sessionData.itinerary);
              }
              if (sessionData.travelers?.length > 0) {
                setTravelers(sessionData.travelers);
              }
              if (sessionData.tripContext) {
                setTripContext(sessionData.tripContext);
              }
              if (sessionData.selectedHotels) {
                setSelectedHotels(sessionData.selectedHotels);
              }
              if (sessionData.chatPrompt) {
                setChatPrompt(sessionData.chatPrompt);
              }
              // Flag to auto-save after state is restored
              setPendingAutoSave(true);
            }
            // Clear the pending session
            localStorage.removeItem('pendingTripSession');
          } catch (error) {
            console.error('Error restoring session:', error);
            localStorage.removeItem('pendingTripSession');
          }
        }
      }
    };

    checkAuthAndRestoreSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load trip data when tripId is in URL (resume mode)
  useEffect(() => {
    if (!tripIdFromUrl) return;

    const loadTrip = async () => {
      setIsLoadingTrip(true);
      try {
        const response = await fetch(`/api/trips/${tripIdFromUrl}`);
        if (response.ok) {
          const data = await response.json();
          const trip = data.trip;

          // Set trip ID and saved state
          setCurrentTripId(trip.id);
          setIsSaved(true);
          setHasUnsavedChanges(false);

          // Set visibility and curator info
          setVisibility(trip.visibility || 'private');
          if (trip.curator_is_local || trip.curator_years_lived || trip.curator_experience) {
            setCuratorInfo({
              isLocal: trip.curator_is_local,
              yearsLived: trip.curator_years_lived,
              experience: trip.curator_experience,
            });
          }

          // Set share URL
          if (trip.share_code) {
            const baseUrl = window.location.origin;
            setShareUrl(`${baseUrl}/shared/${trip.share_code}`);
          }

          // Load chat history
          if (trip.chat_history && Array.isArray(trip.chat_history)) {
            setChatMessages(trip.chat_history.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })));
          }

          // Load itinerary and travelers from generated_content
          if (trip.generated_content) {
            if (trip.generated_content.itinerary) {
              setItinerary(trip.generated_content.itinerary);
            }
            if (trip.generated_content.travelers) {
              setTravelers(trip.generated_content.travelers);
            }
          }

          // Set trip context
          setTripContext({
            destination: trip.city,
            duration: trip.description, // duration was stored in description
          });

          // Expand chat to show the conversation
          setChatExpanded(true);
        }
      } catch (error) {
        console.error('Failed to load trip:', error);
      } finally {
        setIsLoadingTrip(false);
      }
    };

    loadTrip();
  }, [tripIdFromUrl]);

  // Auto-save when pending and itinerary is ready
  useEffect(() => {
    if (pendingAutoSave && itinerary.length > 0 && isLoggedIn) {
      setPendingAutoSave(false);
      // Small delay to ensure all state is settled, then save
      const timer = setTimeout(async () => {
        setIsSaving(true);
        try {
          const response = await fetch('/api/trips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              destination: tripContext?.destination,
              duration: tripContext?.duration,
              itinerary,
              travelers,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.shareUrl) {
              setShareUrl(data.shareUrl);
            }
            if (data.trip?.id) {
              setCurrentTripId(data.trip.id);
            }
            setIsSaved(true);
            setHasUnsavedChanges(false);
          }
        } catch (error) {
          console.error('Auto-save error:', error);
        } finally {
          setIsSaving(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingAutoSave, itinerary, isLoggedIn, tripContext, travelers]);

  const handleSearch = useCallback((query: string) => {
    setChatPrompt(query);
    if (window.innerWidth < 1024) {
      setMobileChat(true);
    }
  }, []);

  const handleCategorySelect = useCallback((category: string) => {
    setChatPrompt(`Plan a ${category} trip for me`);
    if (window.innerWidth < 1024) {
      setMobileChat(true);
    }
  }, []);

  const handleDestinationSelect = useCallback((destination: string) => {
    setChatPrompt(`I want to visit ${destination}`);
    if (window.innerWidth < 1024) {
      setMobileChat(true);
    }
  }, []);

  const handleGetStarted = useCallback(() => {
    setChatPrompt('Help me plan my dream trip');
    if (window.innerWidth < 1024) {
      setMobileChat(true);
    }
  }, []);

  const handleConversationStart = useCallback(() => {
    setChatExpanded(true);
  }, []);

  const handleContextUpdate = useCallback((context: TripContext) => {
    setTripContext(context);
  }, []);

  const handleItineraryGenerated = useCallback((newItinerary: ItineraryDay[]) => {
    console.log('[page] handleItineraryGenerated called with', newItinerary.length, 'days');
    // Add IDs to activities if missing
    const itineraryWithIds = newItinerary.map(day => ({
      ...day,
      activities: day.activities.map((activity, idx) => ({
        ...activity,
        id: activity.id || `${day.day}-${idx}-${Date.now()}`,
      })),
    }));
    setItinerary(itineraryWithIds);
    console.log('[page] setItinerary called, itinerary state updated');
  }, []);

  const handleItineraryChange = useCallback((newItinerary: ItineraryDay[]) => {
    setItinerary(newItinerary);
    if (isSaved) {
      setHasUnsavedChanges(true);
    }
  }, [isSaved]);

  const handleTravelersChange = useCallback((newTravelers: Traveler[]) => {
    setTravelers(newTravelers);
    if (isSaved) {
      setHasUnsavedChanges(true);
    }
  }, [isSaved]);

  const handleAIMetricsUpdate = useCallback((metrics: AIMetrics) => {
    setAIMetrics(metrics);
  }, []);

  const handleHotelSelect = useCallback((day: number, hotel: HotelResult | null) => {
    setSelectedHotels(prev => {
      if (hotel === null) {
        const { [day]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [day]: hotel };
    });
  }, []);

  const handleSave = useCallback(async () => {
    // Check if user is logged in first
    if (!isLoggedIn) {
      // Show auth modal to prompt login
      setShowAuthModal(true);
      return;
    }

    setIsSaving(true);
    try {
      // If we have an existing trip, update it; otherwise create new
      const isUpdate = !!currentTripId;
      const url = isUpdate ? `/api/trips/${currentTripId}` : '/api/trips';
      const method = isUpdate ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: tripContext?.destination,
          duration: tripContext?.duration,
          itinerary,
          travelers,
          visibility,
          curatorInfo: visibility === 'curated' ? curatorInfo : undefined,
          chatHistory: chatMessages,
          aiMetrics: aiMetrics,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.shareUrl) {
          setShareUrl(data.shareUrl);
        }
        if (data.trip?.id) {
          setCurrentTripId(data.trip.id);
        }
        setIsSaved(true);
        setHasUnsavedChanges(false);
      } else if (response.status === 401) {
        // Session expired or not authenticated - prompt re-login
        console.error('Authentication required - please sign in again');
        setShowAuthModal(true);
      } else {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [tripContext, itinerary, travelers, currentTripId, visibility, curatorInfo, isLoggedIn, chatMessages, aiMetrics]);

  const handleShare = useCallback(async () => {
    if (!shareUrl) {
      await handleSave();
    }
    // URL will be set by handleSave
  }, [shareUrl, handleSave]);

  const handleUpdateVisibility = useCallback(async (
    newVisibility: ItineraryVisibility,
    newCuratorInfo?: CuratorInfo,
    newMarketplaceSettings?: MarketplaceSettings
  ) => {
    setVisibility(newVisibility);
    if (newCuratorInfo) {
      setCuratorInfo(newCuratorInfo);
    }

    // If trip already exists, update it on the server
    if (currentTripId) {
      try {
        const response = await fetch(`/api/trips/${currentTripId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visibility: newVisibility,
            curatorInfo: newVisibility === 'curated' ? newCuratorInfo : undefined,
            marketplace_needs: newVisibility === 'marketplace' ? newMarketplaceSettings?.serviceNeeds : undefined,
            marketplace_budget_min: newVisibility === 'marketplace' ? newMarketplaceSettings?.budgetMin : undefined,
            marketplace_budget_max: newVisibility === 'marketplace' ? newMarketplaceSettings?.budgetMax : undefined,
            marketplace_notes: newVisibility === 'marketplace' ? newMarketplaceSettings?.notes : undefined,
          }),
        });

        if (!response.ok) {
          console.error('Failed to update visibility');
        }
      } catch (error) {
        console.error('Error updating visibility:', error);
      }
    }
  }, [currentTripId]);

  const handleLoginToSave = useCallback(() => {
    // Store session data to localStorage before showing auth modal
    // This allows us to restore the session after successful registration/login
    const sessionData = {
      itinerary,
      travelers,
      tripContext,
      selectedHotels,
      chatPrompt,
      timestamp: Date.now(),
    };
    localStorage.setItem('pendingTripSession', JSON.stringify(sessionData));
    setShowAuthModal(true);
  }, [itinerary, travelers, tripContext, selectedHotels, chatPrompt]);

  // Handle successful authentication - restore session and auto-save
  const handleAuthSuccess = useCallback(async () => {
    setShowAuthModal(false);
    setIsLoggedIn(true);

    // Restore session data from localStorage and auto-save
    const savedSession = localStorage.getItem('pendingTripSession');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        // Check if session is less than 1 hour old
        if (Date.now() - sessionData.timestamp < 60 * 60 * 1000) {
          // Session still valid - auto-save the trip
          await handleSave();
        }
        // Clear the pending session
        localStorage.removeItem('pendingTripSession');
      } catch (error) {
        console.error('Error restoring session:', error);
      }
    }
  }, [handleSave]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Layout */}
      <div className="flex">
        {/* Left: Main Content */}
        <div className={`flex-1 min-w-0 transition-all duration-500 ${chatExpanded ? 'lg:mr-[580px]' : 'lg:mr-[420px]'}`}>
          {/* Show Hero OR Itinerary - not both */}
          {itinerary.length === 0 ? (
            <>
              {/* Hero Section */}
              <HeroSection onSearch={handleSearch} />

              {/* Trip Categories */}
              <TripCategories onCategorySelect={handleCategorySelect} />

              {/* Popular Destinations */}
              <PopularDestinations onDestinationSelect={handleDestinationSelect} />

              {/* Curated Itineraries from Travelers */}
              <CuratedItineraries
                onItinerarySelect={(id) => {
                  setChatPrompt(`Show me the itinerary details for trip ${id}`);
                  if (window.innerWidth < 1024) {
                    setMobileChat(true);
                  }
                }}
              />

              {/* Marketplace - Public Itineraries for Business Offers */}
              <MarketplaceItineraries
                onViewItinerary={(id) => {
                  setChatPrompt(`Show me details for marketplace listing ${id}`);
                  if (window.innerWidth < 1024) {
                    setMobileChat(true);
                  }
                }}
                onMakeOffer={(id) => {
                  // For now, prompt sign in. In production, check auth first
                  setShowAuthModal(true);
                }}
              />

              {/* Glassmorphism CTA */}
              <GlassCTA onGetStarted={handleGetStarted} />
            </>
          ) : (
            /* Full Itinerary Display - Replaces hero when itinerary is generated */
            <ItineraryDisplay
              itinerary={itinerary}
              travelers={travelers}
              destination={tripContext?.destination}
              duration={tripContext?.duration}
              selectedHotels={selectedHotels}
              onItineraryChange={handleItineraryChange}
              onTravelersChange={handleTravelersChange}
              onHotelSelect={handleHotelSelect}
              onSave={handleSave}
              onShare={handleShare}
              onLogin={handleLoginToSave}
              isLoggedIn={isLoggedIn}
              isSaving={isSaving}
              isSaved={isSaved}
              hasUnsavedChanges={hasUnsavedChanges}
              shareUrl={shareUrl}
              visibility={visibility}
              curatorInfo={curatorInfo}
              tripId={currentTripId}
              onUpdateVisibility={handleUpdateVisibility}
            />
          )}

          {/* Footer */}
          <footer className="px-4 sm:px-6 lg:px-8 py-12 bg-white border-t border-gray-100">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg">
                    <Compass className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold text-gray-900 text-xl">
                    Wanderlust<span className="text-amber-500">.</span>
                  </span>
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">About</a>
                  <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Privacy</a>
                  <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Terms</a>
                  <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Contact</a>
                </div>
                <p className="text-sm text-gray-400">
                  © 2026 Wanderlust. All rights reserved.
                </p>
              </div>
            </div>
          </footer>

          {/* Spacer for mobile bottom nav */}
          <div className="lg:hidden h-24" />
        </div>

        {/* Right: Chat Panel - Fixed sidebar on desktop */}
        <div className={`hidden lg:block fixed top-0 right-0 h-screen pt-4 pb-4 pr-4 transition-all duration-500 ${chatExpanded ? 'w-[560px]' : 'w-[400px]'}`}>
          <div className="h-full">
            <ChatPanel
              initialPrompt={chatPrompt}
              initialMessages={chatMessages.length > 0 ? chatMessages : undefined}
              parentItinerary={itinerary}
              selectedHotels={selectedHotels}
              onConversationStart={handleConversationStart}
              onContextUpdate={handleContextUpdate}
              onItineraryGenerated={handleItineraryGenerated}
              onMessagesChange={setChatMessages}
              onAIMetricsUpdate={handleAIMetricsUpdate}
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 px-6 py-3 safe-area-inset-bottom">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { icon: Home, label: 'Home', active: true },
            { icon: Calendar, label: 'Trips', active: false },
            { icon: MessageCircle, label: 'Chat', active: false, action: () => setMobileChat(true) },
            { icon: User, label: 'Profile', active: false },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                item.active
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'text-gray-500 hover:text-teal-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Chat Panel Overlay */}
      {mobileChat && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileChat(false)}
          />
          {/* Chat panel */}
          <div className="absolute inset-x-0 bottom-0 h-[90vh] bg-white rounded-t-3xl shadow-2xl">
            <div className="h-full flex flex-col">
              {/* Handle bar */}
              <div className="flex justify-center py-4">
                <button
                  onClick={() => setMobileChat(false)}
                  className="w-12 h-1.5 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
                />
              </div>
              {/* Chat panel */}
              <div className="flex-1 overflow-hidden px-2">
                <ChatPanel
                  initialPrompt={chatPrompt}
                  initialMessages={chatMessages.length > 0 ? chatMessages : undefined}
                  parentItinerary={itinerary}
                  selectedHotels={selectedHotels}
                  onConversationStart={handleConversationStart}
                  onContextUpdate={handleContextUpdate}
                  onItineraryGenerated={handleItineraryGenerated}
                  onMessagesChange={setChatMessages}
                  onAIMetricsUpdate={handleAIMetricsUpdate}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
