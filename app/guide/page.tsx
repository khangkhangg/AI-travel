'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  MapPin,
  Star,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Settings,
  ChevronRight,
  Edit,
  MoreVertical,
  TrendingUp,
  Award,
  Globe,
  ArrowLeft,
} from 'lucide-react';
import { Tour, TourGuide, CreateTourRequest } from '@/lib/types/tour';
import TourForm from '@/components/tours/TourForm';

export default function GuideDashboardPage() {
  const router = useRouter();
  const [guide, setGuide] = useState<TourGuide | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingTour, setIsCreatingTour] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [activeTab, setActiveTab] = useState<'tours' | 'stats' | 'settings'>('tours');

  useEffect(() => {
    fetchGuideData();
  }, []);

  const fetchGuideData = async () => {
    try {
      // Check if user is a guide
      const guideRes = await fetch('/api/tour-guides?self=true');
      const guideData = await guideRes.json();

      if (!guideData.isGuide) {
        router.push('/guide/register');
        return;
      }

      setGuide(guideData.guide);

      // Fetch guide's tours
      const toursRes = await fetch(`/api/tours?guideId=${guideData.guide.id}`);
      const toursData = await toursRes.json();
      setTours(toursData.tours || []);
    } catch (err) {
      console.error('Failed to fetch guide data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTourSaved = async (data: CreateTourRequest): Promise<void> => {
    const url = editingTour ? `/api/tours/${editingTour.id}` : '/api/tours';
    const method = editingTour ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save tour');
    }

    const { tour: savedTour } = await res.json();

    if (editingTour) {
      setTours(prev => prev.map(t => t.id === savedTour.id ? savedTour : t));
    } else {
      setTours(prev => [savedTour, ...prev]);
    }
    setIsCreatingTour(false);
    setEditingTour(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isCreatingTour || editingTour) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <button
              onClick={() => {
                setIsCreatingTour(false);
                setEditingTour(null);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          <TourForm
            tour={editingTour || undefined}
            onSave={handleTourSaved}
            onCancel={() => {
              setIsCreatingTour(false);
              setEditingTour(null);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-bold text-gray-900">Guide Dashboard</h1>
                <p className="text-xs text-gray-500">{guide?.businessName || 'Your Tours'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsCreatingTour(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Tour
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Tours',
              value: tours.length,
              icon: MapPin,
              color: 'bg-teal-50 text-teal-600',
            },
            {
              label: 'Total Bookings',
              value: guide?.totalBookings || 0,
              icon: Users,
              color: 'bg-blue-50 text-blue-600',
            },
            {
              label: 'Rating',
              value: guide?.rating?.toFixed(1) || '0.0',
              icon: Star,
              color: 'bg-amber-50 text-amber-600',
              suffix: ` (${guide?.totalReviews || 0} reviews)`,
            },
            {
              label: 'Status',
              value: guide?.isVerified ? 'Verified' : 'Pending',
              icon: Award,
              color: guide?.isVerified ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600',
            },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
                {stat.suffix && <span className="text-sm font-normal text-gray-500">{stat.suffix}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {[
            { id: 'tours', label: 'My Tours', icon: MapPin },
            { id: 'stats', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'tours' && (
          <div>
            {tours.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-teal-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create Your First Tour</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Start sharing your local expertise by creating a tour experience for travelers.
                </p>
                <button
                  onClick={() => setIsCreatingTour(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Tour
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tours.map((tour) => (
                  <div
                    key={tour.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 flex-shrink-0 overflow-hidden">
                        {tour.images && tour.images[0] ? (
                          <img
                            src={tour.images[0].url}
                            alt={tour.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {tour.tags?.[0]?.icon || '🌍'}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{tour.name}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {tour.city}, {tour.country}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tour.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : tour.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-600'
                            }`}>
                              {tour.status}
                            </span>
                            <button
                              onClick={() => setEditingTour(tour)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${tour.pricePerPerson}/person
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {tour.durationDays} {tour.durationDays === 1 ? 'day' : 'days'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {tour.viewsCount || 0} views
                          </span>
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="w-4 h-4 fill-current" />
                            {tour.rating?.toFixed(1) || '0.0'} ({tour.reviewsCount || 0})
                          </span>
                        </div>

                        {/* Tags */}
                        {tour.tags && tour.tags.length > 0 && (
                          <div className="flex gap-1 mt-3">
                            {tour.tags.slice(0, 4).map(tag => (
                              <span
                                key={tag.id}
                                className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
                              >
                                {tag.icon} {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
            <p className="text-gray-500">Track your tour performance, bookings, and revenue.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Guide Profile Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  defaultValue={guide?.businessName || ''}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  defaultValue={guide?.bio || ''}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    defaultValue={guide?.phone || ''}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    defaultValue={guide?.website || ''}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4">
                <button className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
