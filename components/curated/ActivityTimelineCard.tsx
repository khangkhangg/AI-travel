'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  Utensils,
  Camera,
  Landmark,
  ShoppingBag,
  Coffee,
  Music,
  Bed,
  TreePine,
  Waves,
  Bike,
  Train,
  Plane,
  Star,
  Pencil,
  Check,
  X,
  Link,
  Loader2,
} from 'lucide-react';
import { BidCard, BidForm, SuggestionCard, SuggestionForm, ActivityBidsBadge } from '@/components/marketplace';
import type { ViewMode, Proposal, TripSuggestion, Business, BidFormData, SuggestionFormData } from '@/lib/types/marketplace';

interface ActivityTimelineCardProps {
  activity: {
    id: string;
    title: string;
    description?: string;
    category?: string;
    time_slot?: string;
    estimated_cost?: number;
    location_name?: string;
    location_address?: string;
    source_url?: string;
    location_lat?: number;
    location_lng?: number;
  };
  dayColor: string;
  isFirst?: boolean;
  isLast?: boolean;
  onViewOnMap?: () => void;
  onUpdateDescription?: (activityId: string, description: string) => void;
  onUpdateUrl?: (activityId: string, url: string) => void;
  onUpdateLocation?: (activityId: string, lat: number, lng: number, address?: string) => void;
  isOwner?: boolean;
  // Marketplace props
  viewMode?: ViewMode;
  bids?: Proposal[];
  suggestions?: TripSuggestion[];
  bidCount?: number;
  suggestionCount?: number;
  business?: Business | null;
  tripId?: string;
  onSubmitBid?: (data: BidFormData) => Promise<void>;
  onSubmitSuggestion?: (data: SuggestionFormData) => Promise<void>;
  onAcceptBid?: (proposalId: string) => Promise<void>;
  onDeclineBid?: (proposalId: string) => Promise<void>;
  onWithdrawBid?: (proposalId: string) => Promise<void>;
  onApproveWithdrawal?: (proposalId: string) => Promise<void>;
  onRejectWithdrawal?: (proposalId: string) => Promise<void>;
  onMarkSuggestionUsed?: (suggestionId: string) => Promise<void>;
  onDismissSuggestion?: (suggestionId: string) => Promise<void>;
  // Auth props
  isLoggedIn?: boolean;
  onAuthRequired?: () => void;
  // Trip visibility for marketplace
  tripVisibility?: string;
}

interface FetchedPlace {
  name?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  priceLevel?: string;
  hours?: string;
  categories?: string[];
  coordinates?: { lat: number; lng: number };
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  food: <Utensils className="w-4 h-4" />,
  restaurant: <Utensils className="w-4 h-4" />,
  cafe: <Coffee className="w-4 h-4" />,
  coffee: <Coffee className="w-4 h-4" />,
  attraction: <Camera className="w-4 h-4" />,
  sightseeing: <Camera className="w-4 h-4" />,
  museum: <Landmark className="w-4 h-4" />,
  landmark: <Landmark className="w-4 h-4" />,
  shopping: <ShoppingBag className="w-4 h-4" />,
  entertainment: <Music className="w-4 h-4" />,
  nightlife: <Music className="w-4 h-4" />,
  accommodation: <Bed className="w-4 h-4" />,
  hotel: <Bed className="w-4 h-4" />,
  nature: <TreePine className="w-4 h-4" />,
  park: <TreePine className="w-4 h-4" />,
  beach: <Waves className="w-4 h-4" />,
  activity: <Bike className="w-4 h-4" />,
  transport: <Train className="w-4 h-4" />,
  flight: <Plane className="w-4 h-4" />,
};

const getCategoryIcon = (category?: string): React.ReactNode => {
  if (!category) return <Star className="w-4 h-4" />;
  const normalized = category.toLowerCase().replace(/[^a-z]/g, '');
  return CATEGORY_ICONS[normalized] || <Star className="w-4 h-4" />;
};

