'use client';

import { useState, useEffect } from 'react';
import { Star, MapPin, Clock, Users, Heart, Eye, ChevronRight, Verified, Crown } from 'lucide-react';

interface CuratedItinerary {
  id: string;
  title: string;
  destination: string;
  country: string;
  duration: string;
  coverImage: string;
  creator: {
    name: string;
    avatar: string;
    isVerified: boolean;
    badge?: string;
  };
  stats: {
    likes: number;
    views: number;
    clones: number;
  };
  rating: number;
  tags: string[];
  highlights: string[];
}

// Mock data - replace with API call
const mockCuratedItineraries: CuratedItinerary[] = [
  {
    id: '1',
    title: 'Hidden Gems of Kyoto',
    destination: 'Kyoto',
    country: 'Japan',
    duration: '5 days',
    coverImage: '🏯',
    creator: {
      name: 'Sarah Chen',
      avatar: '',
      isVerified: true,
      badge: 'Local Expert',
    },
    stats: { likes: 2453, views: 15420, clones: 342 },
    rating: 4.9,
    tags: ['Culture', 'Food', 'Temples'],
    highlights: ['Hidden bamboo groves', 'Secret tea houses', 'Local markets'],
  },
  {
    id: '2',
    title: 'Ultimate Bali Adventure',
    destination: 'Bali',
    country: 'Indonesia',
    duration: '7 days',
    coverImage: '🌴',
    creator: {
      name: 'Mike Torres',
      avatar: '',
      isVerified: true,
      badge: 'Top Creator',
    },
    stats: { likes: 3821, views: 28500, clones: 567 },
    rating: 4.8,
    tags: ['Beach', 'Adventure', 'Wellness'],
    highlights: ['Sunrise at Tegallalang', 'Hidden waterfalls', 'Cliff temples'],
  },
  {
    id: '3',
    title: 'Paris Like a Local',
    destination: 'Paris',
    country: 'France',
    duration: '4 days',
    coverImage: '🗼',
    creator: {
      name: 'Emma Laurent',
      avatar: '',
      isVerified: true,
      badge: 'Local Expert',
    },
    stats: { likes: 1987, views: 12300, clones: 289 },
    rating: 4.9,
    tags: ['Food', 'Culture', 'Art'],
    highlights: ['Secret wine bars', 'Local bakeries', 'Hidden courtyards'],
  },
  {
    id: '4',
    title: 'Barcelona Foodie Trail',
    destination: 'Barcelona',
    country: 'Spain',
    duration: '3 days',
    coverImage: '🥘',
    creator: {
      name: 'Carlos Ruiz',
      avatar: '',
      isVerified: false,
    },
    stats: { likes: 1245, views: 8900, clones: 156 },
    rating: 4.7,
    tags: ['Food', 'Nightlife', 'Culture'],
    highlights: ['Tapas crawl', 'Market tours', 'Beach sunsets'],
  },
];

interface CuratedItinerariesProps {
  onItinerarySelect?: (id: string) => void;
}

export default function CuratedItineraries({ onItinerarySelect }: CuratedItinerariesProps) {
  const [itineraries, setItineraries] = useState<CuratedItinerary[]>(mockCuratedItineraries);
  const [loading, setLoading] = useState(false);

  // Fetch from API in production
  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const response = await fetch('/api/itineraries?visibility=public&featured=true&limit=4');
        if (response.ok) {
          const data = await response.json();
          if (data.itineraries && data.itineraries.length > 0) {
            // Map API response to component format
            // For now, using mock data
          }
        }
      } catch (error) {
        console.error('Failed to fetch curated itineraries:', error);
      }
    };
    fetchItineraries();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Curated by Travelers</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Expert Itineraries</h2>
            <p className="text-gray-500 mt-1">Handcrafted travel plans from our community</p>
          </div>
          <button className="hidden sm:flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Itinerary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {itineraries.map((itinerary) => (
            <div
              key={itinerary.id}
              onClick={() => onItinerarySelect?.(itinerary.id)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
            >
              {/* Cover */}
              <div className="relative h-36 bg-gradient-to-br from-teal-100 via-emerald-100 to-cyan-100 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
                  {itinerary.coverImage}
                </div>

                {/* Creator badge */}
                {itinerary.creator.badge && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {itinerary.creator.badge}
                    </span>
                  </div>
                )}

                {/* Like button */}
                <button className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-400 hover:text-rose-500 hover:bg-white transition-all shadow-lg">
                  <Heart className="w-4 h-4" />
                </button>

                {/* Duration badge */}
                <div className="absolute bottom-3 right-3">
                  <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {itinerary.duration}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Title & Location */}
                <h3 className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                  {itinerary.title}
                </h3>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-3 h-3" />
                  {itinerary.destination}, {itinerary.country}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {itinerary.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Creator */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                    {itinerary.creator.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {itinerary.creator.name}
                      </span>
                      {itinerary.creator.isVerified && (
                        <Verified className="w-3 h-3 text-teal-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-gray-700">{itinerary.rating}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {formatNumber(itinerary.stats.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatNumber(itinerary.stats.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {formatNumber(itinerary.stats.clones)} cloned
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-6 text-center sm:hidden">
          <button className="text-sm font-medium text-teal-600 hover:text-teal-700">
            View all curated itineraries →
          </button>
        </div>
      </div>
    </section>
  );
}
