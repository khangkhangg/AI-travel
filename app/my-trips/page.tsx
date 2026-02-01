'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Calendar, Users, Eye, Heart, Trash2, Share2,
  Plus, Compass, Lock, Globe, Building2, Star, Edit3, Users2,
} from 'lucide-react';
import Header from '@/components/landing/Header';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';
import { format } from 'date-fns';

interface Trip {
  id: string;
  title: string;
  city?: string;
  description?: string;
  visibility: 'public' | 'private' | 'marketplace' | 'curated';
  share_code?: string;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  items_count?: number;
  generated_content?: {
    travelers?: any[];
    itinerary?: any[];
  };
}

const visibilityIcons = {
  private: Lock,
  public: Globe,
  marketplace: Building2,
  curated: Star,
};

const visibilityLabels = {
  private: 'Private',
  public: 'Public',
  marketplace: 'Marketplace',
  curated: 'Curated',
};

export default function MyTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      await fetchTrips();
    };

    checkAuthAndFetch();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips');
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
      } else if (response.status === 401) {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTrips(trips.filter(t => t.id !== tripId));
      } else {
        alert('Failed to delete trip');
      }
    } catch (error) {
      console.error('Failed to delete trip:', error);
    }
  };

  const handleCopyShareLink = async (shareCode: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared/${shareCode}`;
    await navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your trips...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Compass className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign in to view your trips</h2>
            <p className="text-gray-600 mb-6">
              Create an account or sign in to save and manage your travel itineraries.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-600 mt-1">
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'} saved
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Plan New Trip</span>
            </button>
          </div>

          {/* Empty State */}
          {trips.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Start planning your next adventure! Create an itinerary with our AI travel planner.
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
              >
                Plan Your First Trip
              </button>
            </div>
          )}

          {/* Trips Grid */}
          {trips.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => {
                const VisibilityIcon = visibilityIcons[trip.visibility] || Lock;
                const travelers = trip.generated_content?.travelers || [];
                const days = trip.generated_content?.itinerary?.length || 0;

                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    {/* Card Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                            {trip.title || 'Untitled Trip'}
                          </h3>
                          {trip.city && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{trip.city}</span>
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          trip.visibility === 'private' ? 'bg-gray-100 text-gray-600' :
                          trip.visibility === 'public' ? 'bg-blue-100 text-blue-600' :
                          trip.visibility === 'marketplace' ? 'bg-purple-100 text-purple-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          <VisibilityIcon className="w-3 h-3" />
                          <span>{visibilityLabels[trip.visibility]}</span>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {days > 0 && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{days} {days === 1 ? 'day' : 'days'}</span>
                          </div>
                        )}
                        {travelers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{travelers.length}</span>
                          </div>
                        )}
                        {(trip.likes_count || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{trip.likes_count}</span>
                          </div>
                        )}
                      </div>

                      {/* Date */}
                      <p className="text-xs text-gray-400 mt-3">
                        Created {format(new Date(trip.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center border-t border-gray-100">
                      <button
                        onClick={() => router.push(`/trips/${trip.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => router.push(`/?tripId=${trip.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-l border-gray-100"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => router.push(`/trips/${trip.id}/collaborate`)}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors border-l border-gray-100"
                        title="Collaborate"
                      >
                        <Users2 className="w-4 h-4" />
                      </button>
                      {trip.share_code && trip.visibility !== 'private' && (
                        <button
                          onClick={() => handleCopyShareLink(trip.share_code!)}
                          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-l border-gray-100"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border-l border-gray-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
