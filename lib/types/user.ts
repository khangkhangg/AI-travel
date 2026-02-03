// User Platform Types

export type ProfileVisibility = 'public' | 'private';

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  phone?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  verificationDeadline?: string;
  profileVisibility?: ProfileVisibility;
  createdAt: string;
  updatedAt: string;
}

export type SocialPlatform =
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'website';

export interface UserSocialLink {
  id: string;
  userId: string;
  platform: SocialPlatform;
  value: string;
  createdAt: string;
}

export type PaymentPlatform =
  | 'paypal'
  | 'venmo'
  | 'cashapp'
  | 'wise'
  | 'kofi'
  | 'buymeacoffee';

export interface UserPaymentLink {
  id: string;
  userId: string;
  platform: PaymentPlatform;
  value: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface UserTravelHistory {
  id: string;
  userId: string;
  city: string;
  country: string;
  year?: number;
  month?: number;
  notes?: string;
  lat?: number;
  lng?: number;
  isWishlist?: boolean;
  createdAt: string;
}

export type BadgeType =
  | 'first_itinerary'
  | 'explorer'
  | 'globetrotter'
  | 'helpful'
  | 'tipped_creator'
  | 'verified_guide'
  | 'local_expert';

export interface UserBadge {
  id: string;
  userId: string;
  badgeType: BadgeType;
  metadata?: {
    city?: string;
    [key: string]: any;
  };
  earnedAt: string;
}

export const BADGE_DEFINITIONS: Record<BadgeType, { label: string; description: string; icon: string }> = {
  first_itinerary: {
    label: 'First Itinerary',
    description: 'Created your first itinerary',
    icon: '🎯',
  },
  explorer: {
    label: 'Explorer',
    description: 'Shared 5 itineraries',
    icon: '🧭',
  },
  globetrotter: {
    label: 'Globetrotter',
    description: 'Visited 10+ countries',
    icon: '🌍',
  },
  helpful: {
    label: 'Helpful',
    description: 'Made 10 comments or suggestions',
    icon: '💬',
  },
  tipped_creator: {
    label: 'Tipped Creator',
    description: 'Received your first tip',
    icon: '💝',
  },
  verified_guide: {
    label: 'Verified Guide',
    description: 'Registered as a tour guide',
    icon: '✓',
  },
  local_expert: {
    label: 'Local Expert',
    description: '3+ itineraries for the same city',
    icon: '📍',
  },
};

// Alias for backward compatibility
export const BADGE_INFO = BADGE_DEFINITIONS;

export const SOCIAL_PLATFORMS: Record<SocialPlatform, { label: string; icon: string; placeholder: string }> = {
  instagram: { label: 'Instagram', icon: '📷', placeholder: '@username' },
  twitter: { label: 'X (Twitter)', icon: '𝕏', placeholder: '@username' },
  facebook: { label: 'Facebook', icon: '👤', placeholder: 'facebook.com/username' },
  tiktok: { label: 'TikTok', icon: '🎵', placeholder: '@username' },
  youtube: { label: 'YouTube', icon: '▶️', placeholder: 'youtube.com/@channel' },
  linkedin: { label: 'LinkedIn', icon: '💼', placeholder: 'linkedin.com/in/username' },
  website: { label: 'Website', icon: '🌐', placeholder: 'https://yoursite.com' },
};

export const PAYMENT_PLATFORMS: Record<PaymentPlatform, { label: string; icon: string; placeholder: string }> = {
  paypal: { label: 'PayPal', icon: '💳', placeholder: 'email@example.com' },
  venmo: { label: 'Venmo', icon: '💸', placeholder: '@username' },
  cashapp: { label: 'Cash App', icon: '💵', placeholder: '$cashtag' },
  wise: { label: 'Wise', icon: '🌐', placeholder: 'email@example.com' },
  kofi: { label: 'Ko-fi', icon: '☕', placeholder: 'ko-fi.com/username' },
  buymeacoffee: { label: 'Buy Me a Coffee', icon: '🧋', placeholder: 'buymeacoffee.com/username' },
};

// Extended user profile with all related data (as returned by API)
export interface UserProfile {
  user: User;
  socialLinks: UserSocialLink[];
  paymentLinks: UserPaymentLink[];
  travelHistory: UserTravelHistory[];
  badges: UserBadge[];
  stats: {
    itinerariesCount: number;
    publicItinerariesCount: number;
    totalClones: number;
    totalViews: number;
    countriesVisited: number;
  };
}

// Partial user info for list views
export interface UserSummary {
  id?: string;
  fullName?: string;
  avatarUrl?: string;
  email?: string;
}

// Itinerary types
export type ItineraryVisibility = 'public' | 'private' | 'marketplace' | 'curated';

// Curator expertise options
export type CuratorIsLocal = 'yes_live_here' | 'visited_multiple' | 'first_detailed_trip';
export type CuratorYearsLived = 'less_than_1' | '1_2_years' | '3_5_years' | '5_plus_years' | 'na_visitor';
export type CuratorExperience = 'first_time' | 'visited_2_5' | 'visited_10_plus' | 'local_expert';

export interface CuratorInfo {
  isLocal: CuratorIsLocal;
  yearsLived: CuratorYearsLived;
  experience: CuratorExperience;
}

export interface Itinerary {
  id: string;
  userId: string;
  title: string;
  description?: string;
  destinationCity?: string;
  destinationCountry?: string;
  startDate?: string;
  endDate?: string;
  visibility: ItineraryVisibility;
  openToOffers: boolean;
  groupSize: number;
  interests: string[];
  cloneCount: number;
  viewCount: number;
  clonedFromId?: string;
  createdAt: string;
  updatedAt: string;
  // Curator fields (for 'curated' visibility)
  curatorInfo?: CuratorInfo;
  // Populated fields (partial user info for list views)
  user?: UserSummary;
  collaborators?: ItineraryCollaborator[];
  days?: any[]; // Your existing itinerary day structure
}

export type CollaboratorRole = 'viewer' | 'collaborator';

export interface ItineraryCollaborator {
  id: string;
  itineraryId: string;
  userId: string;
  role: CollaboratorRole;
  invitedAt: string;
  user?: User;
}

export type SuggestionType = 'replace' | 'alternative' | 'add' | 'remove';
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

export interface ItinerarySuggestion {
  id: string;
  itineraryId: string;
  userId: string;
  dayNumber?: number;
  activityIndex?: number;
  suggestionType: SuggestionType;
  content: any; // Activity content
  status: SuggestionStatus;
  createdAt: string;
  user?: User;
  voteCount?: { up: number; down: number };
}

export type VoteType = 'up' | 'down';
export type VoteTargetType = 'activity' | 'hotel' | 'suggestion';

export interface ItineraryVote {
  id: string;
  itineraryId: string;
  userId: string;
  targetType: VoteTargetType;
  targetId: string;
  vote: VoteType;
  createdAt: string;
}

export interface ItineraryComment {
  id: string;
  itineraryId: string;
  userId: string;
  parentId?: string;
  dayNumber?: number;
  activityIndex?: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  replies?: ItineraryComment[];
}

// Hotel types
export interface Hotel {
  id: string;
  userId: string;
  name: string;
  description?: string;
  city: string;
  country: string;
  address?: string;
  starRating?: number;
  photos: string[];
  amenities: string[];
  website?: string;
  googleMapsUrl?: string;
  agodaUrl?: string;
  bookingComUrl?: string;
  airbnbUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// Business offer types
export type BusinessType = 'guide' | 'hotel';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface BusinessOffer {
  id: string;
  businessType: BusinessType;
  businessId: string;
  itineraryId: string;
  travelerId: string;
  offerDetails: any; // Flexible JSON for tour or hotel details
  status: OfferStatus;
  message?: string;
  responseMessage?: string;
  createdAt: string;
  respondedAt?: string;
  // Populated
  business?: any; // Tour guide or Hotel
  itinerary?: Itinerary;
}

// Creator types for /creators page
export type CreatorCategory = 'guide' | 'local_expert' | 'regular';

export interface CreatorStats {
  itineraryCount: number;
  totalViews: number;
  totalClones: number;
}

export interface CreatorItineraryPreview {
  id: string;
  title: string;
  coverImage?: string;
  destinationCity?: string;
}

export interface Creator {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  isGuide: boolean;
  isLocalExpert: boolean;
  badges: BadgeType[];
  stats: CreatorStats;
  recentItineraries: CreatorItineraryPreview[];
  destinations: string[];
  interests: string[];
}

export interface FeaturedCreator extends Creator {
  featuredId: string;
  category: string;
  displayOrder: number;
  featuredUntil?: string;
  isAlgorithmic: boolean;
}

export interface InterestCategory {
  id: string;
  emoji: string;
  label: string;
  displayOrder: number;
}

export const INTEREST_CATEGORIES: Record<string, InterestCategory> = {
  food: { id: 'food', emoji: '🍜', label: 'Food Experts', displayOrder: 1 },
  culture: { id: 'culture', emoji: '🏛️', label: 'Culture Enthusiasts', displayOrder: 2 },
  nature: { id: 'nature', emoji: '🌿', label: 'Nature Lovers', displayOrder: 3 },
  adventure: { id: 'adventure', emoji: '⛰️', label: 'Adventure Seekers', displayOrder: 4 },
  nightlife: { id: 'nightlife', emoji: '🌙', label: 'Nightlife Guides', displayOrder: 5 },
  shopping: { id: 'shopping', emoji: '🛍️', label: 'Shopping Experts', displayOrder: 6 },
  relaxation: { id: 'relaxation', emoji: '🧘', label: 'Relaxation Gurus', displayOrder: 7 },
  history: { id: 'history', emoji: '📜', label: 'History Buffs', displayOrder: 8 },
};

// Auth types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsVerification: boolean;
  verificationDeadline?: Date;
}

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
}
