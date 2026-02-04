'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapLocation {
  id: string;
  title: string;
  lat: number;
  lng: number;
  dayNumber: number;
  category?: string;
  type?: 'activity' | 'suggestion';  // Suggestions show with purple pin
}

interface TripMapProps {
  locations: MapLocation[];
  activeDay: number;
  totalDays: number;
  height?: string;
  onPinClick?: (locationId: string) => void;
  showAllDays?: boolean;  // When true, shows all markers at full opacity and fits all bounds
}

// Day colors for pins
const DAY_COLORS = [
  '#10b981', // emerald (Day 1)
  '#3b82f6', // blue (Day 2)
  '#f59e0b', // amber (Day 3)
  '#f43f5e', // rose (Day 4)
  '#8b5cf6', // violet (Day 5)
  '#06b6d4', // cyan (Day 6)
  '#ec4899', // pink (Day 7)
  '#84cc16', // lime (Day 8)
];

const getDayColor = (dayNumber: number): string => {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
};

// Create custom marker icon
const createDayIcon = (dayNumber: number, isActive: boolean) => {
  const color = getDayColor(dayNumber);
  const size = isActive ? 28 : 22;
  const opacity = isActive ? 1 : 0.4;

  return L.divIcon({
    className: 'custom-day-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        opacity: ${opacity};
        transition: all 0.3s ease;
      ">
        <div style="
          width: ${size * 0.35}px;
          height: ${size * 0.35}px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// Create suggestion marker icon (purple)
const createSuggestionIcon = (isActive: boolean) => {
  const color = '#9333ea';  // Purple-600
  const size = isActive ? 28 : 22;
  const opacity = isActive ? 1 : 0.7;

  return L.divIcon({
    className: 'custom-suggestion-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        opacity: ${opacity};
        transition: all 0.3s ease;
      ">
        <div style="
          width: ${size * 0.5}px;
          height: ${size * 0.5}px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.3}px;
          font-weight: bold;
          color: ${color};
        ">★</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export default function TripMap({
  locations,
  activeDay,
  totalDays,
  height = '400px',
  onPinClick,
  showAllDays = false,
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [45, 10],
      zoom: 4,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add/update markers when locations change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    if (locations.length === 0) return;

    const bounds: L.LatLngExpression[] = [];

    locations.forEach((loc) => {
      if (!loc.lat || !loc.lng) return;

      // When showAllDays is true, all markers are "active" (full opacity)
      const isActive = showAllDays || loc.dayNumber === activeDay;
      const isSuggestion = loc.type === 'suggestion';

      // Use purple suggestion icon or day-colored icon
      const icon = isSuggestion
        ? createSuggestionIcon(isActive)
        : createDayIcon(loc.dayNumber, isActive);

      const marker = L.marker([loc.lat, loc.lng], {
        icon,
        zIndexOffset: isActive ? 1000 : (isSuggestion ? 500 : 0),
      }).addTo(map);

      // Popup - show "Suggestion" label for suggestions
      const typeLabel = isSuggestion ? 'Suggestion' : `Day ${loc.dayNumber}`;
      const popupContent = `
        <div style="min-width: 150px;">
          <strong style="font-size: 14px;">${loc.title}</strong>
          <div style="color: ${isSuggestion ? '#9333ea' : '#666'}; font-size: 12px; margin-top: 4px;">
            ${typeLabel}${loc.category ? ` · ${loc.category}` : ''}
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);

      // Click handler
      if (onPinClick) {
        marker.on('click', () => onPinClick(loc.id));
      }

      markersRef.current.set(loc.id, marker);
      bounds.push([loc.lat, loc.lng]);
    });

    // Fit bounds
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      } else {
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40] });
      }
    }
  }, [locations, onPinClick, showAllDays, activeDay]);

  // Update markers when active day or showAllDays changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const visibleLocations: L.LatLngExpression[] = [];

    markersRef.current.forEach((marker, id) => {
      const loc = locations.find((l) => l.id === id);
      if (!loc) return;

      // When showAllDays is true, all markers are "active" (full opacity)
      const isActive = showAllDays || loc.dayNumber === activeDay;
      const isSuggestion = loc.type === 'suggestion';

      // Use suggestion icon for suggestions, day icon for activities
      const icon = isSuggestion
        ? createSuggestionIcon(isActive)
        : createDayIcon(loc.dayNumber, isActive);

      marker.setIcon(icon);
      marker.setZIndexOffset(isActive ? 1000 : (isSuggestion ? 500 : 0));

      // When showAllDays, collect all locations; otherwise only active day
      if ((showAllDays || isActive) && loc.lat && loc.lng) {
        visibleLocations.push([loc.lat, loc.lng]);
      }
    });

    // Pan to visible locations
    if (visibleLocations.length > 0) {
      if (visibleLocations.length === 1) {
        map.setView(visibleLocations[0], 14, { animate: true });
      } else {
        map.fitBounds(visibleLocations as L.LatLngBoundsExpression, {
          padding: [40, 40],
          animate: true,
        });
      }
    }
  }, [activeDay, showAllDays, locations]);

  // Get unique days for legend (only from activities, not suggestions)
  const uniqueDays = Array.from(new Set(
    locations.filter(l => l.type !== 'suggestion').map((l) => l.dayNumber)
  )).sort((a, b) => a - b);

  // Check if there are any suggestions
  const hasSuggestions = locations.some(l => l.type === 'suggestion');

  if (locations.length === 0) {
    return (
      <div
        style={{ height, minHeight: '300px' }}
        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-500 text-sm">No locations to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full" style={{ minHeight: '300px' }}>
      <div
        ref={mapRef}
        style={{ height }}
        className="rounded-xl overflow-hidden"
      />

      {/* Day Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <div className="flex flex-wrap gap-2 text-xs">
          {uniqueDays.map((day) => (
            <div
              key={day}
              className={`flex items-center gap-1.5 ${
                (showAllDays || day === activeDay) ? 'font-semibold' : 'opacity-60'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getDayColor(day) }}
              />
              <span>Day {day}</span>
            </div>
          ))}
          {/* Suggestions legend entry */}
          {hasSuggestions && (
            <div className="flex items-center gap-1.5 font-semibold">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#9333ea' }}
              />
              <span>Suggestions</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { getDayColor, DAY_COLORS };
