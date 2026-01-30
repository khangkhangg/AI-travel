'use client';

import { useState } from 'react';
import { ChevronRight, Star, Heart, MapPin } from 'lucide-react';

interface PopularDestinationsProps {
  onDestinationSelect: (destination: string) => void;
}

interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  rating: number;
  reviews: number;
  price: string;
  tag: string;
  tagColor: string;
}

const destinations: Destination[] = [
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    image: '🏝️',
    rating: 4.9,
    reviews: 3421,
    price: 'From $89/day',
    tag: 'Trending',
    tagColor: 'bg-rose-500 text-white',
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    image: '⛩️',
    rating: 4.8,
    reviews: 2847,
    price: 'From $120/day',
    tag: 'Popular',
    tagColor: 'bg-blue-500 text-white',
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Greece',
    image: '🏛️',
    rating: 4.9,
    reviews: 1923,
    price: 'From $150/day',
    tag: 'Romantic',
    tagColor: 'bg-pink-500 text-white',
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    image: '🗼',
    rating: 4.7,
    reviews: 4156,
    price: 'From $110/day',
    tag: 'Classic',
    tagColor: 'bg-violet-500 text-white',
  },
  {
    id: 'maldives',
    name: 'Maldives',
    country: 'Maldives',
    image: '🐠',
    rating: 4.9,
    reviews: 1654,
    price: 'From $200/day',
    tag: 'Luxury',
    tagColor: 'bg-amber-500 text-white',
  },
  {
    id: 'iceland',
    name: 'Iceland',
    country: 'Iceland',
    image: '🌋',
    rating: 4.8,
    reviews: 1287,
    price: 'From $130/day',
    tag: 'Adventure',
    tagColor: 'bg-emerald-500 text-white',
  },
];

export default function PopularDestinations({ onDestinationSelect }: PopularDestinationsProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">Popular Destinations</h2>
          <button className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Destinations grid - horizontal scroll on mobile, grid on desktop */}
        <div className="flex lg:grid lg:grid-cols-3 gap-5 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
          {destinations.map((destination) => (
            <div
              key={destination.id}
              onClick={() => onDestinationSelect(destination.name)}
              className="flex-shrink-0 w-[300px] lg:w-auto bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
            >
              {/* Image area */}
              <div className="relative h-44 bg-gradient-to-br from-teal-100 via-teal-200 to-cyan-100 overflow-hidden">
                {/* Emoji placeholder */}
                <div className="absolute inset-0 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-500">
                  {destination.image}
                </div>

                {/* Tag */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${destination.tagColor}`}>
                    {destination.tag}
                  </span>
                </div>

                {/* Favorite button */}
                <button
                  onClick={(e) => toggleFavorite(destination.id, e)}
                  className={`absolute top-3 right-3 p-2.5 rounded-full transition-all shadow-lg ${
                    favorites.has(destination.id)
                      ? 'bg-rose-500 text-white scale-110'
                      : 'bg-white/90 text-gray-400 hover:text-rose-500 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${favorites.has(destination.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-700 transition-colors">
                      {destination.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                      <MapPin className="w-4 h-4" />
                      {destination.country}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-gray-900">{destination.rating}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {destination.reviews.toLocaleString()} reviews
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-teal-700 font-bold">{destination.price}</span>
                  <button className="flex items-center gap-1 text-teal-600 text-sm font-semibold hover:text-teal-800 transition-colors">
                    View details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
