'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar, Clock, DollarSign, MapPin, ThumbsUp, ThumbsDown,
  Heart, Share2, Download, Users, Eye, Edit3, Trash2, UserPlus
} from 'lucide-react';
import DiscussionThread from '@/components/DiscussionThread';
import { format } from 'date-fns';

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [votes, setVotes] = useState<{ [key: string]: 'up' | 'down' | null }>({});
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (tripId) {
      fetchTrip();
      fetchVotes();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.ok) {
        const data = await response.json();
        setTrip(data.trip);
      } else {
        alert('Failed to load trip');
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVotes = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/vote`);
      if (response.ok) {
        const data = await response.json();
        // Process votes...
      }
    } catch (error) {
      console.error('Failed to fetch votes:', error);
    }
  };

  const handleVote = async (itemId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/trips/${tripId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryItemId: itemId,
          voteType: votes[itemId] === voteType ? 'neutral' : voteType
        })
      });

      if (response.ok) {
        setVotes(prev => ({
          ...prev,
          [itemId]: prev[itemId] === voteType ? null : voteType
        }));
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchTrip();
      }
    } catch (error) {
      console.error('Failed to like trip:', error);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/export?format=${format}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${trip.title || 'trip'}.${format === 'ical' ? 'ics' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export trip:', error);
      alert('Failed to export trip');
    }
  };

  const handleInvite = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: 'editor' })
      });

      if (response.ok) {
        alert('Invitation sent!');
        setShowInviteModal(false);
        setInviteEmail('');
        fetchTrip();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to invite');
      }
    } catch (error) {
      console.error('Failed to invite:', error);
      alert('Failed to invite');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/');
      } else {
        alert('Failed to delete trip');
      }
    } catch (error) {
      console.error('Failed to delete trip:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'attraction': return '🎭';
      case 'activity': return '🎯';
      case 'accommodation': return '🏨';
      case 'transport': return '🚗';
      default: return '📍';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'attraction': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'activity': return 'bg-green-100 text-green-700 border-green-200';
      case 'accommodation': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'transport': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-pink-100 text-pink-700 border-pink-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const days = trip.itinerary_items
    ? [...new Set(trip.itinerary_items.map((item: any) => item.day_number))]
    : [];

  const activitiesForDay = trip.itinerary_items
    ? trip.itinerary_items.filter((item: any) => item.day_number === activeDay)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{trip.title}</h1>
              <div className="flex items-center space-x-4 text-blue-100">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(trip.start_date), 'MMM d, yyyy')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
                {trip.city && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{trip.city}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{trip.views_count || 0} views</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleLike}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition"
              >
                <Heart className={`w-5 h-5 ${trip.is_liked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition"
              >
                <UserPlus className="w-5 h-5" />
              </button>
              <button className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition">
                <Share2 className="w-5 h-5" />
              </button>
              <div className="relative group">
                <button className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition">
                  <Download className="w-5 h-5" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <button
                    onClick={() => handleExport('ical')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export to Calendar
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>
              {trip.user_role === 'owner' && (
                <>
                  <button className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-500/50 hover:bg-red-600/50 p-3 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <Calendar className="w-5 h-5 mb-2" />
              <div className="text-sm opacity-80">Duration</div>
              <div className="text-xl font-bold">{days.length} Days</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <Users className="w-5 h-5 mb-2" />
              <div className="text-sm opacity-80">Group Size</div>
              <div className="text-xl font-bold">{trip.num_people}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <DollarSign className="w-5 h-5 mb-2" />
              <div className="text-sm opacity-80">Est. Cost</div>
              <div className="text-xl font-bold">
                ${trip.total_cost?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <Heart className="w-5 h-5 mb-2" />
              <div className="text-sm opacity-80">Likes</div>
              <div className="text-xl font-bold">{trip.likes_count || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Day navigation */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  activeDay === day
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="space-y-6 mb-8">
          {activitiesForDay.map((activity: any) => (
            <div
              key={activity.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="text-4xl">{getCategoryIcon(activity.category)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{activity.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(activity.category)}`}>
                        {activity.category}
                      </span>
                    </div>

                    {activity.description && (
                      <p className="text-gray-600 mb-4">{activity.description}</p>
                    )}

                    {activity.location_name && (
                      <div className="flex items-start space-x-2 text-sm text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-blue-600" />
                        <div>
                          <div className="font-medium">{activity.location_name}</div>
                          {activity.location_address && (
                            <div className="text-gray-500">{activity.location_address}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {activity.time_slot && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{activity.time_slot}</span>
                        </div>
                      )}
                      {activity.estimated_duration_minutes && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{activity.estimated_duration_minutes} min</span>
                        </div>
                      )}
                      {activity.estimated_cost && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">${activity.estimated_cost}</span>
                        </div>
                      )}
                    </div>

                    {activity.notes && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-blue-900 mb-1">💡 Tips</div>
                        <div className="text-sm text-blue-800">{activity.notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Voting */}
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleVote(activity.id, 'up')}
                    className={`p-2 rounded-lg transition ${
                      votes[activity.id] === 'up'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleVote(activity.id, 'down')}
                    className={`p-2 rounded-lg transition ${
                      votes[activity.id] === 'down'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Discussion */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <DiscussionThread tripId={tripId} />
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Invite Collaborator</h3>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleInvite}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Send Invite
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
