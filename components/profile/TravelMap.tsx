'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { UserTravelHistory } from '@/lib/types/user';

interface TravelMapProps {
  travelHistory: UserTravelHistory[];
  height?: string;
}

// Custom marker icon
const createCustomIcon = (color: string = '#10b981') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

export default function TravelMap({ travelHistory, height = '300px' }: TravelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      scrollWheelZoom: false,
    });

    // Add OpenStreetMap tiles with a clean style
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers for travel history
    const markers: L.Marker[] = [];
    const bounds: L.LatLngBoundsExpression = [];

    // Separate visited and wishlist places
    const visitedPlaces = travelHistory.filter(p => !p.isWishlist);
    const wishlistPlaces = travelHistory.filter(p => p.isWishlist);

    // Add markers for visited places (green)
    visitedPlaces.forEach((place) => {
      if (place.lat && place.lng) {
        const marker = L.marker([place.lat, place.lng], {
          icon: createCustomIcon('#10b981'), // emerald
        }).addTo(map);

        const popupContent = `
          <div style="min-width: 150px;">
            <strong style="font-size: 14px;">${place.city}</strong>
            <div style="color: #666; font-size: 12px;">${place.country}</div>
            ${place.year ? `<div style="color: #999; font-size: 11px; margin-top: 4px;">
              ${place.month ? new Date(2000, place.month - 1).toLocaleString('default', { month: 'short' }) + ' ' : ''}${place.year}
            </div>` : ''}
            ${place.notes ? `<div style="color: #666; font-size: 12px; margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px;">${place.notes}</div>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);

        markers.push(marker);
        bounds.push([place.lat, place.lng]);
      }
    });

    // Add markers for wishlist places (yellow/amber)
    wishlistPlaces.forEach((place) => {
      if (place.lat && place.lng) {
        const marker = L.marker([place.lat, place.lng], {
          icon: createCustomIcon('#f59e0b'), // amber
        }).addTo(map);

        const popupContent = `
          <div style="min-width: 150px;">
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
              <span style="font-size: 12px;">⭐</span>
              <span style="font-size: 11px; color: #f59e0b; font-weight: 500;">Wishlist</span>
            </div>
            <strong style="font-size: 14px;">${place.city}</strong>
            <div style="color: #666; font-size: 12px;">${place.country}</div>
            ${place.notes ? `<div style="color: #666; font-size: 12px; margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px;">${place.notes}</div>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);

        markers.push(marker);
        bounds.push([place.lat, place.lng]);
      }
    });

    // Fit bounds if there are markers
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0] as L.LatLngExpression, 5);
      } else {
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
      }
    }

    // Draw lines connecting visited places only (travel path)
    const visitedBounds = visitedPlaces
      .filter(p => p.lat && p.lng)
      .map(p => [p.lat!, p.lng!] as L.LatLngExpression);

    if (visitedBounds.length > 1) {
      L.polyline(visitedBounds, {
        color: '#10b981',
        weight: 2,
        opacity: 0.5,
        dashArray: '5, 10',
      }).addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [travelHistory]);

  if (travelHistory.length === 0) {
    return (
      <div
        style={{ height }}
        className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-500 text-sm">Add places to see them on the map</p>
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
