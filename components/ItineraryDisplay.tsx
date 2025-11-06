'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Download,
  Heart,
  Users,
  Star
} from 'lucide-react';

interface ItineraryDisplayProps {
  trip: any;
}

export default function ItineraryDisplay({ trip }: ItineraryDisplayProps) {
  const [activeDay, setActiveDay] = useState(1);
  const [votes, setVotes] = useState<{ [key: string]: 'up' | 'down' | null }>({});

  const handleVote = (itemId: string, vote: 'up' | 'down') => {
    setVotes(prev => ({
      ...prev,
      [itemId]: prev[itemId] === vote ? null : vote
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return '🍽️';
      case 'attraction':
        return '🎭';
      case 'activity':
        return '🎯';
      case 'accommodation':
        return '🏨';
      case 'transport':
        return '🚗';
      default:
        return '📍';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'attraction':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'activity':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'accommodation':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'transport':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-pink-100 text-pink-700 border-pink-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{trip.title}</h1>
            <p className="text-blue-100 text-lg">{trip.summary}</p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition">
              <Heart className="w-5 h-5" />
            </button>
            <button className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <Calendar className="w-5 h-5 mb-2" />
            <div className="text-sm opacity-80">Duration</div>
            <div className="text-xl font-bold">{trip.days?.length || 0} Days</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <DollarSign className="w-5 h-5 mb-2" />
            <div className="text-sm opacity-80">Est. Cost</div>
            <div className="text-xl font-bold">${trip.totalEstimatedCost?.toLocaleString() || 'N/A'}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <Users className="w-5 h-5 mb-2" />
            <div className="text-sm opacity-80">Collaborators</div>
            <div className="text-xl font-bold">1</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <Star className="w-5 h-5 mb-2" />
            <div className="text-sm opacity-80">AI Model</div>
            <div className="text-sm font-semibold">{trip.model || 'GPT-4'}</div>
          </div>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="bg-white rounded-xl shadow-md p-4 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {trip.days?.map((day: any) => (
            <button
              key={day.dayNumber}
              onClick={() => setActiveDay(day.dayNumber)}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                activeDay === day.dayNumber
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day {day.dayNumber}
              <div className="text-xs opacity-80 mt-1">{day.date}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Activities */}
      {trip.days?.filter((day: any) => day.dayNumber === activeDay).map((day: any) => (
        <div key={day.dayNumber} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Day {day.dayNumber} - {day.date}
          </h2>

          {day.activities?.map((activity: any, index: number) => {
            const itemId = `${day.dayNumber}-${index}`;
            const vote = votes[itemId];

            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-4xl">{getCategoryIcon(activity.category)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{activity.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(activity.category)}`}>
                          {activity.category}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4">{activity.description}</p>

                      {/* Location */}
                      {activity.location && (
                        <div className="flex items-start space-x-2 text-sm text-gray-700 mb-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-blue-600" />
                          <div>
                            <div className="font-medium">{activity.location.name}</div>
                            {activity.location.address && (
                              <div className="text-gray-500">{activity.location.address}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Time and Cost */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {activity.time && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{activity.time}</span>
                          </div>
                        )}
                        {activity.estimatedDuration && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{activity.estimatedDuration} min</span>
                          </div>
                        )}
                        {activity.estimatedCost && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold">${activity.estimatedCost}</span>
                          </div>
                        )}
                      </div>

                      {/* Tips */}
                      {activity.tips && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm font-medium text-blue-900 mb-1">💡 Tips</div>
                          <div className="text-sm text-blue-800">{activity.tips}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleVote(itemId, 'up')}
                      className={`p-2 rounded-lg transition ${
                        vote === 'up'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleVote(itemId, 'down')}
                      className={`p-2 rounded-lg transition ${
                        vote === 'down'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap gap-4">
          <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition">
            Save Trip
          </button>
          <button className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition">
            Invite Collaborators
          </button>
          <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
            Export to PDF
          </button>
          <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
            Share Link
          </button>
        </div>
      </div>

      {/* Generation Info */}
      {(trip.tokensUsed || trip.generationTimeMs) && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>Generated in {(trip.generationTimeMs / 1000).toFixed(2)}s</span>
            <span>Tokens used: {trip.tokensUsed?.toLocaleString()}</span>
            {trip.cost && <span>Cost: ${trip.cost.toFixed(4)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
