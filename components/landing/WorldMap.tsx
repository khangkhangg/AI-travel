'use client';

import { useState } from 'react';
import { MapPin, Plane, TrendingUp, ChevronRight, Globe } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  destinations: string[];
  position: { top: string; left: string };
  color: string;
  bgColor: string;
}

interface WorldMapProps {
  onRegionSelect: (region: string) => void;
  onDestinationSelect: (destination: string) => void;
}

const regions: Region[] = [
  {
    id: 'north-america',
    name: 'North America',
    destinations: ['New York', 'Los Angeles', 'Cancun', 'Vancouver'],
    position: { top: '32%', left: '20%' },
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500',
  },
  {
    id: 'south-america',
    name: 'South America',
    destinations: ['Rio de Janeiro', 'Buenos Aires', 'Machu Picchu', 'Patagonia'],
    position: { top: '62%', left: '30%' },
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-500',
  },
  {
    id: 'europe',
    name: 'Europe',
    destinations: ['Paris', 'Rome', 'Barcelona', 'London'],
    position: { top: '30%', left: '50%' },
    color: 'from-violet-500 to-violet-600',
    bgColor: 'bg-violet-500',
  },
  {
    id: 'africa',
    name: 'Africa',
    destinations: ['Marrakech', 'Cape Town', 'Safari Kenya', 'Cairo'],
    position: { top: '52%', left: '52%' },
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-500',
  },
  {
    id: 'asia',
    name: 'Asia',
    destinations: ['Tokyo', 'Bali', 'Bangkok', 'Singapore'],
    position: { top: '38%', left: '75%' },
    color: 'from-rose-500 to-rose-600',
    bgColor: 'bg-rose-500',
  },
  {
    id: 'oceania',
    name: 'Oceania',
    destinations: ['Sydney', 'Bora Bora', 'New Zealand', 'Fiji'],
    position: { top: '68%', left: '85%' },
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-500',
  },
];

const trendingDestinations = [
  { name: 'Kyoto', region: 'Asia', trend: '+23%', emoji: '🏯' },
  { name: 'Lisbon', region: 'Europe', trend: '+18%', emoji: '🏛️' },
  { name: 'Tulum', region: 'North America', trend: '+15%', emoji: '🏖️' },
];

export default function WorldMap({ onRegionSelect, onDestinationSelect }: WorldMapProps) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const handleRegionClick = (region: Region) => {
    setActiveRegion(activeRegion === region.id ? null : region.id);
    onRegionSelect(region.name);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-950">Explore the World</h2>
            <p className="text-sm text-emerald-600">Click a region to discover destinations</p>
          </div>
        </div>

        {/* Trending Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 whitespace-nowrap">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">Trending:</span>
          </div>
          {trendingDestinations.map((dest, index) => (
            <button
              key={index}
              onClick={() => onDestinationSelect(dest.name)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all text-sm whitespace-nowrap"
            >
              <span>{dest.emoji}</span>
              <span className="font-medium text-emerald-900">{dest.name}</span>
              <span className="text-xs font-semibold text-emerald-500">{dest.trend}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[450px] rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-100 overflow-hidden shadow-lg">
        {/* Decorative Background */}
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(16 185 129 / 0.2) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />

          {/* Continent shapes */}
          <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
            {/* North America */}
            <path d="M80 80 Q180 60 220 120 L200 200 Q160 240 100 220 L60 160 Z" fill="rgb(209 250 229)" opacity="0.6"/>
            {/* South America */}
            <path d="M180 280 Q220 260 250 300 L240 400 Q200 440 160 400 L170 340 Z" fill="rgb(209 250 229)" opacity="0.6"/>
            {/* Europe */}
            <path d="M440 80 Q520 60 560 100 L550 160 Q510 180 450 160 L430 120 Z" fill="rgb(209 250 229)" opacity="0.6"/>
            {/* Africa */}
            <path d="M460 200 Q520 180 560 220 L550 340 Q500 380 450 340 L440 260 Z" fill="rgb(209 250 229)" opacity="0.6"/>
            {/* Asia */}
            <path d="M620 80 Q780 40 860 120 L840 240 Q760 280 660 220 L600 140 Z" fill="rgb(209 250 229)" opacity="0.6"/>
            {/* Australia */}
            <path d="M800 320 Q860 300 900 340 L890 400 Q840 420 800 380 Z" fill="rgb(209 250 229)" opacity="0.6"/>
          </svg>
        </div>

        {/* Animated flight paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="flightPath" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0" />
              <stop offset="50%" stopColor="rgb(16 185 129)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M180 150 Q350 80 480 130" stroke="url(#flightPath)" strokeWidth="2" fill="none" strokeDasharray="6 4" className="animate-pulse"/>
          <path d="M500 140 Q620 100 750 160" stroke="url(#flightPath)" strokeWidth="2" fill="none" strokeDasharray="6 4" className="animate-pulse" style={{ animationDelay: '0.5s' }}/>
          <path d="M760 170 Q800 260 860 340" stroke="url(#flightPath)" strokeWidth="2" fill="none" strokeDasharray="6 4" className="animate-pulse" style={{ animationDelay: '1s' }}/>
        </svg>

        {/* Region Markers */}
        {regions.map((region) => (
          <div
            key={region.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ top: region.position.top, left: region.position.left }}
          >
            <button
              onClick={() => handleRegionClick(region)}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              className={`group relative transition-all duration-300 ${
                activeRegion === region.id ? 'scale-110' : 'hover:scale-105'
              }`}
            >
              {/* Pulse ring */}
              <div className={`absolute inset-0 w-14 h-14 -m-2 rounded-full ${region.bgColor} opacity-20 animate-ping`} style={{ animationDuration: '2s' }}/>

              {/* Glow effect */}
              <div className={`absolute inset-0 w-10 h-10 rounded-full ${region.bgColor} opacity-30 blur-md`}/>

              {/* Main marker */}
              <div className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${region.color} flex items-center justify-center shadow-lg cursor-pointer border-2 border-white ${
                activeRegion === region.id ? 'ring-4 ring-white/50' : ''
              }`}>
                <MapPin className="w-5 h-5 text-white" />
              </div>

              {/* Tooltip */}
              <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-white rounded-xl shadow-xl border border-emerald-100 whitespace-nowrap transition-all duration-200 ${
                hoveredRegion === region.id || activeRegion === region.id
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2 pointer-events-none'
              }`}>
                <p className="font-bold text-sm text-emerald-900">{region.name}</p>
                <p className="text-xs text-emerald-600">{region.destinations.length} destinations</p>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-emerald-100 rotate-45"/>
              </div>
            </button>

            {/* Expanded destinations dropdown */}
            {activeRegion === region.id && (
              <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-emerald-100 p-4 min-w-[200px] animate-in zoom-in-95 duration-200 z-20">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-emerald-100">
                  <div className={`w-3 h-3 rounded-full ${region.bgColor}`} />
                  <span className="font-bold text-sm text-emerald-900">{region.name}</span>
                </div>
                <div className="space-y-1">
                  {region.destinations.map((dest, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDestinationSelect(dest);
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-800">{dest}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Live activity indicator */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur rounded-full shadow-md border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">Live traveler activity</span>
        </div>

        {/* Region count */}
        <div className="absolute bottom-4 right-4 px-3 py-2 bg-white/90 backdrop-blur rounded-full shadow-md border border-emerald-100">
          <span className="text-xs font-medium text-emerald-700">{regions.length} regions • 24 destinations</span>
        </div>
      </div>
    </div>
  );
}
