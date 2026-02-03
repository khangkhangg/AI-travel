'use client';

import { MapPin, Plus, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { UserTravelHistory } from '@/lib/types/user';

const TravelMap = dynamic(() => import('@/components/profile/TravelMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />,
});

interface TravelHistoryPanelProps {
  travelHistory: UserTravelHistory[];
  onAddPlace: () => void;
  onAddWishlist: () => void;
  onDelete: (id: string) => void;
  onEdit?: (place: UserTravelHistory) => void;
}

export default function TravelHistoryPanel({
  travelHistory,
  onAddPlace,
  onAddWishlist,
  onDelete,
  onEdit,
}: TravelHistoryPanelProps) {
  const visitedPlaces = travelHistory.filter((p) => !p.isWishlist);
  const wishlistPlaces = travelHistory.filter((p) => p.isWishlist);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Travel History</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddWishlist}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Wishlist
          </button>
          <button
            onClick={onAddPlace}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Place
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Map */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <TravelMap travelHistory={travelHistory} />
          <div className="flex items-center justify-center gap-6 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">{visitedPlaces.length} visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600">{wishlistPlaces.length} wishlist</span>
            </div>
          </div>
        </div>

        {/* Visited Places */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Visited Places</h3>
          {visitedPlaces.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {visitedPlaces.map((place) => (
                <div
                  key={place.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 group cursor-pointer"
                  onClick={() => onEdit?.(place)}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {place.city}, {place.country}
                    </p>
                    {(place.year || place.month) && (
                      <p className="text-sm text-gray-500">
                        {place.month &&
                          `${new Date(2000, place.month - 1).toLocaleString('default', {
                            month: 'short',
                          })} `}
                        {place.year}
                      </p>
                    )}
                    {place.notes && (
                      <p className="text-sm text-gray-600 mt-1 truncate">{place.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(place.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No places visited yet</p>
              <button
                onClick={onAddPlace}
                className="mt-2 text-sm text-emerald-600 hover:underline"
              >
                Add your first destination
              </button>
            </div>
          )}
        </div>

        {/* Wishlist */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Wishlist</h3>
          {wishlistPlaces.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {wishlistPlaces.map((place) => (
                <div
                  key={place.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 group cursor-pointer"
                  onClick={() => onEdit?.(place)}
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {place.city}, {place.country}
                    </p>
                    {place.notes && (
                      <p className="text-sm text-gray-600 mt-1 truncate">{place.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(place.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No wishlist destinations yet</p>
              <button
                onClick={onAddWishlist}
                className="mt-2 text-sm text-amber-600 hover:underline"
              >
                Add a dream destination
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
