'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Calendar, Tag, Briefcase, Hotel, Car, ChevronRight, Sparkles, DollarSign, AlertCircle } from 'lucide-react';

interface MarketplaceItinerary {
  id: string;
  title: string;
  destination: string;
  country: string;
  duration: string;
  startDate?: string;
  travelers: number;
  budget?: string;
  coverEmoji: string;
  status: 'open' | 'has_offers' | 'booked';
  categories: string[];
  needs: ('guide' | 'hotel' | 'transport' | 'experience')[];
  offersCount: number;
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
}

// Mock data - replace with API call
const mockMarketplaceItineraries: MarketplaceItinerary[] = [
  {
    id: '1',
    title: 'Tokyo Family Adventure',
    destination: 'Tokyo',
    country: 'Japan',
    duration: '6 days',
    startDate: 'Mar 15-20, 2026',
    travelers: 4,
    budget: '$3,000-4,000',
    coverEmoji: '🗼',
    status: 'has_offers',
    categories: ['Family', 'Culture'],
    needs: ['guide', 'hotel'],
    offersCount: 5,
    createdAt: '2 hours ago',
    user: { name: 'David K.' },
  },
  {
    id: '2',
    title: 'Romantic Santorini Getaway',
    destination: 'Santorini',
    country: 'Greece',
    duration: '4 days',
    startDate: 'Apr 8-12, 2026',
    travelers: 2,
    budget: '$2,500-3,500',
    coverEmoji: '🌅',
    status: 'open',
    categories: ['Romantic', 'Beach'],
    needs: ['hotel', 'experience'],
    offersCount: 0,
    createdAt: '5 hours ago',
    user: { name: 'Jessica M.' },
  },
  {
    id: '3',
    title: 'Vietnam Street Food Tour',
    destination: 'Ho Chi Minh City',
    country: 'Vietnam',
    duration: '5 days',
    startDate: 'Feb 20-25, 2026',
    travelers: 3,
    budget: '$1,500-2,000',
    coverEmoji: '🍜',
    status: 'has_offers',
    categories: ['Food', 'Culture'],
    needs: ['guide', 'transport'],
    offersCount: 8,
    createdAt: '1 day ago',
    user: { name: 'Alex T.' },
  },
  {
    id: '4',
    title: 'Morocco Desert Experience',
    destination: 'Marrakech',
    country: 'Morocco',
    duration: '7 days',
    startDate: 'May 1-8, 2026',
    travelers: 6,
    budget: '$4,000-5,500',
    coverEmoji: '🐪',
    status: 'open',
    categories: ['Adventure', 'Culture'],
    needs: ['guide', 'hotel', 'transport'],
    offersCount: 2,
    createdAt: '3 hours ago',
    user: { name: 'Team Building Co.' },
  },
  {
    id: '5',
    title: 'Iceland Northern Lights',
    destination: 'Reykjavik',
    country: 'Iceland',
    duration: '5 days',
    startDate: 'Dec 10-15, 2026',
    travelers: 2,
    budget: '$3,500-4,500',
    coverEmoji: '🌌',
    status: 'has_offers',
    categories: ['Adventure', 'Nature'],
    needs: ['guide', 'hotel', 'transport'],
    offersCount: 4,
    createdAt: '6 hours ago',
    user: { name: 'Linda & Tom' },
  },
];

const needIcons = {
  guide: { icon: Users, label: 'Tour Guide', color: 'text-blue-500 bg-blue-50' },
  hotel: { icon: Hotel, label: 'Accommodation', color: 'text-purple-500 bg-purple-50' },
  transport: { icon: Car, label: 'Transport', color: 'text-green-500 bg-green-50' },
  experience: { icon: Sparkles, label: 'Experience', color: 'text-amber-500 bg-amber-50' },
};

interface MarketplaceItinerariesProps {
  onViewItinerary?: (id: string) => void;
  onMakeOffer?: (id: string) => void;
}

export default function MarketplaceItineraries({ onViewItinerary, onMakeOffer }: MarketplaceItinerariesProps) {
  const [itineraries, setItineraries] = useState<MarketplaceItinerary[]>(mockMarketplaceItineraries);
  const [filter, setFilter] = useState<'all' | 'guide' | 'hotel' | 'transport'>('all');

  // Fetch from API in production
  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const response = await fetch('/api/itineraries?visibility=public&marketplace=true&limit=5');
        if (response.ok) {
          const data = await response.json();
          if (data.itineraries && data.itineraries.length > 0) {
            // Map API response to component format
          }
        }
      } catch (error) {
        console.error('Failed to fetch marketplace itineraries:', error);
      }
    };
    fetchItineraries();
  }, []);

  const filteredItineraries = filter === 'all'
    ? itineraries
    : itineraries.filter(i => i.needs.includes(filter as any));

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-teal-600" />
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Business Marketplace</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Travelers Looking for Services</h2>
            <p className="text-gray-500 mt-1">Connect with travelers and offer your services</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
              View all requests
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'guide', label: 'Need Guide', icon: Users },
            { id: 'hotel', label: 'Need Hotel', icon: Hotel },
            { id: 'transport', label: 'Need Transport', icon: Car },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.icon && <f.icon className="w-3 h-3" />}
              {f.label}
            </button>
          ))}
        </div>

        {/* Itinerary List */}
        <div className="space-y-4">
          {filteredItineraries.map((itinerary) => (
            <div
              key={itinerary.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-teal-200 hover:shadow-lg transition-all group"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Cover */}
                <div className="sm:w-32 h-24 sm:h-auto bg-gradient-to-br from-teal-100 via-emerald-100 to-cyan-100 flex items-center justify-center text-4xl sm:text-5xl flex-shrink-0">
                  {itinerary.coverEmoji}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Left: Info */}
                    <div className="flex-1">
                      {/* Status & Time */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          itinerary.status === 'open'
                            ? 'bg-emerald-100 text-emerald-700'
                            : itinerary.status === 'has_offers'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {itinerary.status === 'open' ? 'Open for Offers' :
                           itinerary.status === 'has_offers' ? `${itinerary.offersCount} Offers` : 'Booked'}
                        </span>
                        <span className="text-[10px] text-gray-400">{itinerary.createdAt}</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                        {itinerary.title}
                      </h3>

                      {/* Location & Details */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {itinerary.destination}, {itinerary.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {itinerary.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {itinerary.travelers} travelers
                        </span>
                        {itinerary.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {itinerary.startDate}
                          </span>
                        )}
                      </div>

                      {/* Budget */}
                      {itinerary.budget && (
                        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
                          <DollarSign className="w-3 h-3" />
                          Budget: {itinerary.budget}
                        </div>
                      )}

                      {/* Needs */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-[10px] text-gray-400 font-medium">Looking for:</span>
                        {itinerary.needs.map((need) => {
                          const config = needIcons[need];
                          return (
                            <span
                              key={need}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}
                            >
                              <config.icon className="w-3 h-3" />
                              {config.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <button
                        onClick={() => onMakeOffer?.(itinerary.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-xs font-semibold hover:from-teal-700 hover:to-teal-800 transition-all shadow-md"
                      >
                        Make Offer
                      </button>
                      <button
                        onClick={() => onViewItinerary?.(itinerary.id)}
                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA for Businesses */}
        <div className="mt-8 p-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Are you a tour guide, hotel, or service provider?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Register your business to receive notifications and make offers to travelers.
                </p>
              </div>
            </div>
            <button className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-all shadow-md">
              Register Business
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Travelers share their plans publicly to receive offers from verified businesses.
            All transactions are protected by our secure escrow system.
          </p>
        </div>
      </div>
    </section>
  );
}
