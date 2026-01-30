'use client';

import { ChevronRight, Palmtree, Mountain, Utensils, Camera, Building2, Tent, Ship, Sparkles } from 'lucide-react';

interface TripCategoriesProps {
  onCategorySelect: (category: string) => void;
}

const categories = [
  {
    id: 'beach',
    label: 'Beach & Island',
    icon: Palmtree,
    iconColor: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    description: 'Tropical getaways',
  },
  {
    id: 'adventure',
    label: 'Adventure',
    icon: Mountain,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'Hiking & exploration',
  },
  {
    id: 'food',
    label: 'Food Tours',
    icon: Utensils,
    iconColor: 'text-rose-600',
    bgColor: 'bg-rose-100',
    description: 'Culinary experiences',
  },
  {
    id: 'culture',
    label: 'Culture',
    icon: Camera,
    iconColor: 'text-violet-600',
    bgColor: 'bg-violet-100',
    description: 'History & arts',
  },
  {
    id: 'city',
    label: 'City Break',
    icon: Building2,
    iconColor: 'text-slate-600',
    bgColor: 'bg-slate-100',
    description: 'Urban exploration',
  },
  {
    id: 'camping',
    label: 'Camping',
    icon: Tent,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    description: 'Nature escapes',
  },
  {
    id: 'cruise',
    label: 'Cruises',
    icon: Ship,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Sea journeys',
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: Sparkles,
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-100',
    description: 'Spa & retreats',
  },
];

export default function TripCategories({ onCategorySelect }: TripCategoriesProps) {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">Trip Categories</h2>
          <button className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.label)}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200 text-left group"
              >
                {/* Icon container with colored background */}
                <div className={`w-12 h-12 rounded-xl ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`w-6 h-6 ${category.iconColor}`} />
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors truncate">
                    {category.label}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{category.description}</p>
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
