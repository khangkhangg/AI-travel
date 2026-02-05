'use client';

import { useState, useEffect } from 'react';
import { Star, MapPin, Clock, Users, Heart, Eye, ChevronRight, Verified, Crown, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CuratedTrip {
  id: string;
  title: string;
  destination: string;
  country: string;
  duration: string;
  coverImage: string | null;
  creator: {
    id: string;
    name: string;
    avatar: string | null;
    username: string;
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
}

interface CuratedItinerariesProps {
  onItinerarySelect?: (id: string) => void;
}

export default function CuratedItineraries({ onItinerarySelect }: CuratedItinerariesProps) {
  const [trips, setTrips] = useState<CuratedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/landing/curated?limit=4');
        if (response.ok) {
          const data = await response.json();
          setTrips(data.trips || []);
        } else {
          setError('Failed to load trips');
        }
      } catch (err) {
        console.error('Failed to fetch curated trips:', err);
        setError('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Generate gradient colors based on destination name
  const getGradientColors = (destination: string) => {
    const gradients = [
      'from-teal-100 via-emerald-100 to-cyan-100',
      'from-rose-100 via-pink-100 to-fuchsia-100',
      'from-amber-100 via-orange-100 to-yellow-100',
      'from-violet-100 via-purple-100 to-indigo-100',
      'from-sky-100 via-blue-100 to-indigo-100',
      'from-lime-100 via-green-100 to-emerald-100',
    ];
    const hash = destination.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  // Don't render if no trips and done loading
  if (!loading && trips.length === 0) {
    return null;
  }

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
          <Link
            href="/discover"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p>{error}</p>
          </div>
        )}

        {/* Trip Grid */}
        {!loading && trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
              >
                {/* Cover */}
                <div className={`relative h-36 bg-gradient-to-br ${getGradientColors(trip.destination)} overflow-hidden`}>
                  {trip.coverImage ? (
                    <img
                      src={trip.coverImage}
                      alt={trip.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl opacity-60 group-hover:scale-110 transition-transform duration-500">
                        {trip.destination.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Creator badge */}
                  {trip.creator.badge && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        {trip.creator.badge}
                      </span>
                    </div>
                  )}

                  {/* Like button */}
                  <button
                    type="button"
                    aria-label="Like this trip"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // TODO: Implement like functionality
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-400 hover:text-rose-500 hover:bg-white transition-all shadow-lg"
                  >
                    <Heart className="w-4 h-4" />
                  </button>

                  {/* Duration badge */}
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {trip.duration}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Title & Location */}
                  <h3 className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                    {trip.title}
                  </h3>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                    <MapPin className="w-3 h-3" />
                    {trip.destination}{trip.country ? `, ${trip.country}` : ''}
                  </div>

                  {/* Tags */}
                  {trip.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {trip.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full capitalize"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Creator */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    {trip.creator.avatar ? (
                      <img
                        src={trip.creator.avatar}
                        alt={trip.creator.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                        {trip.creator.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-gray-900 truncate">
                          {trip.creator.name}
                        </span>
                        {trip.creator.isVerified && (
                          <Verified className="w-3 h-3 text-teal-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-gray-700">{trip.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {formatNumber(trip.stats.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(trip.stats.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatNumber(trip.stats.clones)} cloned
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile view all */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/discover"
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View all curated itineraries →
          </Link>
        </div>
      </div>
    </section>
  );
}
