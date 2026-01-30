'use client';

import { useState, useCallback } from 'react';
import { Compass, Menu, X, Map, Heart, User, Home, Calendar, MessageCircle, Sparkles, MapPin, Star, Users } from 'lucide-react';
import HeroSection from '@/components/landing/HeroSection';
import TripCategories from '@/components/landing/TripCategories';
import PopularDestinations from '@/components/landing/PopularDestinations';
import GlassCTA from '@/components/landing/GlassCTA';
import ChatPanel from '@/components/landing/ChatPanel';
import ItineraryDisplay from '@/components/landing/ItineraryDisplay';

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

export default function HomePage() {
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [mobileChat, setMobileChat] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [tripContext, setTripContext] = useState<TripContext | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | undefined>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  const handleLogin = useCallback(() => {
    // Trigger login modal or redirect
    window.location.href = '/login';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header - overlays hero */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className={`relative px-4 sm:px-6 lg:px-8 py-4 transition-all duration-500 ${chatExpanded ? 'lg:mr-[560px]' : 'lg:mr-[400px]'}`}>
          <div className="max-w-6xl mx-auto flex items-center">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10 group-hover:bg-white/30 transition-all">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white hidden sm:block drop-shadow-lg">
                Wanderlust<span className="text-amber-300">.</span>
              </span>
            </a>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side - mobile only */}
            <div className="flex items-center gap-3 lg:hidden">
              <button className="px-4 py-2 bg-white text-teal-800 rounded-xl font-semibold text-sm hover:bg-amber-50 transition-all shadow-lg">
                Sign In
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-all text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

        </div>

        {/* Desktop Navigation - positioned at chat panel edge */}
        <nav className="hidden lg:flex items-center gap-2 absolute right-[436px] top-4">
          {[
            { label: 'Discover', icon: Map },
            { label: 'My Trips', icon: Heart },
            { label: 'Creators', icon: User },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 backdrop-blur-sm transition-all font-medium text-xs border border-white/20"
            >
              <item.icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-teal-800 rounded-full font-medium text-xs hover:bg-amber-50 transition-all shadow-lg ml-1">
            Sign In
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mx-4 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100">
            <nav className="flex flex-col gap-1">
              {[
                { label: 'Discover', icon: Map },
                { label: 'My Trips', icon: Heart },
                { label: 'Creators', icon: User },
                { label: 'Become Creator', icon: Sparkles },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 text-left rounded-xl hover:bg-teal-50 transition-colors font-medium text-gray-800"
                >
                  <item.icon className="w-5 h-5 text-teal-600" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

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
              onItineraryChange={handleItineraryChange}
              onTravelersChange={handleTravelersChange}
              onSave={handleSave}
              onShare={handleShare}
              onLogin={handleLogin}
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
                  onConversationStart={handleConversationStart}
                  onContextUpdate={handleContextUpdate}
                  onItineraryGenerated={handleItineraryGenerated}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
