'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/landing/Header';

// Dynamic import to avoid SSR issues with Leaflet
const CuratedTripView = dynamic(
  () => import('@/components/curated/CuratedTripView'),
  { ssr: false }
);

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } else if (response.status === 404) {
        setError('Trip not found');
      } else if (response.status === 403) {
        setError('You do not have permission to view this trip');
      } else {
        setError('Failed to load trip');
      }
    } catch (err) {
      console.error('Failed to fetch trip:', err);
      setError('Failed to load trip');
    } finally {
      setLoading(false);
    }
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

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Trip not found'}
            </h2>
            <p className="text-gray-500 mb-4">
              The trip you're looking for doesn't exist or you don't have access.
            </p>
            <button
              onClick={() => router.push('/my-trips')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              Back to My Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <CuratedTripView trip={trip} onBack={() => router.push('/my-trips')} />;
}
