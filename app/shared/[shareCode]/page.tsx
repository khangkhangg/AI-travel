'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Compass, Calendar, Users, MapPin, Clock, DollarSign, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Activity {
  id: string;
  time_slot: string;
  title: string;
  description?: string;
  category: string;
  estimated_cost?: number;
  location_name?: string;
}

interface DayGroup {
  day: number;
  activities: Activity[];
}

interface Traveler {
  id: string;
  name: string;
  age: number;
  is_child: boolean;
}

interface Trip {
  id: string;
  title: string;
  destination: string;
  description: string;
  created_at: string;
  owner_name?: string;
}

export default function SharedTripPage() {
  const params = useParams();
  const shareCode = params.shareCode as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<DayGroup[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchTrip() {
      try {
        const response = await fetch(`/api/trips/shared/${shareCode}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Trip not found');
          } else {
            setError('Failed to load trip');
          }
          return;
        }
        const data = await response.json();
        setTrip(data.trip);
        setDays(data.days || []);
        setTravelers(data.travelers || []);
      } catch (err) {
        setError('Failed to load trip');
      } finally {
        setLoading(false);
      }
    }
    fetchTrip();
  }, [shareCode]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCost = days.reduce((total, day) => {
    return total + day.activities.reduce((dayTotal, activity) => {
      return dayTotal + (activity.estimated_cost || 0);
    }, 0);
  }, 0);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'food': return '🍴';
      case 'transport': return '🚗';
      case 'accommodation': return '🏨';
      case 'nightlife': return '🌙';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{error}</h1>
          <p className="text-gray-500 mb-6">This trip may have been deleted or the link is invalid.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              Wanderlust<span className="text-amber-500">.</span>
            </span>
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">{trip?.title || 'Trip Itinerary'}</h1>
          {trip?.destination && (
            <div className="flex items-center gap-2 text-teal-100">
              <MapPin className="w-4 h-4" />
              <span>{trip.destination}</span>
            </div>
          )}
          {trip?.owner_name && (
            <p className="text-teal-200 mt-2 text-sm">Shared by {trip.owner_name}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-4">
            {/* Cost Summary */}
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white">
              <h3 className="text-sm font-medium text-teal-100 mb-1">Total Estimated Cost</h3>
              <p className="text-3xl font-bold">${totalCost.toFixed(0)}</p>
              {travelers.length > 0 && (
                <p className="text-teal-100 text-sm mt-1">
                  ${(totalCost / travelers.length).toFixed(0)} per person
                </p>
              )}
            </div>

            {/* Travelers */}
            {travelers.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  Travelers ({travelers.length})
                </h3>
                <div className="space-y-2">
                  {travelers.map((traveler) => (
                    <div key={traveler.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{traveler.name}</p>
                        <p className="text-xs text-gray-500">
                          {traveler.age} years old {traveler.is_child && '(Child)'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trip Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Trip Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">{days.length} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Activities</span>
                  <span className="font-medium">
                    {days.reduce((sum, d) => sum + d.activities.length, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Itinerary */}
          <div className="md:col-span-2 space-y-6">
            {days.map((day) => (
              <div key={day.day} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md">
                      {day.day}
                    </div>
                    <h3 className="font-bold text-gray-900">Day {day.day}</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {day.activities.map((activity, idx) => (
                    <div
                      key={activity.id || idx}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <span>{getActivityIcon(activity.category)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Clock className="w-3 h-3" />
                            <span>{activity.time_slot}</span>
                            {activity.location_name && (
                              <>
                                <MapPin className="w-3 h-3 ml-2" />
                                <span className="truncate">{activity.location_name}</span>
                              </>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          {activity.description && (
                            <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                          )}
                        </div>
                        {activity.estimated_cost !== undefined && activity.estimated_cost > 0 && (
                          <div className="flex items-center gap-1 text-sm font-semibold text-teal-600 flex-shrink-0">
                            <DollarSign className="w-3 h-3" />
                            {activity.estimated_cost}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            Create your own trip at{' '}
            <Link href="/" className="text-teal-600 hover:underline">
              Wanderlust
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
