'use client';

import { useState } from 'react';
import { MapPin, ChevronDown, Search, Plane, Palmtree, Mountain, Utensils, Camera, Building2, Heart } from 'lucide-react';

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

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Anywhere');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const locations = ['Anywhere', 'Near Me', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania'];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleCategoryClick = (categoryId: string, label: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    onSearch(`${label} trips${selectedLocation !== 'Anywhere' ? ` in ${selectedLocation}` : ''}`);
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
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for a destination..."
                className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 shadow-xl text-base focus:outline-none focus:ring-4 focus:ring-white/30"
              />
            </div>
          </div>

          {/* Location + Category Pills + Explore - 40% smaller */}
          <div className="flex flex-wrap items-center gap-3 max-w-2xl">
            {/* Location pill with dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all text-white border border-white/20 text-xs"
              >
                <MapPin className="w-3 h-3" />
                <span className="font-medium">{selectedLocation}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showLocationDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Location Dropdown */}
              {showLocationDropdown && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  {locations.map((location) => (
                    <button
                      key={location}
                      onClick={() => {
                        setSelectedLocation(location);
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                        selectedLocation === location
                          ? 'bg-teal-50 text-teal-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category pills - 40% smaller */}
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id, category.label)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all border text-xs ${
                    isSelected
                      ? 'bg-white text-teal-700 border-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  <IconComponent className="w-3 h-3" />
                  <span className="font-medium">{category.label}</span>
                </button>
              );
            })}

            {/* Explore button - same style as pills but white background */}
            <button
              onClick={() => onSearch('Explore popular destinations')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white text-teal-700 border border-white shadow-lg hover:bg-amber-50 transition-all text-xs"
            >
              <Plane className="w-3 h-3" />
              <span className="font-medium">Explore</span>
            </button>
          </div>
        </div>
      </div>

      {/* Curved bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-white" style={{ borderRadius: '100% 100% 0 0' }} />
    </section>
  );
}
