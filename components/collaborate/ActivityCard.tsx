'use client';

import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, MapPin, Clock, MessageCircle,
  ThumbsUp, ThumbsDown, Check, Lock, Hotel, Utensils,
  Camera, ShoppingBag, Plane, Music, Coffee, Trash2, Edit2,
  Map, X, Link as LinkIcon, Plus, Loader2
} from 'lucide-react';
import { CollaborateActivity, Traveler } from '@/lib/types/collaborate';

interface ActivityCardProps {
  activity: CollaborateActivity;
  travelers: Traveler[];
  onVote: (activityId: string, vote: 'up' | 'down') => void;
  onFinalize: (activityId: string) => void;
  onAssignPayer: (activityId: string, payerId: string | null, isSplit: boolean) => void;
  onSelect: (id: string | null) => void;
  onDelete?: (activityId: string) => void;
  onUpdatePrice?: (activityId: string, price: number) => void;
  onUpdateUrl?: (activityId: string, url: string) => void;
  onUpdateSummary?: (activityId: string, summary: string) => void;
  onUpdateDescription?: (activityId: string, description: string) => void;
  onUpdateLocation?: (activityId: string, lat: number, lng: number, address?: string) => void;
  isSelected: boolean;
  isHotel?: boolean;
  isDragging?: boolean;
}

const categoryIcons: Record<string, any> = {
  accommodation: Hotel,
  hotel: Hotel,
  food: Utensils,
  restaurant: Utensils,
  dining: Utensils,
  attraction: Camera,
  sightseeing: Camera,
  shopping: ShoppingBag,
  transport: Plane,
  entertainment: Music,
  cafe: Coffee,
};

