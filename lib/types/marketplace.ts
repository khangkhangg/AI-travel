// Types for Business Bidding Marketplace

export type ViewMode = 'normal' | 'business' | 'creator';

export type BusinessType = 'guide' | 'hotel' | 'transport' | 'experience' | 'health';

export type ProposalStatus = 'pending' | 'accepted' | 'declined' | 'negotiating' | 'expired' | 'withdrawn' | 'withdrawal_requested';

export type SuggestionStatus = 'pending' | 'used' | 'dismissed';

export interface Business {
  id: string;
  user_id: string;
  business_type: BusinessType;
  business_name: string;
  description?: string;
  logo_url?: string;
  coverage_areas?: string[];
  verified: boolean;
  rating: number;
  review_count: number;
  is_active: boolean;
}

export interface Proposal {
  id: string;
  trip_id: string;
  activity_id?: string;
  business_id: string;
  business_name: string;
  business_type: BusinessType;
  logo_url?: string;
  rating?: number;
  review_count?: number;
  services_offered: ServiceOffered[];
  pricing_breakdown: PricingItem[];
  total_price: number;
  currency: string;
  message?: string;
  terms?: ProposalTerms;
  status: ProposalStatus;
  expires_at?: string;
  created_at: string;
}

export interface ServiceOffered {
  service_id?: string;
  service_name: string;
  description?: string;
  quantity?: number;
}

export interface PricingItem {
  item: string;
  quantity?: number;
  unit_price: number;
  total: number;
}

export interface ProposalTerms {
  cancellation_policy?: string;
  payment_terms?: string;
  includes?: string[];
  excludes?: string[];
}

export interface TripSuggestion {
  id: string;
  trip_id: string;
  activity_id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_badges: UserBadge[];
  day_number?: number;
  place_name: string;
  reason: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  source_url?: string;
  category?: string;
  status: SuggestionStatus;
  created_at: string;
}

export interface UserBadge {
  badge_type: string;
  metadata?: Record<string, any>;
}

export interface ServiceCategory {
  id: string;
  icon: string;
  label: string;
  businessType: BusinessType;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'bike_rental', icon: '🚲', label: 'Bike Rental', businessType: 'transport' },
  { id: 'car_rental', icon: '🚗', label: 'Car Rental', businessType: 'transport' },
  { id: 'photography', icon: '📸', label: 'Photography', businessType: 'experience' },
  { id: 'local_guide', icon: '🧭', label: 'Local Guide', businessType: 'guide' },
  { id: 'spa_wellness', icon: '🧘', label: 'Spa & Wellness', businessType: 'health' },
];

// Counts per activity for badges
export interface MarketplaceCounts {
  proposalCounts: Record<string, number>;
  suggestionCounts: Record<string, number>;
}

// Current user info for display
export interface CurrentUser {
  id: string;
  email?: string;
  avatar_url?: string | null;
  full_name?: string | null;
}

// User marketplace context
export interface UserMarketplaceContext {
  isBusiness: boolean;
  business?: Business | null;
  isGuide: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
  currentUser?: CurrentUser | null;
}

// Form data types
export interface BidFormData {
  total_price: number;
  currency: string;
  expires_at: string;
  message: string;
  services_offered: ServiceOffered[];
  pricing_breakdown?: PricingItem[];
}

export interface SuggestionFormData {
  place_name: string;
  reason: string;
  category?: string;
  location_lat?: number;
  location_lng?: number;
  source_url?: string;
  location_address?: string;
}
