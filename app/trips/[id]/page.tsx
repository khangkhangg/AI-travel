'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar, Clock, DollarSign, MapPin,
  Heart, Share2, Download, Users, Edit3, Trash2,
  Utensils, Coffee, Camera, Moon, Hotel, Car, Sun, Sunset, ArrowLeft,
  Copy, Check, Users2,
} from 'lucide-react';
import Header from '@/components/landing/Header';

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.ok) {
        const data = await response.json();
        setTrip(data.trip);
      } else {
        router.push('/my-trips');
      }
    } catch (error) {
      console.error('Failed to fetch trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/my-trips');
      } else {
        alert('Failed to delete trip');
      }
    } catch (error) {
      console.error('Failed to delete trip:', error);
    }
  };

  const handleCopyShareLink = async () => {
    if (!trip?.share_code) return;
    const shareUrl = `${window.location.origin}/shared/${trip.share_code}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActivityIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'food': return <Utensils className="w-4 h-4" />;
      case 'coffee': return <Coffee className="w-4 h-4" />;
      case 'attraction':
      case 'sightseeing': return <Camera className="w-4 h-4" />;
      case 'nightlife': return <Moon className="w-4 h-4" />;
      case 'accommodation':
      case 'hotel': return <Hotel className="w-4 h-4" />;
      case 'transport': return <Car className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getActivityColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'food': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'coffee': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'attraction':
      case 'sightseeing':
      case 'activity': return 'bg-violet-100 text-violet-600 border-violet-200';
      case 'nightlife': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'accommodation':
      case 'hotel': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'transport': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-emerald-100 text-emerald-600 border-emerald-200';
    }
  };

  const getTimeIcon = (timeSlot: string) => {
    if (!timeSlot) return <Clock className="w-4 h-4" />;
    const hour = parseInt(timeSlot.split(':')[0]);
    if (hour < 12) return <Sun className="w-4 h-4 text-amber-500" />;
    if (hour < 17) return <Sun className="w-4 h-4 text-orange-500" />;
    if (hour < 20) return <Sunset className="w-4 h-4 text-rose-500" />;
    return <Moon className="w-4 h-4 text-indigo-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trip...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
            <button
              onClick={() => router.push('/my-trips')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Back to My Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get itinerary from generated_content or itinerary_items
  const itinerary = trip.generated_content?.itinerary || [];
  const travelers = trip.generated_content?.travelers || [];

  // Build days from itinerary_items if available, otherwise from generated_content
  const days: number[] = trip.itinerary_items?.length > 0
    ? (Array.from(new Set(trip.itinerary_items.map((item: any) => item.day_number as number))) as number[]).sort((a, b) => a - b)
    : itinerary.map((_: any, i: number) => i + 1);

  // Get activities for active day
  const getActivitiesForDay = (dayNum: number) => {
    if (trip.itinerary_items?.length > 0) {
      return trip.itinerary_items
        .filter((item: any) => item.day_number === dayNum)
        .sort((a: any, b: any) => a.order_index - b.order_index);
    }
    // Fall back to generated_content
    const dayData = itinerary[dayNum - 1];
    return dayData?.activities || [];
  };

  const activitiesForDay = getActivitiesForDay(activeDay);
  const currentDayData = itinerary[activeDay - 1];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-20 pb-12">
        {/* Trip Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back button */}
            <button
              onClick={() => router.push('/my-trips')}
              className="flex items-center gap-2 text-emerald-100 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to My Trips</span>
            </button>

            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{trip.title || 'My Trip'}</h1>
                <div className="flex flex-wrap items-center gap-4 text-emerald-100">
                  {trip.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{trip.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{days.length} {days.length === 1 ? 'day' : 'days'}</span>
                  </div>
                  {travelers.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{travelers.length} {travelers.length === 1 ? 'traveler' : 'travelers'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/trips/${tripId}/collaborate`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  <Users2 className="w-4 h-4" />
                  <span>Collaborate</span>
                </button>
                <button
                  onClick={() => router.push(`/?tripId=${tripId}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Trip</span>
                </button>
                {trip.share_code && trip.visibility !== 'private' && (
                  <button
                    onClick={handleCopyShareLink}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Share'}</span>
                  </button>
                )}
                {trip.user_role === 'owner' && (
                  <button
                    onClick={handleDelete}
                    className="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Day Tabs */}
          {days.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-2 mb-6 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeDay === day
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Day {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day Title */}
          {currentDayData?.title && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">{currentDayData.title}</h2>
              {currentDayData.date && (
                <p className="text-gray-500 text-sm mt-1">{currentDayData.date}</p>
              )}
            </div>
          )}

          {/* Timeline */}
          {activitiesForDay.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-emerald-200" />

              {/* Activities */}
              <div className="space-y-4">
                {activitiesForDay.map((activity: any, index: number) => {
                  const timeSlot = activity.time_slot || activity.time || '';
                  const category = activity.category || activity.type || 'activity';
                  const title = activity.title;
                  const description = activity.description;
                  const location = activity.location_name || activity.location;
                  const cost = activity.estimated_cost || activity.cost;

                  return (
                    <div key={activity.id || index} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 ${getActivityColor(category)}`}>
                        {getActivityIcon(category)}
                      </div>

                      {/* Activity card */}
                      <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                        {/* Time badge */}
                        {timeSlot && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                            {getTimeIcon(timeSlot)}
                            <span className="font-medium">{timeSlot}</span>
                          </div>
                        )}

                        {/* Title and category */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{title}</h3>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getActivityColor(category)}`}>
                            {category}
                          </span>
                        </div>

                        {/* Description */}
                        {description && (
                          <p className="text-sm text-gray-600 mb-3">{description}</p>
                        )}

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{location}</span>
                            </div>
                          )}
                          {cost && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="font-medium">${cost}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities for this day</h3>
              <p className="text-gray-500 mb-4">Start planning by adding activities to your itinerary.</p>
              <button
                onClick={() => router.push(`/?tripId=${tripId}`)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                Edit Trip
              </button>
            </div>
          )}

          {/* Travelers Section */}
          {travelers.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Travelers</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {travelers.map((traveler: any, index: number) => (
                  <div
                    key={traveler.id || index}
                    className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      traveler.isChild ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{traveler.name}</p>
                      <p className="text-xs text-gray-500">
                        {traveler.age} years old
                        {traveler.isChild && ' (Child)'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
