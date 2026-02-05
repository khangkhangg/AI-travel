'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Calendar, Briefcase, Hotel, Car, ChevronRight, Sparkles, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface MarketplaceTrip {
  id: string;
  title: string;
  destination: string;
  country: string;
  duration: string;
  startDate?: string;
  travelers: number;
  budget?: string;
  status: 'open' | 'has_offers' | 'booked';
  categories: string[];
  needs: string[];
  offersCount: number;
  createdAt: string;
  user: {
    name: string;
    avatar?: string | null;
  };
}

const needIcons: Record<string, { icon: typeof Users; label: string; color: string }> = {
  guide: { icon: Users, label: 'Tour Guide', color: 'text-blue-500 bg-blue-50' },
  hotel: { icon: Hotel, label: 'Accommodation', color: 'text-purple-500 bg-purple-50' },
  transport: { icon: Car, label: 'Transport', color: 'text-green-500 bg-green-50' },
  experience: { icon: Sparkles, label: 'Experience', color: 'text-amber-500 bg-amber-50' },
};

interface MarketplaceItinerariesProps {
  onViewItinerary?: (id: string) => void;
  onMakeOffer?: (id: string) => void;
}

export default function MarketplaceItineraries({ onViewItinerary, onMakeOffer }: MarketplaceItinerariesProps) {
  const [trips, setTrips] = useState<MarketplaceTrip[]>([]);
  const [filter, setFilter] = useState<'all' | 'guide' | 'hotel' | 'transport'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const serviceType = filter === 'all' ? '' : `&serviceType=${filter}`;
        const response = await fetch(`/api/landing/marketplace?limit=5${serviceType}`);
        if (response.ok) {
          const data = await response.json();
          setTrips(data.trips || []);
        } else {
          setError('Failed to load marketplace listings');
        }
      } catch (err) {
        console.error('Failed to fetch marketplace trips:', err);
        setError('Failed to load marketplace listings');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [filter]);

  // Generate gradient colors based on destination
  const getGradientColors = (destination: string) => {
    const gradients = [
      'from-teal-100 via-emerald-100 to-cyan-100',
      'from-rose-100 via-pink-100 to-fuchsia-100',
      'from-amber-100 via-orange-100 to-yellow-100',
      'from-violet-100 via-purple-100 to-indigo-100',
      'from-sky-100 via-blue-100 to-indigo-100',
    ];
    const hash = destination.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  // Don't render if no trips and done loading
  if (!loading && trips.length === 0) {
    return null;
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-teal-600" />
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Business Marketplace</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Travelers Looking for Services</h2>
            <p className="text-gray-500 mt-1">Connect with travelers and offer your services</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/marketplace"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              View all requests
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'guide', label: 'Need Guide', icon: Users },
            { id: 'hotel', label: 'Need Hotel', icon: Hotel },
            { id: 'transport', label: 'Need Transport', icon: Car },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.icon && <f.icon className="w-3 h-3" />}
              {f.label}
            </button>
          ))}
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

        {/* Trip List */}
        {!loading && trips.length > 0 && (
          <div className="space-y-4">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-teal-200 hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Cover */}
                  <div className={`sm:w-32 h-24 sm:h-auto bg-gradient-to-br ${getGradientColors(trip.destination)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-4xl sm:text-5xl opacity-60">
                      {trip.destination.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Left: Info */}
                      <div className="flex-1">
                        {/* Status & Time */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            trip.status === 'open'
                              ? 'bg-emerald-100 text-emerald-700'
                              : trip.status === 'has_offers'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {trip.status === 'open' ? 'Open for Offers' :
                             trip.status === 'has_offers' ? `${trip.offersCount} Offer${trip.offersCount !== 1 ? 's' : ''}` : 'Booked'}
                          </span>
                          <span className="text-[10px] text-gray-400">{trip.createdAt}</span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                          {trip.title}
                        </h3>

                        {/* Location & Details */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {trip.destination}{trip.country ? `, ${trip.country}` : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {trip.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}
                          </span>
                          {trip.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {trip.startDate}
                            </span>
                          )}
                        </div>

                        {/* Budget */}
                        {trip.budget && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
                            <DollarSign className="w-3 h-3" />
                            Budget: {trip.budget}
                          </div>
                        )}

                        {/* Needs */}
                        {trip.needs.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-[10px] text-gray-400 font-medium">Looking for:</span>
                            {trip.needs.map((need) => {
                              const config = needIcons[need] || {
                                icon: Sparkles,
                                label: need.charAt(0).toUpperCase() + need.slice(1),
                                color: 'text-gray-500 bg-gray-50'
                              };
                              return (
                                <span
                                  key={need}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}
                                >
                                  <config.icon className="w-3 h-3" />
                                  {config.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <button
                          type="button"
                          onClick={() => onMakeOffer?.(trip.id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-xs font-semibold hover:from-teal-700 hover:to-teal-800 transition-all shadow-md"
                        >
                          Make Offer
                        </button>
                        <Link
                          href={`/trips/${trip.id}`}
                          className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-all text-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA for Businesses */}
        <div className="mt-8 p-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Are you a tour guide, hotel, or service provider?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Register your business to receive notifications and make offers to travelers.
                </p>
              </div>
            </div>
            <Link
              href="/business/register"
              className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-all shadow-md text-center"
            >
              Register Business
            </Link>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Travelers share their plans publicly to receive offers from verified businesses.
            All transactions are protected by our secure escrow system.
          </p>
        </div>
      </div>
    </section>
  );
}
