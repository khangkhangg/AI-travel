'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Heart, Eye, MapPin, Calendar, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Trip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  num_people: number;
  city: string;
  travel_type: string[];
  total_cost: number;
  likes_count: number;
  views_count: number;
  created_at: string;
  owner_name: string | null;
  owner_email: string;
  owner_avatar: string | null;
  ai_model_name: string;
  activities_count: number;
  preview: any;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    city: '',
    travelType: '',
    sortBy: 'recent'
  });

  useEffect(() => {
    fetchTrips();
  }, [page, filters]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(filters.city && { city: filters.city }),
        ...(filters.travelType && { travelType: filters.travelType }),
        sortBy: filters.sortBy
      });

      const response = await fetch(`/api/discover?${params}`);
      const data = await response.json();

      setTrips(data.trips || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (tripId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh trips
        fetchTrips();
      }
    } catch (error) {
      console.error('Failed to like trip:', error);
    }
  };

  const travelTypes = [
    'Fun', 'Sightseeing', 'Museum', 'Adventure', 'Beach',
    'Food Tour', 'Shopping', 'Nightlife', 'Nature', 'Culture', 'Relaxation'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Discover Amazing Trips</h1>
          <p className="text-gray-600 mt-2">
            Browse and get inspired by trips created by travelers around the world
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* City search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by city..."
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Travel type filter */}
            <select
              value={filters.travelType}
              onChange={(e) => setFilters({ ...filters, travelType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {travelTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Sort by */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="likes">Most Liked</option>
            </select>

            {/* Apply button */}
            <button
              onClick={() => fetchTrips()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>

        {/* Trip Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden cursor-pointer"
                onClick={() => router.push(`/trips/${trip.id}`)}
              >
                {/* Card header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{trip.title}</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d')}
                      </span>
                    </div>
                    {trip.city && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{trip.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  {/* Travel types */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {trip.travel_type.slice(0, 3).map((type, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {type}
                      </span>
                    ))}
                    {trip.travel_type.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        +{trip.travel_type.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{trip.num_people}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{trip.views_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{trip.likes_count}</span>
                    </div>
                  </div>

                  {/* Cost */}
                  {trip.total_cost && (
                    <div className="text-lg font-bold text-green-600 mb-4">
                      ${trip.total_cost.toLocaleString()} total
                    </div>
                  )}

                  {/* Creator */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                    {trip.owner_avatar ? (
                      <img
                        src={trip.owner_avatar}
                        alt={trip.owner_name || trip.owner_email}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                        {(trip.owner_name || trip.owner_email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {trip.owner_name || trip.owner_email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(trip.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {trip.activities_count} activities
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(trip.id);
                    }}
                    className="text-red-500 hover:text-red-600 transition"
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