export default function ActivityCard({
  activity,
  travelers,
  onVote,
  onFinalize,
  onAssignPayer,
  onSelect,
  onDelete,
  onUpdatePrice,
  onUpdateUrl,
  onUpdateSummary,
  onUpdateDescription,
  onUpdateLocation,
  isSelected,
  isHotel = false,
  isDragging = false,
}: ActivityCardProps) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(activity.estimated_cost?.toString() || '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlValue, setUrlValue] = useState(activity.source_url || '');
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryValue, setSummaryValue] = useState(activity.summary || '');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(activity.description || '');
  const [showFullDescription, setShowFullDescription] = useState(false);

  // URL fetching state
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [fetchedPlace, setFetchedPlace] = useState<{
    name?: string;
    description?: string;
    rating?: number;
    reviewCount?: number;
    address?: string;
    priceLevel?: string;
    hours?: string;
    categories?: string[];
    coordinates?: { lat: number; lng: number };
  } | null>(null);
  const lastFetchedUrl = useRef<string>('');

  // Build a rich description from fetched place data
  const buildDescriptionFromPlace = (place: typeof fetchedPlace, sourceUrl?: string): string => {
    const parts: string[] = [];

    if (!place) {
      // No place data - don't add raw URL to description (it's stored separately)
      return '';
    }

    // Add rating and reviews
    if (place.rating) {
      let ratingText = `⭐ ${place.rating}`;
      if (place.reviewCount) {
        ratingText += ` (${place.reviewCount.toLocaleString()} reviews)`;
      }
      parts.push(ratingText);
    }

    // Add price level
    if (place.priceLevel) {
      parts.push(`Price: ${place.priceLevel}`);
    }

    // Add hours
    if (place.hours) {
      parts.push(`🕐 ${place.hours}`);
    }

    // Add address
    if (place.address) {
      parts.push(`📍 ${place.address}`);
    }

    // Add categories
    if (place.categories && place.categories.length > 0) {
      parts.push(`Tags: ${place.categories.join(', ')}`);
    }

    // Add description
    if (place.description) {
      parts.push(place.description);
    }

    return parts.join('\n');
  };

  // Get preview of what will be added to description
  const getDescriptionPreview = (): string | null => {
    if (!fetchedPlace) return null;
    const preview = buildDescriptionFromPlace(fetchedPlace, urlValue.trim());
    return preview || null;
  };

  // Auto-fetch when URL is pasted
  useEffect(() => {
    if (!editingUrl) {
      setFetchedPlace(null);
      return;
    }

    const trimmedUrl = urlValue.trim();

    // Skip if empty, same as last fetch, or doesn't look like a URL
    if (!trimmedUrl ||
        trimmedUrl === lastFetchedUrl.current ||
        !trimmedUrl.match(/^https?:\/\//i)) {
      return;
    }

    // Check if it looks like a complete URL
    if (!trimmedUrl.match(/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i)) {
      return;
    }

    // Debounce - wait 500ms after typing stops
    const timeoutId = setTimeout(async () => {
      lastFetchedUrl.current = trimmedUrl;
      setFetchingUrl(true);
      setFetchedPlace(null);

      try {
        const response = await fetch('/api/places/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedUrl }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.place?.name || data.place?.coordinates) {
            setFetchedPlace({
              name: data.place.name,
              description: data.place.description,
              rating: data.place.rating,
              reviewCount: data.place.reviewCount,
              address: data.place.address,
              priceLevel: data.place.priceLevel,
              hours: data.place.hours,
              categories: data.place.categories,
              coordinates: data.place.coordinates,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch URL metadata:', error);
      } finally {
        setFetchingUrl(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [urlValue, editingUrl]);

  // Display text: use summary if set, otherwise truncate title
  const displayTitle = activity.summary || activity.title;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: activity.id, disabled: isHotel });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const IconComponent = categoryIcons[activity.category?.toLowerCase() || ''] || Camera;

  // Count votes
  const upVotes = activity.votes?.filter(v => v.vote === 'up').length || 0;
  const downVotes = activity.votes?.filter(v => v.vote === 'down').length || 0;

  const handleSavePrice = () => {
    const newPrice = parseFloat(priceValue) || 0;
    if (onUpdatePrice) {
      onUpdatePrice(activity.id, newPrice);
    }
    setEditingPrice(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(activity.id);
    }
    setConfirmingDelete(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDelete(false);
  };

  const handleSaveUrl = () => {
    if (onUpdateUrl) {
      onUpdateUrl(activity.id, urlValue.trim());
    }
    // Save coordinates if available from fetched place
    if (fetchedPlace?.coordinates && onUpdateLocation) {
      onUpdateLocation(
        activity.id,
        fetchedPlace.coordinates.lat,
        fetchedPlace.coordinates.lng,
        fetchedPlace.address
      );
    }
    // Auto-populate description if empty
    if (!activity.description && onUpdateDescription) {
      const richDescription = buildDescriptionFromPlace(fetchedPlace, urlValue.trim());
      if (richDescription) {
        onUpdateDescription(activity.id, richDescription);
      }
    }
    setEditingUrl(false);
    setFetchedPlace(null);
  };

  const handleSaveUrlAndTitle = () => {
    if (onUpdateUrl) {
      onUpdateUrl(activity.id, urlValue.trim());
    }
    if (fetchedPlace?.name && onUpdateSummary) {
      onUpdateSummary(activity.id, fetchedPlace.name);
    }
    // Save coordinates if available from fetched place
    if (fetchedPlace?.coordinates && onUpdateLocation) {
      onUpdateLocation(
        activity.id,
        fetchedPlace.coordinates.lat,
        fetchedPlace.coordinates.lng,
        fetchedPlace.address
      );
    }
    // Auto-populate description if empty
    if (!activity.description && onUpdateDescription) {
      const richDescription = buildDescriptionFromPlace(fetchedPlace, urlValue.trim());
      if (richDescription) {
        onUpdateDescription(activity.id, richDescription);
      }
    }
    setEditingUrl(false);
    setFetchedPlace(null);
  };

  const handleSaveSummary = () => {
    if (onUpdateSummary) {
      onUpdateSummary(activity.id, summaryValue.trim());
    }
    setEditingSummary(false);
  };

  const handleSaveDescription = () => {
    if (onUpdateDescription) {
      onUpdateDescription(activity.id, descriptionValue.trim());
    }
    setEditingDescription(false);
  };

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activity.is_final && onUpdateSummary) {
      // Show existing summary, or the original title if no summary exists
      setSummaryValue(activity.summary || activity.title || '');
      setEditingSummary(true);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer
        ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-transparent hover:border-gray-200'}
        ${activity.is_final ? 'bg-emerald-50' : ''}
        ${isDragging ? 'shadow-lg scale-105' : ''}
        ${isHotel ? 'border-blue-200 bg-blue-50' : ''}
      `}
      onClick={() => onSelect(isSelected ? null : activity.id)}
    >
      {/* Delete Confirmation Overlay */}
      {confirmingDelete && (
        <div className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center z-10">
          <div className="text-center p-4">
            <p className="text-sm text-gray-700 mb-3">Remove this activity?</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleCancelDelete}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-sm bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-3">
        {/* Header Row - Title only */}
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          {!isHotel && !activity.is_final && (
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}

          {/* Icon */}
          <div className={`p-2 rounded-lg flex-shrink-0 ${isHotel ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <IconComponent className={`w-4 h-4 ${isHotel ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>

          {/* Title & Location */}
          <div className="flex-1 min-w-0">
            {/* Summary or truncated title - double-click to edit */}
            {editingSummary ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={summaryValue}
                  onChange={(e) => setSummaryValue(e.target.value)}
                  placeholder="Edit title..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveSummary();
                    if (e.key === 'Escape') {
                      setSummaryValue(activity.summary || activity.title || '');
                      setEditingSummary(false);
                    }
                  }}
                />
                <button
                  onClick={handleSaveSummary}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSummaryValue(activity.summary || activity.title || '');
                    setEditingSummary(false);
                  }}
                  className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-1">
                <h4
                  className={`font-medium text-gray-900 text-sm leading-tight line-clamp-2 flex-1 ${
                    !activity.is_final && onUpdateSummary ? 'cursor-text hover:bg-gray-50 rounded px-1 -mx-1' : ''
                  }`}
                  title={`${activity.title}${!activity.is_final ? ' (double-click to edit)' : ''}`}
                  onDoubleClick={handleTitleDoubleClick}
                >
                  {displayTitle.length > 60 ? displayTitle.slice(0, 60) + '...' : displayTitle}
                </h4>
                {activity.is_final && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex-shrink-0">
                    <Lock className="w-3 h-3" />
                    Final
                  </span>
                )}
              </div>
            )}
            {activity.location_name && !editingSummary && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{activity.location_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description Section - collapsible */}
        {(activity.description || (!activity.is_final && onUpdateDescription)) && !editingSummary && (
          <div className="mt-2">
            {editingDescription ? (
              <div onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  placeholder="Add description..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 resize-none"
                  rows={3}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setDescriptionValue(activity.description || '');
                      setEditingDescription(false);
                    }
                  }}
                />
                <div className="flex justify-end gap-1 mt-1">
                  <button
                    onClick={() => {
                      setDescriptionValue(activity.description || '');
                      setEditingDescription(false);
                    }}
                    className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    className="px-2 py-1 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : activity.description ? (
              <div
                className={`text-xs text-gray-600 break-all ${!activity.is_final ? 'cursor-text hover:bg-gray-50 rounded p-1 -m-1' : ''}`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (!activity.is_final && onUpdateDescription) {
                    setDescriptionValue(activity.description || '');
                    setEditingDescription(true);
                  }
                }}
                title={!activity.is_final ? 'Double-click to edit' : ''}
              >
                {showFullDescription || activity.description.length <= 100 ? (
                  <p>{activity.description}</p>
                ) : (
                  <>
                    <p>{activity.description.slice(0, 100)}...</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowFullDescription(true); }}
                      className="text-emerald-600 hover:underline"
                    >
                      Show more
                    </button>
                  </>
                )}
              </div>
            ) : !activity.is_final && onUpdateDescription && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingDescription(true);
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                + Add description
              </button>
            )}
          </div>
        )}

        {/* URL Editing Row (when active) */}
        {editingUrl && !editingSummary && (
          <div className="mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <input
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="Paste Google Maps or Airbnb URL"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveUrl();
                  if (e.key === 'Escape') {
                    setUrlValue(activity.source_url || '');
                    setEditingUrl(false);
                    setFetchedPlace(null);
                  }
                }}
              />
              {fetchingUrl && (
                <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
              )}
              <button onClick={handleSaveUrl} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => { setUrlValue(activity.source_url || ''); setEditingUrl(false); setFetchedPlace(null); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Show fetched place info with option to use as title */}
            {fetchedPlace?.name && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 flex-1 truncate">
                    Found: <span className="font-medium text-gray-900">{fetchedPlace.name}</span>
                  </span>
                  <button
                    onClick={handleSaveUrlAndTitle}
                    className="px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors whitespace-nowrap"
                  >
                    Use as title
                  </button>
                </div>

                {/* Show fetched details */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                  {fetchedPlace.rating && (
                    <span>⭐ {fetchedPlace.rating}{fetchedPlace.reviewCount ? ` (${fetchedPlace.reviewCount.toLocaleString()})` : ''}</span>
                  )}
                  {fetchedPlace.priceLevel && (
                    <span>{fetchedPlace.priceLevel}</span>
                  )}
                  {fetchedPlace.hours && (
                    <span>🕐 {fetchedPlace.hours}</span>
                  )}
                </div>

                {fetchedPlace.address && (
                  <p className="text-xs text-gray-500 truncate">📍 {fetchedPlace.address}</p>
                )}

                {fetchedPlace.coordinates && (
                  <p className="text-xs text-emerald-600 font-medium">
                    🗺️ Location detected ({fetchedPlace.coordinates.lat.toFixed(4)}, {fetchedPlace.coordinates.lng.toFixed(4)})
                  </p>
                )}

                {fetchedPlace.categories && fetchedPlace.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {fetchedPlace.categories.slice(0, 3).map((cat, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Show description preview - what will be added */}
                {!activity.description && getDescriptionPreview() && (
                  <div className="pt-1.5 mt-1 border-t border-blue-100">
                    <p className="text-[10px] text-blue-600 font-medium mb-1">+ Will add to description:</p>
                    <p className="text-[10px] text-gray-500 line-clamp-2 whitespace-pre-line">
                      {getDescriptionPreview()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Show coordinates detected even without fetched place name */}
            {!fetchedPlace?.name && fetchedPlace?.coordinates && (
              <div className="mt-2 p-2 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-600 font-medium">
                  🗺️ Location detected ({fetchedPlace.coordinates.lat.toFixed(4)}, {fetchedPlace.coordinates.lng.toFixed(4)})
                </p>
              </div>
            )}
          </div>
        )}

        {/* Time Row (if has time) */}
        {activity.time_start && !editingSummary && !editingUrl && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{activity.time_start}{activity.time_end ? ` - ${activity.time_end}` : ''}</span>
          </div>
        )}

        {/* Price Row with Delete icon */}
        {!editingSummary && !editingUrl && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
            {/* Editable Price */}
            <div className="flex items-center gap-1 flex-1">
              {editingPrice ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                    placeholder="0"
                    className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePrice();
                      if (e.key === 'Escape') setEditingPrice(false);
                    }}
                  />
                  <button
                    onClick={handleSavePrice}
                    className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!activity.is_final) {
                      // If price is 0 or undefined, start with empty input for better UX
                      const cost = activity.estimated_cost;
                      setPriceValue(cost && cost > 0 ? cost.toString() : '');
                      setEditingPrice(true);
                    }
                  }}
                  disabled={activity.is_final}
                  className={`flex items-center gap-1 ${
                    activity.is_final ? '' : 'hover:text-emerald-600'
                  }`}
                  title={activity.is_final ? '' : 'Click to edit price'}
                >
                  <span>${activity.estimated_cost || 0}</span>
                  {!activity.is_final && <Edit2 className="w-3 h-3 opacity-50" />}
                </button>
              )}
            </div>

            {/* Delete Button */}
            {!activity.is_final && onDelete && (
              <button
                onClick={handleDeleteClick}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Remove activity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Votes Row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!activity.is_final) onVote(activity.id, 'up');
              }}
              disabled={activity.is_final}
              className={`p-1.5 rounded-lg transition-colors ${
                activity.is_final
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700">{upVotes}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!activity.is_final) onVote(activity.id, 'down');
              }}
              disabled={activity.is_final}
              className={`p-1.5 rounded-lg transition-colors ${
                activity.is_final
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700">{downVotes}</span>
          </div>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-1">
            {/* Link Button */}
            {activity.source_url ? (
              <a
                href={activity.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View on Google Maps"
              >
                <Map className="w-4 h-4" />
              </a>
            ) : !activity.is_final && onUpdateUrl && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingUrl(true); }}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Add link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            )}

            {/* Edit Link Button (only show if URL exists) */}
            {activity.source_url && !activity.is_final && onUpdateUrl && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingUrl(true); }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit link"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}

            {/* Finalize Button */}
            {!activity.is_final && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFinalize(activity.id);
                }}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Mark as final"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Comments Count */}
          {activity.comment_count !== undefined && activity.comment_count > 0 && (
            <div className="flex items-center gap-1 text-gray-400">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{activity.comment_count}</span>
            </div>
          )}
        </div>

        {/* Payer Row */}
        {(activity.estimated_cost !== undefined && activity.estimated_cost > 0) && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Paid by:</span>
            <select
              value={activity.is_split ? 'split' : (activity.payer_id || '')}
              onChange={(e) => {
                e.stopPropagation();
                const value = e.target.value;
                if (value === 'split') {
                  onAssignPayer(activity.id, null, true);
                } else {
                  onAssignPayer(activity.id, value, false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={activity.is_final}
              className={`text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white ${
                activity.is_final ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <option value="split">Split Equally</option>
              {travelers.map((traveler) => (
                <option key={traveler.id} value={traveler.id}>
                  {traveler.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
