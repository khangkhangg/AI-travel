'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, ChevronDown, Search, Plane, Palmtree, Mountain, Utensils, Camera, Building2, Heart, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

const categories = [
  { id: 'beach', label: 'Beach', icon: Palmtree },
  { id: 'adventure', label: 'Adventure', icon: Mountain },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'culture', label: 'Culture', icon: Camera },
  { id: 'city', label: 'City', icon: Building2 },
  { id: 'healthcare', label: 'Healthcare', icon: Heart },
];

type FlowStep = 'initial' | 'select-tag' | 'select-location' | 'enter-details';

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>('initial');
  const [showHint, setShowHint] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const locationButtonRef = useRef<HTMLDivElement>(null);

  const locations = ['Near Me', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania'];

  // Update dropdown position when it opens
  useLayoutEffect(() => {
    if (showLocationDropdown && locationButtonRef.current) {
      const rect = locationButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [showLocationDropdown]);

  // Handle location selection
  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);

    if (selectedCategory) {
      // Both selected - go to details step
      setFlowStep('enter-details');
      setShowHint(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Location selected, need tag
      setFlowStep('select-tag');
      setShowHint(true);
    }
  };

  // Handle category click
  const handleCategoryClick = (categoryId: string, label: string) => {
    const isDeselecting = selectedCategory === categoryId;
    setSelectedCategory(isDeselecting ? null : categoryId);

    if (isDeselecting) {
      setFlowStep(selectedLocation ? 'select-tag' : 'initial');
      return;
    }

    if (selectedLocation) {
      // Both selected - go to details step
      setFlowStep('enter-details');
      setShowHint(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Tag selected, need location
      setFlowStep('select-location');
      setShowHint(true);
      setShowLocationDropdown(true);
    }
  };

  // Handle Explore button
  const handleExploreClick = () => {
    if (!selectedLocation) {
      // Need to select location first
      setFlowStep('select-location');
      setShowLocationDropdown(true);
      setShowHint(true);
    } else if (!selectedCategory) {
      // Need to select category
      setFlowStep('select-tag');
      setShowHint(true);
    } else {
      // Both selected, search
      handleSearch();
    }
  };

  // Handle search
  const handleSearch = () => {
    let query = searchQuery.trim();

    if (!query && selectedCategory && selectedLocation) {
      const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || '';
      query = `Plan a ${categoryLabel.toLowerCase()} trip to ${selectedLocation}`;
    } else if (!query && selectedCategory) {
      const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || '';
      query = `Plan a ${categoryLabel.toLowerCase()} trip`;
    } else if (!query && selectedLocation) {
      query = `Plan a trip to ${selectedLocation}`;
    }

    if (query) {
      onSearch(query);
    }
  };

  // Auto-hide hint after delay
  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint, flowStep]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationButtonRef.current && !locationButtonRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get dynamic placeholder for search input
  const getPlaceholder = () => {
    if (flowStep === 'enter-details') {
      if (selectedLocation && selectedCategory) {
        const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || '';
        return `Tell us more about your ${categoryLabel.toLowerCase()} trip to ${selectedLocation}...`;
      }
    }
    return 'Search for a destination...';
  };

  // Get hint message
  const getHintMessage = () => {
    switch (flowStep) {
      case 'select-tag':
        return '👆 Now choose a travel style';
      case 'select-location':
        return '📍 First, select a destination';
      case 'enter-details':
        return '✨ Add any special requests (optional)';
      default:
        return '';
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-[14rem] pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero content */}
          <div className="text-center lg:text-left mb-8">
            <p className="text-white/80 text-lg sm:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Seamless, Fast & AI-Powered
              <br />
              Travel Planning at Your Fingertips
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-5">
            <div className="relative max-w-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={getPlaceholder()}
                className={`w-full pl-14 pr-6 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 shadow-xl text-base focus:outline-none focus:ring-4 transition-all ${
                  flowStep === 'enter-details'
                    ? 'focus:ring-amber-300/50 ring-2 ring-amber-300/30'
                    : 'focus:ring-white/30'
                }`}
              />
              {/* Search hint for enter-details step */}
              {flowStep === 'enter-details' && showHint && (
                <div className="absolute -bottom-8 left-0 text-amber-200 text-xs font-medium animate-pulse">
                  {getHintMessage()}
                </div>
              )}
            </div>
          </div>

          {/* Location + Category Pills + Explore */}
          <div className="flex flex-wrap items-center gap-3 max-w-2xl relative">
            {/* Location pill with dropdown */}
            <div className="relative" ref={locationButtonRef}>
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-sm transition-all border text-xs ${
                  selectedLocation
                    ? 'bg-white text-teal-700 border-white shadow-lg'
                    : flowStep === 'select-location'
                    ? 'bg-amber-400/30 hover:bg-amber-400/40 text-white border-amber-300 ring-2 ring-amber-300/50 animate-pulse'
                    : 'bg-white/20 hover:bg-white/30 text-white border-white/20'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span className="font-medium">{selectedLocation || 'Anywhere'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showLocationDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Location Dropdown - rendered via portal to ensure it's above everything */}
              {showLocationDropdown && typeof document !== 'undefined' && createPortal(
                <div
                  className="fixed w-44 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{
                    zIndex: 9999,
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                  }}
                >
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2">Select destination</p>
                  </div>
                  {locations.map((location) => (
                    <button
                      key={location}
                      onClick={() => handleLocationSelect(location)}
                      className={`w-full px-3 py-2.5 text-left text-xs transition-colors flex items-center gap-2 ${
                        selectedLocation === location
                          ? 'bg-teal-50 text-teal-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {location}
                    </button>
                  ))}
                </div>,
                document.body
              )}

              {/* Hint for select-location step */}
              {flowStep === 'select-location' && showHint && !showLocationDropdown && (
                <div className="absolute -bottom-6 left-0 whitespace-nowrap text-amber-200 text-xs font-medium">
                  {getHintMessage()}
                </div>
              )}
            </div>

            {/* Category pills */}
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              const shouldHighlight = flowStep === 'select-tag' && !isSelected;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id, category.label)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all border text-xs ${
                    isSelected
                      ? 'bg-white text-teal-700 border-white shadow-lg'
                      : shouldHighlight
                      ? 'bg-amber-400/20 hover:bg-amber-400/30 text-white border-amber-300/50 animate-pulse'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  <IconComponent className="w-3 h-3" />
                  <span className="font-medium">{category.label}</span>
                </button>
              );
            })}

            {/* Explore button */}
            <button
              onClick={handleExploreClick}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-lg transition-all text-xs ${
                selectedLocation && selectedCategory
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white border-amber-400 hover:from-amber-500 hover:to-amber-600'
                  : 'bg-white text-teal-700 border-white hover:bg-amber-50'
              }`}
            >
              {selectedLocation && selectedCategory ? (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span className="font-medium">Plan Trip</span>
                </>
              ) : (
                <>
                  <Plane className="w-3 h-3" />
                  <span className="font-medium">Explore</span>
                </>
              )}
            </button>

            {/* Hint for select-tag step */}
            {flowStep === 'select-tag' && showHint && (
              <div className="absolute -bottom-6 left-32 text-amber-200 text-xs font-medium">
                {getHintMessage()}
              </div>
            )}
          </div>

          {/* Selection summary */}
          {(selectedLocation || selectedCategory) && (
            <div className="mt-6 max-w-2xl">
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <span>Planning:</span>
                {selectedCategory && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full">
                    {categories.find(c => c.id === selectedCategory)?.label}
                  </span>
                )}
                {selectedLocation && (
                  <>
                    <span>in</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full">
                      {selectedLocation}
                    </span>
                  </>
                )}
                {!selectedCategory && (
                  <span className="text-amber-300/80 italic">← pick a style</span>
                )}
                {selectedCategory && !selectedLocation && (
                  <span className="text-amber-300/80 italic">← pick a destination</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Curved bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-white" style={{ borderRadius: '100% 100% 0 0' }} />
    </section>
  );
}
