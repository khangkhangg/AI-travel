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
}

interface TripMapProps {
  locations: MapLocation[];
  activeDay: number;
  totalDays: number;
  height?: string;
  onPinClick?: (locationId: string) => void;
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

export default function TripMap({
  locations,
  activeDay,
  totalDays,
  height = '400px',
  onPinClick,
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

      const isActive = loc.dayNumber === activeDay;
      const marker = L.marker([loc.lat, loc.lng], {
        icon: createDayIcon(loc.dayNumber, isActive),
        zIndexOffset: isActive ? 1000 : 0,
      }).addTo(map);

      // Popup
      const popupContent = `
        <div style="min-width: 150px;">
          <strong style="font-size: 14px;">${loc.title}</strong>
          <div style="color: #666; font-size: 12px; margin-top: 4px;">
            Day ${loc.dayNumber}${loc.category ? ` · ${loc.category}` : ''}
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
  }, [locations, onPinClick]);

  // Update markers when active day changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activeDayLocations: L.LatLngExpression[] = [];

    markersRef.current.forEach((marker, id) => {
      const loc = locations.find((l) => l.id === id);
      if (!loc) return;

      const isActive = loc.dayNumber === activeDay;
      marker.setIcon(createDayIcon(loc.dayNumber, isActive));
      marker.setZIndexOffset(isActive ? 1000 : 0);

      if (isActive && loc.lat && loc.lng) {
        activeDayLocations.push([loc.lat, loc.lng]);
      }
    });

    // Pan to active day's locations
    if (activeDayLocations.length > 0) {
      if (activeDayLocations.length === 1) {
        map.setView(activeDayLocations[0], 14, { animate: true });
      } else {
        map.fitBounds(activeDayLocations as L.LatLngBoundsExpression, {
          padding: [40, 40],
          animate: true,
        });
      }
    }
  }, [activeDay, locations]);

  // Get unique days for legend
  const uniqueDays = Array.from(new Set(locations.map((l) => l.dayNumber))).sort((a, b) => a - b);

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
                day === activeDay ? 'font-semibold' : 'opacity-60'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getDayColor(day) }}
              />
              <span>Day {day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { getDayColor, DAY_COLORS };