const formatCategory = (category?: string): string => {
  if (!category) return 'Activity';
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatCost = (cost?: number): string | null => {
  if (cost === undefined || cost === null) return null;
  if (cost === 0) return 'Free';
  return `$${cost.toLocaleString()}`;
};

export default function ActivityTimelineCard({
  activity,
  dayColor,
  isFirst = false,
  isLast = false,
  onViewOnMap,
  onUpdateDescription,
  onUpdateUrl,
  onUpdateLocation,
  isOwner = false,
  viewMode = 'normal',
  bids = [],
  suggestions = [],
  bidCount = 0,
  suggestionCount = 0,
  business,
  tripId,
  onSubmitBid,
  onSubmitSuggestion,
  onAcceptBid,
  onDeclineBid,
  onWithdrawBid,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onMarkSuggestionUsed,
  onDismissSuggestion,
  isLoggedIn = true,
  onAuthRequired,
  tripVisibility,
}: ActivityTimelineCardProps) {
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(activity.description || '');
  const [showFullDescription, setShowFullDescription] = useState(false);

  // URL editing state
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlValue, setUrlValue] = useState(activity.source_url || '');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [fetchedPlace, setFetchedPlace] = useState<FetchedPlace | null>(null);
  const lastFetchedUrl = useRef<string>('');

  const hasLocation = activity.location_lat && activity.location_lng;
  const cost = formatCost(activity.estimated_cost);
  const canEdit = isOwner;

  // Check if this is a hotel/accommodation
  const isHotel = activity.category?.toLowerCase() === 'hotel' ||
    activity.category?.toLowerCase() === 'accommodation' ||
    activity.category?.toLowerCase() === 'lodging';

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

  const handleSaveDescription = () => {
    if (onUpdateDescription) {
      onUpdateDescription(activity.id, descriptionValue.trim());
    }
    setEditingDescription(false);
  };

  const handleCancelDescriptionEdit = () => {
    setDescriptionValue(activity.description || '');
    setEditingDescription(false);
  };

  const handleSaveUrl = () => {
    if (onUpdateUrl) {
      onUpdateUrl(activity.id, urlValue.trim());
    }
    // Save coordinates if available
    if (fetchedPlace?.coordinates && onUpdateLocation) {
      onUpdateLocation(
        activity.id,
        fetchedPlace.coordinates.lat,
        fetchedPlace.coordinates.lng,
        fetchedPlace.address
      );
    }
    setEditingUrl(false);
    setFetchedPlace(null);
  };

  const handleCancelUrlEdit = () => {
    setUrlValue(activity.source_url || '');
    setEditingUrl(false);
    setFetchedPlace(null);
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        {/* Line above dot */}
        <div
          className={`w-0.5 flex-1 ${isFirst ? 'bg-transparent' : 'bg-gray-200'}`}
          style={{ minHeight: '16px' }}
        />
        {/* Dot */}
        <div
          className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
          style={{ backgroundColor: dayColor }}
        />
        {/* Line below dot */}
        <div
          className={`w-0.5 flex-1 ${isLast ? 'bg-transparent' : 'bg-gray-200'}`}
        />
      </div>

      {/* Card */}
      <div className="flex-1 pb-6">
        <div className={`bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow ${
          isHotel ? 'border-amber-300 bg-amber-50/30' : 'border-gray-100'
        }`} id={`activity-${activity.id}`}>
          {/* Header: Icon + Title */}
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
              style={{ backgroundColor: dayColor }}
            >
              {getCategoryIcon(activity.category)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-base leading-tight">
                {activity.title}
              </h4>

              {/* Meta: Time, Category, Cost */}
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-gray-500">
                {activity.time_slot && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activity.time_slot}
                  </span>
                )}
                {activity.category && (
                  <>
                    {activity.time_slot && <span>·</span>}
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                      {formatCategory(activity.category)}
                    </span>
                  </>
                )}
                {cost && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-600 font-medium">
                      {cost}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-3">
            {editingDescription ? (
              <div>
                <textarea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  placeholder="Add a description..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={handleCancelDescriptionEdit}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
            ) : activity.description ? (
              <div className="group relative">
                <p className={`text-gray-600 text-sm leading-relaxed break-words ${
                  !showFullDescription && activity.description.length > 150 ? 'line-clamp-3' : ''
                }`}>
                  {activity.description}
                </p>
                {activity.description.length > 150 && !showFullDescription && (
                  <button
                    onClick={() => setShowFullDescription(true)}
                    className="text-emerald-600 hover:underline text-sm mt-1"
                  >
                    Show more
                  </button>
                )}
                {showFullDescription && activity.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(false)}
                    className="text-emerald-600 hover:underline text-sm mt-1"
                  >
                    Show less
                  </button>
                )}
                {canEdit && onUpdateDescription && (
                  <button
                    onClick={() => setEditingDescription(true)}
                    className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit description"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : canEdit && onUpdateDescription ? (
              <button
                onClick={() => setEditingDescription(true)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
              >
                <Pencil className="w-3.5 h-3.5" />
                Add description
              </button>
            ) : null}
          </div>

          {/* URL Editing Section */}
          {editingUrl && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="Paste Google Maps URL..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
                {fetchingUrl && (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Show fetched place info */}
              {fetchedPlace && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg space-y-2">
                  {fetchedPlace.name && (
                    <div className="text-sm">
                      <span className="text-gray-600">Found: </span>
                      <span className="font-medium text-gray-900">{fetchedPlace.name}</span>
                    </div>
                  )}
                  {fetchedPlace.address && (
                    <p className="text-xs text-gray-500">📍 {fetchedPlace.address}</p>
                  )}
                  {fetchedPlace.coordinates && (
                    <p className="text-xs text-emerald-600 font-medium">
                      🗺️ Location detected ({fetchedPlace.coordinates.lat.toFixed(4)}, {fetchedPlace.coordinates.lng.toFixed(4)})
                    </p>
                  )}
                  {fetchedPlace.rating && (
                    <p className="text-xs text-gray-500">
                      ⭐ {fetchedPlace.rating} {fetchedPlace.reviewCount ? `(${fetchedPlace.reviewCount.toLocaleString()} reviews)` : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Show coordinates detected without full place info */}
              {!fetchedPlace?.name && fetchedPlace?.coordinates && (
                <div className="mt-2 p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-600 font-medium">
                    🗺️ Location detected ({fetchedPlace.coordinates.lat.toFixed(4)}, {fetchedPlace.coordinates.lng.toFixed(4)})
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={handleCancelUrlEdit}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveUrl}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Location & Actions */}
          <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-3 text-sm">
            {(activity.location_name || activity.location_address) && (
              <span className="flex items-center gap-1.5 text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="line-clamp-1">
                  {activity.location_name || activity.location_address}
                </span>
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {/* Marketplace badges (for owner in normal view) */}
              {isOwner && viewMode === 'normal' && (
                <>
                  {bidCount > 0 && <ActivityBidsBadge count={bidCount} type="bids" />}
                  {suggestionCount > 0 && <ActivityBidsBadge count={suggestionCount} type="suggestions" />}
                </>
              )}

              {/* Add/Edit URL button */}
              {canEdit && onUpdateUrl && !editingUrl && (
                <button
                  onClick={() => setEditingUrl(true)}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title={activity.source_url ? 'Edit URL' : 'Add Google Maps URL'}
                >
                  <Link className="w-3.5 h-3.5" />
                  {activity.source_url ? 'Edit' : 'Add URL'}
                </button>
              )}

              {hasLocation && onViewOnMap && (
                <button
                  onClick={onViewOnMap}
                  className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  View on Map
                </button>
              )}

              {activity.source_url && !editingUrl && (
                <a
                  href={activity.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Source
                </a>
              )}
            </div>
          </div>

          {/* Marketplace Section - Bids */}
          {viewMode === 'business' && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {/* Existing bids */}
              {bids.length > 0 && (
                <div className="space-y-2">
                  {bids.map((bid) => (
                    <BidCard
                      key={bid.id}
                      proposal={bid}
                      isOwner={isOwner}
                      isOwnBid={!isOwner}  // In business view, non-owners see only their own bids
                      onAccept={onAcceptBid}
                      onDecline={onDeclineBid}
                      onWithdraw={onWithdrawBid}
                      onApproveWithdrawal={onApproveWithdrawal}
                      onRejectWithdrawal={onRejectWithdrawal}
                    />
                  ))}
                </div>
              )}

              {/* Bid form (for business users, not owners) */}
              {!isOwner && business && onSubmitBid && (
                <BidForm
                  tripId={tripId || ''}
                  activityId={activity.id}
                  business={business}
                  onSubmit={onSubmitBid}
                  isLoggedIn={isLoggedIn}
                  onAuthRequired={onAuthRequired}
                  tripVisibility={tripVisibility}
                />
              )}
            </div>
          )}

          {/* Marketplace Section - Suggestions */}
          {viewMode === 'creator' && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {/* Existing suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isOwner={isOwner}
                      onMarkUsed={onMarkSuggestionUsed}
                      onDismiss={onDismissSuggestion}
                    />
                  ))}
                </div>
              )}

              {/* Suggestion form (for non-owners) */}
              {!isOwner && onSubmitSuggestion && (
                <SuggestionForm
                  tripId={tripId || ''}
                  activityId={activity.id}
                  onSubmit={onSubmitSuggestion}
                  isLoggedIn={isLoggedIn}
                  onAuthRequired={onAuthRequired}
                />
              )}
            </div>
          )}

          {/* Owner view - show both bids and suggestions */}
          {isOwner && viewMode === 'normal' && (bids.length > 0 || suggestions.length > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              {/* Bids section */}
              {bids.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-green-700 mb-2">Business Bids</h5>
                  <div className="space-y-2">
                    {bids.map((bid) => (
                      <BidCard
                        key={bid.id}
                        proposal={bid}
                        isOwner={isOwner}
                        onAccept={onAcceptBid}
                        onDecline={onDeclineBid}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions section */}
              {suggestions.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-purple-700 mb-2">Creator Suggestions</h5>
                  <div className="space-y-2">
                    {suggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        isOwner={isOwner}
                        onMarkUsed={onMarkSuggestionUsed}
                        onDismiss={onDismissSuggestion}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
