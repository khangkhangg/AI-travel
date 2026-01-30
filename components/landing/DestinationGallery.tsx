'use client';

import { useState } from 'react';
import { Star, Heart, Clock, DollarSign, ChevronRight, Sparkles, Users, MapPin } from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  country: string;
  tagline: string;
  image: string;
  gradient: string;
  rating: number;
  reviews: number;
  priceLevel: number;
  bestTime: string;
  tags: string[];
  featured?: boolean;
}

interface DestinationGalleryProps {
  onDestinationSelect: (destination: string) => void;
}

const destinations: Destination[] = [
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    tagline: 'Ancient temples meet cherry blossoms',
    image: '🏯',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    rating: 4.9,
    reviews: 2847,
    priceLevel: 3,
    bestTime: 'Mar - May',
    tags: ['Culture', 'Nature', 'Food'],
    featured: true,
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Greece',
    tagline: 'Sunsets over the Aegean',
    image: '🏛️',
    gradient: 'from-blue-500 to-cyan-500',
    rating: 4.8,
    reviews: 1923,
    priceLevel: 4,
    bestTime: 'Jun - Sep',
    tags: ['Beach', 'Romance', 'Luxury'],
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    tagline: 'Tropical paradise & spiritual retreats',
    image: '🌴',
    gradient: 'from-emerald-500 to-teal-500',
    rating: 4.7,
    reviews: 3421,
    priceLevel: 2,
    bestTime: 'Apr - Oct',
    tags: ['Beach', 'Adventure', 'Wellness'],
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    tagline: 'City of lights & endless charm',
    image: '🗼',
    gradient: 'from-violet-500 to-purple-500',
    rating: 4.8,
    reviews: 4156,
    priceLevel: 4,
    bestTime: 'Apr - Jun',
    tags: ['Culture', 'Food', 'Romance'],
  },
  {
    id: 'iceland',
    name: 'Iceland',
    country: 'Iceland',
    tagline: 'Fire, ice & northern lights',
    image: '🌋',
    gradient: 'from-slate-600 to-slate-800',
    rating: 4.9,
    reviews: 1287,
    priceLevel: 4,
    bestTime: 'Sep - Mar',
    tags: ['Adventure', 'Nature', 'Photography'],
  },
  {
    id: 'marrakech',
    name: 'Marrakech',
    country: 'Morocco',
    tagline: 'Vibrant souks & desert magic',
    image: '🕌',
    gradient: 'from-amber-500 to-orange-500',
    rating: 4.6,
    reviews: 1654,
    priceLevel: 2,
    bestTime: 'Mar - May',
    tags: ['Culture', 'Food', 'Shopping'],
  },
];

export default function DestinationGallery({ onDestinationSelect }: DestinationGalleryProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const featuredDestination = destinations.find((d) => d.featured);
  const otherDestinations = destinations.filter((d) => !d.featured);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-950">Popular Destinations</h2>
            <p className="text-sm text-emerald-600">Handpicked places loved by travelers</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 font-medium text-sm transition-colors">
          View all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Featured + Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured Hero Card */}
        {featuredDestination && (
          <div
            onClick={() => onDestinationSelect(featuredDestination.name)}
            onMouseEnter={() => setHoveredCard(featuredDestination.id)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`relative group cursor-pointer rounded-3xl overflow-hidden bg-gradient-to-br ${featuredDestination.gradient} h-[420px] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
          >
            {/* Background emoji */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <span className="text-[180px] transform rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
                {featuredDestination.image}
              </span>
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between text-white">
              {/* Top */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">Featured</span>
                </div>
                <button
                  onClick={(e) => toggleFavorite(featuredDestination.id, e)}
                  className={`p-2.5 rounded-full transition-all ${
                    favorites.has(featuredDestination.id)
                      ? 'bg-rose-500 text-white scale-110'
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${favorites.has(featuredDestination.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Bottom */}
              <div>
                <div className="flex items-end gap-4 mb-3">
                  <span className="text-6xl">{featuredDestination.image}</span>
                  <div>
                    <h3 className="text-4xl font-bold">{featuredDestination.name}</h3>
                    <p className="text-white/80 text-lg">{featuredDestination.country}</p>
                  </div>
                </div>

                <p className="text-white/90 text-lg mb-4 italic">"{featuredDestination.tagline}"</p>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{featuredDestination.rating}</span>
                    <span className="text-white/70">({featuredDestination.reviews.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{featuredDestination.bestTime}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: featuredDestination.priceLevel }).map((_, i) => (
                      <DollarSign key={i} className="w-4 h-4" />
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {featuredDestination.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Hover CTA */}
                <div className={`transition-all duration-300 ${
                  hoveredCard === featuredDestination.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-amber-50 transition-colors shadow-lg">
                    <span>Plan a trip to {featuredDestination.name}</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid of smaller cards */}
        <div className="grid grid-cols-2 gap-4">
          {otherDestinations.slice(0, 4).map((destination, index) => (
            <div
              key={destination.id}
              onClick={() => onDestinationSelect(destination.name)}
              onMouseEnter={() => setHoveredCard(destination.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white border border-emerald-100 h-[200px] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${destination.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />

              {/* Background emoji */}
              <div className="absolute bottom-2 right-2 text-6xl opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all">
                {destination.image}
              </div>

              {/* Content */}
              <div className="relative p-4 h-full flex flex-col justify-between">
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-emerald-900">{destination.name}</h4>
                    <p className="text-sm text-emerald-600">{destination.country}</p>
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(destination.id, e)}
                    className={`p-2 rounded-full transition-all ${
                      favorites.has(destination.id)
                        ? 'bg-rose-100 text-rose-500'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(destination.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Bottom */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-emerald-900">{destination.rating}</span>
                    </div>
                    <div className="flex items-center text-emerald-500">
                      {Array.from({ length: destination.priceLevel }).map((_, i) => (
                        <DollarSign key={i} className="w-3 h-3" />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {destination.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-50 text-xs font-medium text-emerald-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hover overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${destination.gradient} flex items-center justify-center transition-opacity duration-300 ${
                hoveredCard === destination.id ? 'opacity-95' : 'opacity-0 pointer-events-none'
              }`}>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-800 rounded-xl font-semibold text-sm shadow-lg hover:bg-amber-50 transition-colors">
                  <span>Explore</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row - horizontal scroll */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {destinations.map((destination) => (
            <div
              key={`bottom-${destination.id}`}
              onClick={() => onDestinationSelect(destination.name)}
              className="flex-shrink-0 w-[300px] p-4 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-200 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${destination.gradient} flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition-transform`}>
                  {destination.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-emerald-900">{destination.name}</h4>
                  <p className="text-sm text-emerald-600 truncate">{destination.tagline}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold">{destination.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{destination.reviews.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicators */}
        <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-emerald-50 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
