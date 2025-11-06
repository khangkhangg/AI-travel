'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, MapPin, Calendar, Users, DollarSign, Sparkles } from 'lucide-react';
import TripForm from '@/components/TripForm';
import ItineraryDisplay from '@/components/ItineraryDisplay';

export default function Home() {
  const [generatedTrip, setGeneratedTrip] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleTripGenerated = (trip: any) => {
    setGeneratedTrip(trip);
    setIsGenerating(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Plane className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Travel Planner</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/trips')}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                My Trips
              </button>
              <button
                onClick={() => router.push('/discover')}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Discover
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Profile
              </button>
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Login
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {!generatedTrip && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Plan Your Perfect Trip with AI
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Tell us about your dream vacation and let AI create a personalized itinerary
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md">
                <MapPin className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Recommendations</h3>
                <p className="text-gray-600 text-sm">
                  Get personalized suggestions for places to visit, eat, and explore
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md">
                <Calendar className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Day-by-Day Planning</h3>
                <p className="text-gray-600 text-sm">
                  Complete itineraries with timing, costs, and practical tips
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md">
                <Users className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Collaborate & Share</h3>
                <p className="text-gray-600 text-sm">
                  Plan together, vote on activities, and share your adventures
                </p>
              </div>
            </div>
          </div>

          {/* Trip Form */}
          <div className="max-w-4xl mx-auto">
            <TripForm
              onSubmit={handleTripGenerated}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
            />
          </div>
        </div>
      )}

      {/* Generated Itinerary */}
      {generatedTrip && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => setGeneratedTrip(null)}
            className="mb-6 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Plan Another Trip
          </button>
          <ItineraryDisplay trip={generatedTrip} />
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Plane className="w-6 h-6" />
                <span className="font-bold text-lg">AI Travel</span>
              </div>
              <p className="text-gray-400 text-sm">
                Plan your perfect trip with AI-powered recommendations
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2025 AI Travel Planner. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
