'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Home, Calendar, MessageCircle, User, Compass } from 'lucide-react';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import TripCategories from '@/components/landing/TripCategories';
import PopularDestinations from '@/components/landing/PopularDestinations';
import CuratedItineraries from '@/components/landing/CuratedItineraries';
import MarketplaceItineraries from '@/components/landing/MarketplaceItineraries';
import GlassCTA from '@/components/landing/GlassCTA';
import ChatPanel from '@/components/landing/ChatPanel';
import ItineraryDisplay from '@/components/landing/ItineraryDisplay';
import AuthModal from '@/components/auth/AuthModal';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';

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

export default function HomePage() {
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [mobileChat, setMobileChat] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [tripContext, setTripContext] = useState<TripContext | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | undefined>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedHotels, setSelectedHotels] = useState<SelectedHotels>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAutoSave, setPendingAutoSave] = useState(false);

  // Check auth state and restore pending session on mount
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Check current auth state
    const checkAuthAndRestoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
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
          const data = await response.json();
          if (data.shareUrl) {
            setShareUrl(data.shareUrl);
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
    // Add IDs to activities if missing
    const itineraryWithIds = newItinerary.map(day => ({
      ...day,
      activities: day.activities.map((activity, idx) => ({
        ...activity,
        id: activity.id || `${day.day}-${idx}-${Date.now()}`,
      })),
    }));
    setItinerary(itineraryWithIds);
  }, []);

  const handleItineraryChange = useCallback((newItinerary: ItineraryDay[]) => {
    setItinerary(newItinerary);
  }, []);

  const handleTravelersChange = useCallback((newTravelers: Traveler[]) => {
    setTravelers(newTravelers);
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
      const data = await response.json();
      if (data.shareUrl) {
        setShareUrl(data.shareUrl);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [tripContext, itinerary, travelers]);

  const handleShare = useCallback(async () => {
    if (!shareUrl) {
      await handleSave();
    }
    // URL will be set by handleSave
  }, [shareUrl, handleSave]);

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
              shareUrl={shareUrl}
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
              parentItinerary={itinerary}
              selectedHotels={selectedHotels}
              onConversationStart={handleConversationStart}
              onContextUpdate={handleContextUpdate}
              onItineraryGenerated={handleItineraryGenerated}
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
                  parentItinerary={itinerary}
                  selectedHotels={selectedHotels}
                  onConversationStart={handleConversationStart}
                  onContextUpdate={handleContextUpdate}
                  onItineraryGenerated={handleItineraryGenerated}
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
