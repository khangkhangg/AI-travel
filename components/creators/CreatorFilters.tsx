'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, MapPin, Filter } from 'lucide-react';
import { INTEREST_CATEGORIES, CreatorCategory } from '@/lib/types/user';

interface CreatorFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: CreatorCategory | 'all';
  onCategoryChange: (value: CreatorCategory | 'all') => void;
  interests: string[];
  onInterestsChange: (value: string[]) => void;
  city: string;
  onCityChange: (value: string) => void;
  availableCities: string[];
}

const CATEGORY_OPTIONS: { value: CreatorCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Creators' },
  { value: 'guide', label: 'Verified Guides' },
  { value: 'local_expert', label: 'Local Experts' },
  { value: 'regular', label: 'Regular Creators' },
];

export default function CreatorFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  interests,
  onInterestsChange,
  city,
  onCityChange,
  availableCities,
}: CreatorFiltersProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [interestsOpen, setInterestsOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const categoryRef = useRef<HTMLDivElement>(null);
  const interestsRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryOpen(false);
      }
      if (interestsRef.current && !interestsRef.current.contains(event.target as Node)) {
        setInterestsOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setCityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleInterest = (interestId: string) => {
    if (interests.includes(interestId)) {
      onInterestsChange(interests.filter((i) => i !== interestId));
    } else {
      onInterestsChange([...interests, interestId]);
    }
  };

  const filteredCities = availableCities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const hasActiveFilters = category !== 'all' || interests.length > 0 || city !== '';

  const clearAllFilters = () => {
    onCategoryChange('all');
    onInterestsChange([]);
    onCityChange('');
    onSearchChange('');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div ref={categoryRef} className="relative">
          <button
            onClick={() => setCategoryOpen(!categoryOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              category !== 'all'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            {CATEGORY_OPTIONS.find((c) => c.value === category)?.label || 'Category'}
            <ChevronDown className={`w-4 h-4 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
          </button>
          {categoryOpen && (
            <div className="absolute z-20 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onCategoryChange(option.value);
                    setCategoryOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    category === option.value ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interests Multi-select */}
        <div ref={interestsRef} className="relative">
          <button
            onClick={() => setInterestsOpen(!interestsOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              interests.length > 0
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Interests
            {interests.length > 0 && (
              <span className="bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {interests.length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${interestsOpen ? 'rotate-180' : ''}`} />
          </button>
          {interestsOpen && (
            <div className="absolute z-20 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-72 overflow-y-auto">
              {Object.values(INTEREST_CATEGORIES).map((interest) => (
                <label
                  key={interest.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={interests.includes(interest.id)}
                    onChange={() => toggleInterest(interest.id)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-lg">{interest.emoji}</span>
                  <span className="text-sm text-gray-700">{interest.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* City Autocomplete */}
        <div ref={cityRef} className="relative">
          <button
            onClick={() => setCityOpen(!cityOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              city
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {city || 'City'}
            <ChevronDown className={`w-4 h-4 transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
          </button>
          {cityOpen && (
            <div className="absolute z-20 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Search cities..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {city && (
                  <button
                    onClick={() => {
                      onCityChange('');
                      setCityOpen(false);
                      setCitySearch('');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Clear selection
                  </button>
                )}
                {filteredCities.length > 0 ? (
                  filteredCities.slice(0, 20).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onCityChange(c);
                        setCityOpen(false);
                        setCitySearch('');
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        city === c ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-500 text-center">No cities found</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Active Filters Tags */}
      {(interests.length > 0 || city) && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {interests.map((interestId) => {
            const interest = INTEREST_CATEGORIES[interestId];
            if (!interest) return null;
            return (
              <span
                key={interestId}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
              >
                {interest.emoji} {interest.label}
                <button
                  onClick={() => toggleInterest(interestId)}
                  className="ml-1 hover:text-emerald-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {city && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
              <MapPin className="w-3 h-3" /> {city}
              <button onClick={() => onCityChange('')} className="ml-1 hover:text-emerald-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
