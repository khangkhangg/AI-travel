'use client';

import { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Users,
  Wallet,
  ChevronDown,
  Palmtree,
  Mountain,
  Utensils,
  Camera,
  Music,
  ShoppingBag,
  Waves,
  TreePine,
  Building2,
  Heart,
  Plane,
  X,
  Search,
} from 'lucide-react';

interface QuickSelectorsProps {
  onPromptSelect: (prompt: string) => void;
  onFiltersChange: (filters: TripFilters) => void;
}

export interface TripFilters {
  startDate: string;
  endDate: string;
  travelers: number;
  budget: string;
  travelTypes: string[];
}

const conversationalPrompts = [
  { text: "Beach getaway for 2", icon: Palmtree, gradient: 'from-cyan-500 to-blue-500' },
  { text: "Family adventure", icon: Mountain, gradient: 'from-amber-500 to-orange-500' },
  { text: "Solo food tour", icon: Utensils, gradient: 'from-rose-500 to-pink-500' },
  { text: "Romantic escape", icon: Heart, gradient: 'from-pink-500 to-rose-500' },
  { text: "City weekend", icon: Building2, gradient: 'from-violet-500 to-purple-500' },
];

const travelTypes = [
  { id: 'beach', label: 'Beach', icon: Waves, color: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' },
  { id: 'adventure', label: 'Adventure', icon: Mountain, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { id: 'food', label: 'Food & Drink', icon: Utensils, color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
  { id: 'culture', label: 'Culture', icon: Camera, color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  { id: 'nightlife', label: 'Nightlife', icon: Music, color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  { id: 'nature', label: 'Nature', icon: TreePine, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { id: 'relaxation', label: 'Relaxation', icon: Palmtree, color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
];

const selectedColors: Record<string, string> = {
  beach: 'bg-cyan-500 text-white border-cyan-500',
  adventure: 'bg-amber-500 text-white border-amber-500',
  food: 'bg-rose-500 text-white border-rose-500',
  culture: 'bg-violet-500 text-white border-violet-500',
  nightlife: 'bg-fuchsia-500 text-white border-fuchsia-500',
  shopping: 'bg-orange-500 text-white border-orange-500',
  nature: 'bg-emerald-500 text-white border-emerald-500',
  relaxation: 'bg-teal-500 text-white border-teal-500',
};

export default function QuickSelectors({ onPromptSelect, onFiltersChange }: QuickSelectorsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TripFilters>({
    startDate: '',
    endDate: '',
    travelers: 2,
    budget: '',
    travelTypes: [],
  });

  const updateFilters = (updates: Partial<TripFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleTravelType = (typeId: string) => {
    const newTypes = filters.travelTypes.includes(typeId)
      ? filters.travelTypes.filter((t) => t !== typeId)
      : [...filters.travelTypes, typeId];
    updateFilters({ travelTypes: newTypes });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-emerald-950 tracking-tight">
          Where will your{' '}
          <span className="relative">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              wanderlust
            </span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
              <path d="M2 6C50 2 150 2 198 6" stroke="url(#underline)" strokeWidth="3" strokeLinecap="round"/>
              <defs>
                <linearGradient id="underline" x1="0" y1="0" x2="200" y2="0">
                  <stop stopColor="#059669"/>
                  <stop offset="1" stopColor="#14b8a6"/>
                </linearGradient>
              </defs>
            </svg>
          </span>
          {' '}take you?
        </h1>
        <p className="text-lg text-emerald-700/70 max-w-xl mx-auto">
          Start with a quick idea or customize every detail of your dream trip
        </p>
      </div>

      {/* Search Bar Style Prompt Area */}
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-2xl border-2 border-emerald-100 shadow-lg shadow-emerald-100/50 hover:border-emerald-200 transition-colors">
            <Search className="w-5 h-5 text-emerald-400" />
            <input
              type="text"
              placeholder="Where do you want to go? Try 'Beach trip to Bali' or 'Food tour in Tokyo'"
              className="flex-1 text-emerald-900 placeholder-emerald-400/60 focus:outline-none text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                  onPromptSelect((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 shadow-md">
              <Sparkles className="w-4 h-4" />
              <span>Plan Trip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap justify-center gap-3">
        {conversationalPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptSelect(prompt.text)}
            className="group flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all hover:-translate-y-0.5"
          >
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${prompt.gradient} flex items-center justify-center shadow-sm`}>
              <prompt.icon className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-emerald-800">{prompt.text}</span>
          </button>
        ))}
      </div>

      {/* Expand Filters Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
        >
          <span>{showFilters ? 'Hide options' : 'More options'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-xl shadow-emerald-100/30 animate-in slide-in-from-top-4 duration-300">
          {/* Filter Pills Row */}
          <div className="flex flex-wrap items-center gap-3 pb-6 border-b border-emerald-100">
            {/* Date Picker */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilters({ startDate: e.target.value })}
                  className="bg-transparent text-sm font-medium text-emerald-900 focus:outline-none"
                />
                <span className="text-emerald-400">→</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilters({ endDate: e.target.value })}
                  className="bg-transparent text-sm font-medium text-emerald-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Travelers */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <Users className="w-5 h-5 text-emerald-600" />
              <select
                value={filters.travelers}
                onChange={(e) => updateFilters({ travelers: parseInt(e.target.value) })}
                className="bg-transparent text-sm font-medium text-emerald-900 focus:outline-none appearance-none cursor-pointer pr-6"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'traveler' : 'travelers'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-emerald-500 -ml-4" />
            </div>

            {/* Budget */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <select
                value={filters.budget}
                onChange={(e) => updateFilters({ budget: e.target.value })}
                className="bg-transparent text-sm font-medium text-emerald-900 focus:outline-none appearance-none cursor-pointer pr-6"
              >
                <option value="">Any budget</option>
                <option value="budget">Budget ($)</option>
                <option value="moderate">Moderate ($$)</option>
                <option value="luxury">Luxury ($$$)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-emerald-500 -ml-4" />
            </div>
          </div>

          {/* Travel Types */}
          <div className="pt-6">
            <label className="text-sm font-semibold text-emerald-900 mb-4 block">
              What experiences interest you?
            </label>
            <div className="flex flex-wrap gap-2">
              {travelTypes.map((type) => {
                const isSelected = filters.travelTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleTravelType(type.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                      isSelected ? selectedColors[type.id] : type.color
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{type.label}</span>
                    {isSelected && <X className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-8 flex justify-center">
            <button
              onClick={() => onPromptSelect(`Custom trip: ${filters.travelTypes.join(', ')}`)}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all hover:-translate-y-0.5"
            >
              <Plane className="w-5 h-5" />
              <span>Plan My Adventure</span>
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
