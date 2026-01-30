'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Share2,
  Heart,
  MoreHorizontal,
  Plus,
  Clock,
  DollarSign,
  Star,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Plane,
  Hotel,
  Utensils,
  Camera,
  ExternalLink,
  UserPlus,
  Edit3,
  Check,
  X,
  Send,
} from 'lucide-react';

interface Activity {
  id: string;
  time: string;
  title: string;
  type: 'transport' | 'accommodation' | 'food' | 'activity' | 'flight';
  location?: string;
  cost?: number;
  booked?: boolean;
  notes?: string;
  image?: string;
}

interface Day {
  date: string;
  dayNumber: number;
  activities: Activity[];
}

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface Comment {
  id: string;
  user: { name: string; avatar: string };
  content: string;
  timestamp: string;
  activityId?: string;
}

// Sample trip data
const tripData = {
  id: '1',
  title: 'Kyoto Cherry Blossom Adventure',
  destination: 'Kyoto, Japan',
  dates: { start: 'Mar 15, 2026', end: 'Mar 20, 2026' },
  coverImage: '🏯',
  totalCost: 2450,
  collaborators: [
    { id: '1', name: 'You', avatar: '👤', role: 'owner' as const },
    { id: '2', name: 'Sarah', avatar: '👩', role: 'editor' as const },
    { id: '3', name: 'Mike', avatar: '👨', role: 'viewer' as const },
  ],
  days: [
    {
      date: 'Sat, Mar 15',
      dayNumber: 1,
      activities: [
        { id: '1', time: '10:30 AM', title: 'Flight SFO → KIX', type: 'flight' as const, cost: 850, booked: true },
        { id: '2', time: '2:30 PM', title: 'Arrive at Kansai Airport', type: 'transport' as const },
        { id: '3', time: '4:00 PM', title: 'JR Train to Kyoto Station', type: 'transport' as const, cost: 25, booked: true },
        { id: '4', time: '5:30 PM', title: 'Check-in: Hyatt Regency Kyoto', type: 'accommodation' as const, cost: 380, booked: true, location: 'Higashiyama Ward' },
        { id: '5', time: '7:30 PM', title: 'Dinner at Nishiki Market', type: 'food' as const, cost: 45, location: 'Nakagyo Ward' },
      ],
    },
    {
      date: 'Sun, Mar 16',
      dayNumber: 2,
      activities: [
        { id: '6', time: '5:30 AM', title: 'Fushimi Inari Shrine (Sunrise)', type: 'activity' as const, notes: 'Arrive early to avoid crowds' },
        { id: '7', time: '9:00 AM', title: 'Breakfast at local cafe', type: 'food' as const, cost: 15 },
        { id: '8', time: '11:00 AM', title: 'Traditional Tea Ceremony', type: 'activity' as const, cost: 45, booked: true },
        { id: '9', time: '2:00 PM', title: 'Arashiyama Bamboo Grove', type: 'activity' as const },
        { id: '10', time: '4:00 PM', title: 'Monkey Park Iwatayama', type: 'activity' as const, cost: 8 },
        { id: '11', time: '7:00 PM', title: 'Kaiseki Dinner at Kikunoi', type: 'food' as const, cost: 120, booked: true },
      ],
    },
    {
      date: 'Mon, Mar 17',
      dayNumber: 3,
      activities: [
        { id: '12', time: '8:00 AM', title: 'Kinkaku-ji (Golden Pavilion)', type: 'activity' as const, cost: 5 },
        { id: '13', time: '10:30 AM', title: 'Ryoan-ji Zen Garden', type: 'activity' as const, cost: 6 },
        { id: '14', time: '1:00 PM', title: 'Lunch at Ramen Street', type: 'food' as const, cost: 12 },
        { id: '15', time: '3:00 PM', title: 'Gion District Walking Tour', type: 'activity' as const },
        { id: '16', time: '6:00 PM', title: 'Geisha District Evening', type: 'activity' as const },
      ],
    },
  ] as Day[],
  comments: [
    { id: '1', user: { name: 'Sarah', avatar: '👩' }, content: 'Can we add a sake tasting on Day 2?', timestamp: '2 hours ago', activityId: '8' },
    { id: '2', user: { name: 'Mike', avatar: '👨' }, content: 'The bamboo grove looks amazing! Should we go earlier to avoid crowds?', timestamp: '1 day ago', activityId: '9' },
  ] as Comment[],
};

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [selectedDay, setSelectedDay] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'discussion' | 'bookings'>('itinerary');

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'flight':
        return <Plane className="w-4 h-4" />;
      case 'transport':
        return <MapPin className="w-4 h-4" />;
      case 'accommodation':
        return <Hotel className="w-4 h-4" />;
      case 'food':
        return <Utensils className="w-4 h-4" />;
      default:
        return <Camera className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'flight':
        return 'bg-blue-100 text-blue-600';
      case 'transport':
        return 'bg-violet-100 text-violet-600';
      case 'accommodation':
        return 'bg-amber-100 text-amber-600';
      case 'food':
        return 'bg-rose-100 text-rose-600';
      default:
        return 'bg-emerald-100 text-emerald-600';
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    // In real app, this would call an API
    setNewComment('');
  };

  return (
    <div className="min-h-screen bg-[var(--color-sage-light)]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--color-sage)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[var(--color-forest)] hover:text-[var(--color-pine)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-2 rounded-xl transition-colors ${
                  isFavorited ? 'bg-rose-100 text-rose-500' : 'hover:bg-[var(--color-sage)] text-[var(--color-forest-muted)]'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 rounded-xl hover:bg-[var(--color-sage)] text-[var(--color-forest-muted)] transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-xl hover:bg-[var(--color-sage)] text-[var(--color-forest-muted)] transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-[var(--color-forest)] to-[var(--color-pine)] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-[120px] opacity-20">
          {tripData.coverImage}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{tripData.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{tripData.destination}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{tripData.dates.start} - {tripData.dates.end}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>${tripData.totalCost} estimated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Collaborators Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[var(--color-sage)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--color-forest-muted)]">Travelers:</span>
                  <div className="flex -space-x-2">
                    {tripData.collaborators.map((collab) => (
                      <div
                        key={collab.id}
                        className="w-8 h-8 rounded-full bg-[var(--color-sage)] flex items-center justify-center text-lg border-2 border-white"
                        title={collab.name}
                      >
                        {collab.avatar}
                      </div>
                    ))}
                  </div>
                  <button className="w-8 h-8 rounded-full border-2 border-dashed border-[var(--color-sage-dark)] flex items-center justify-center text-[var(--color-forest-muted)] hover:border-[var(--color-forest)] hover:text-[var(--color-forest)] transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-forest)] text-white hover:bg-[var(--color-pine)] transition-colors text-sm font-medium">
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Trip</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[var(--color-sage)]">
              {[
                { id: 'itinerary', label: 'Itinerary' },
                { id: 'discussion', label: 'Discussion', badge: tripData.comments.length },
                { id: 'bookings', label: 'Bookings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-[var(--color-forest)]'
                      : 'text-[var(--color-forest-muted)] hover:text-[var(--color-forest)]'
                  }`}
                >
                  {tab.label}
                  {tab.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-[var(--color-forest)] text-white rounded-full">
                      {tab.badge}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-forest)]" />
                  )}
                </button>
              ))}
            </div>

            {/* Itinerary Tab */}
            {activeTab === 'itinerary' && (
              <div className="space-y-4">
                {/* Day Selector */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {tripData.days.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDay(index)}
                      className={`flex-shrink-0 px-4 py-3 rounded-2xl font-medium text-sm transition-all ${
                        selectedDay === index
                          ? 'bg-[var(--color-forest)] text-white'
                          : 'bg-white border border-[var(--color-sage)] text-[var(--color-forest)] hover:border-[var(--color-moss)]'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xs opacity-70">Day {day.dayNumber}</div>
                        <div>{day.date.split(',')[0]}</div>
                      </div>
                    </button>
                  ))}
                  <button className="flex-shrink-0 px-4 py-3 rounded-2xl border-2 border-dashed border-[var(--color-sage-dark)] text-[var(--color-forest-muted)] hover:border-[var(--color-forest)] hover:text-[var(--color-forest)] transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Day Activities */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-[var(--color-sage)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-[var(--color-pine)]">
                        {tripData.days[selectedDay].date}
                      </h3>
                      <p className="text-sm text-[var(--color-forest-muted)]">
                        {tripData.days[selectedDay].activities.length} activities planned
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
                        disabled={selectedDay === 0}
                        className="p-2 rounded-xl hover:bg-[var(--color-sage)] disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedDay(Math.min(tripData.days.length - 1, selectedDay + 1))}
                        disabled={selectedDay === tripData.days.length - 1}
                        className="p-2 rounded-xl hover:bg-[var(--color-sage)] disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {tripData.days[selectedDay].activities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex gap-4 p-4 rounded-xl bg-[var(--color-sage-light)] hover:bg-[var(--color-sage)] transition-colors cursor-pointer group"
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-xl ${getActivityColor(activity.type)} flex items-center justify-center`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          {index < tripData.days[selectedDay].activities.length - 1 && (
                            <div className="w-0.5 flex-1 bg-[var(--color-sage-dark)] mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 text-xs text-[var(--color-forest-muted)] mb-1">
                                <Clock className="w-3 h-3" />
                                <span>{activity.time}</span>
                              </div>
                              <h4 className="font-medium text-[var(--color-pine)]">{activity.title}</h4>
                              {activity.location && (
                                <p className="text-sm text-[var(--color-forest-muted)] flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {activity.location}
                                </p>
                              )}
                              {activity.notes && (
                                <p className="text-sm text-[var(--color-forest-muted)] italic mt-1">{activity.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {activity.cost && (
                                <span className="text-sm font-medium text-[var(--color-forest)]">${activity.cost}</span>
                              )}
                              {activity.booked && (
                                <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Booked
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-[var(--color-forest-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-[var(--color-sage-dark)] text-[var(--color-forest-muted)] hover:border-[var(--color-forest)] hover:text-[var(--color-forest)] transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Activity</span>
                  </button>
                </div>
              </div>
            )}

            {/* Discussion Tab */}
            {activeTab === 'discussion' && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-[var(--color-sage)]">
                <h3 className="font-bold text-lg text-[var(--color-pine)] mb-4">Trip Discussion</h3>

                <div className="space-y-4 mb-4">
                  {tripData.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-sage)] flex items-center justify-center text-lg flex-shrink-0">
                        {comment.user.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[var(--color-pine)]">{comment.user.name}</span>
                          <span className="text-xs text-[var(--color-forest-muted)]">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-[var(--color-forest)]">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-sage-light)] border border-transparent focus:border-[var(--color-moss)] focus:outline-none text-sm"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-3 rounded-xl bg-[var(--color-forest)] text-white hover:bg-[var(--color-pine)] disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-[var(--color-sage)]">
                <h3 className="font-bold text-lg text-[var(--color-pine)] mb-4">Confirmed Bookings</h3>

                <div className="space-y-3">
                  {tripData.days.flatMap((day) =>
                    day.activities.filter((a) => a.booked).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-sage-light)]">
                        <div className={`w-12 h-12 rounded-xl ${getActivityColor(activity.type)} flex items-center justify-center`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-[var(--color-pine)]">{activity.title}</h4>
                          <p className="text-sm text-[var(--color-forest-muted)]">Day {tripData.days.findIndex((d) => d.activities.includes(activity)) + 1} • {activity.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[var(--color-forest)]">${activity.cost}</p>
                          <span className="text-xs text-emerald-600">Confirmed</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-[var(--color-sage-light)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[var(--color-forest-muted)]">Total Booked</span>
                    <span className="font-bold text-[var(--color-pine)]">
                      ${tripData.days.flatMap((d) => d.activities).filter((a) => a.booked).reduce((sum, a) => sum + (a.cost || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-forest-muted)]">Estimated Total</span>
                    <span className="font-bold text-[var(--color-pine)]">${tripData.totalCost}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[var(--color-sage)]">
              <h3 className="font-semibold text-[var(--color-pine)] mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-sage-light)] transition-colors text-left">
                  <Share2 className="w-5 h-5 text-[var(--color-forest)]" />
                  <span className="text-sm font-medium">Share Itinerary</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-sage-light)] transition-colors text-left">
                  <ExternalLink className="w-5 h-5 text-[var(--color-forest)]" />
                  <span className="text-sm font-medium">Export as PDF</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-sage-light)] transition-colors text-left">
                  <MessageCircle className="w-5 h-5 text-[var(--color-forest)]" />
                  <span className="text-sm font-medium">Ask AI Assistant</span>
                </button>
              </div>
            </div>

            {/* Trip Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[var(--color-sage)]">
              <h3 className="font-semibold text-[var(--color-pine)] mb-3">Trip Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-forest-muted)]">Duration</span>
                  <span className="font-medium">{tripData.days.length} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-forest-muted)]">Activities</span>
                  <span className="font-medium">{tripData.days.reduce((sum, d) => sum + d.activities.length, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-forest-muted)]">Booked</span>
                  <span className="font-medium">{tripData.days.flatMap((d) => d.activities).filter((a) => a.booked).length}</span>
                </div>
                <div className="pt-3 border-t border-[var(--color-sage)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-forest-muted)]">Est. Cost</span>
                    <span className="font-bold text-[var(--color-forest)]">${tripData.totalCost}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[var(--color-sage)]">
              <h3 className="font-semibold text-[var(--color-pine)] mb-3">Weather Forecast</h3>
              <div className="flex items-center gap-3">
                <div className="text-4xl">🌸</div>
                <div>
                  <p className="font-medium text-[var(--color-pine)]">Cherry Blossom Season</p>
                  <p className="text-sm text-[var(--color-forest-muted)]">15°C - 20°C • Partly cloudy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-[var(--color-pine)]">Share Trip</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 rounded-xl hover:bg-[var(--color-sage)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-forest-muted)] mb-2 block">
                  Share link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://wanderlust.ai/trip/${tripData.id}`}
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-sage-light)] text-sm"
                  />
                  <button className="px-4 py-3 rounded-xl bg-[var(--color-forest)] text-white hover:bg-[var(--color-pine)] transition-colors text-sm font-medium">
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-forest-muted)] mb-2 block">
                  Invite collaborators
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-sage-light)] border border-transparent focus:border-[var(--color-moss)] focus:outline-none text-sm"
                />
              </div>
              <button className="w-full py-3 rounded-xl bg-[var(--color-sun)] text-[var(--color-pine)] font-semibold hover:bg-[var(--color-sun-light)] transition-colors">
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
