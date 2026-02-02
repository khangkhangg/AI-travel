'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TravelPlace {
  id: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  year?: number;
  month?: number;
  notes?: string;
  isWishlist?: boolean;
}

interface TravelMapWithWishlistProps {
  travelHistory: TravelPlace[];
  height?: string;
  darkMode?: boolean;
}

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

export default function TravelMapWithWishlist({ 
  travelHistory, 
  height = '400px',
  darkMode = false 
}: TravelMapWithWishlistProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      scrollWheelZoom: false,
    });

    // Use dark or light tile layer
    const tileUrl = darkMode
      ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    const bounds: L.LatLngExpression[] = [];

    travelHistory.forEach((place) => {
      if (place.lat && place.lng) {
        const color = place.isWishlist ? '#f59e0b' : '#10b981';
        const marker = L.marker([place.lat, place.lng], {
          icon: createCustomIcon(color),
        }).addTo(map);

        const popupContent = `
          <div style="min-width: 120px; font-family: system-ui;">
            <div style="font-size: 11px; color: ${place.isWishlist ? '#f59e0b' : '#10b981'}; font-weight: 600; margin-bottom: 2px;">
              ${place.isWishlist ? 'WISHLIST' : 'VISITED'}
            </div>
            <strong style="font-size: 14px;">${place.city}</strong>
            <div style="color: #666; font-size: 12px;">${place.country}</div>
          </div>
        `;
        marker.bindPopup(popupContent);
        bounds.push([place.lat, place.lng]);
      }
    });

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 5);
      } else {
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [travelHistory, darkMode]);

  if (travelHistory.length === 0) {
    return (
      <div
        style={{ height }}
        className={`rounded-xl flex items-center justify-center ${darkMode ? 'bg-zinc-900' : 'bg-gradient-to-br from-emerald-50 to-teal-50'}`}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            Add places to see them on the map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className="rounded-xl overflow-hidden"
    />
  );
}
