// Activity Feed Types for Trip Discussion Marketplace Events

export type ActivityFeedMessageType =
  | 'message'
  | 'deleted_activity'
  | 'proposal_created'
  | 'proposal_accepted'
  | 'proposal_declined'
  | 'proposal_withdrawn'
  | 'proposal_withdrawal_requested'
  | 'suggestion_created'
  | 'suggestion_used'
  | 'suggestion_dismissed';

export interface ProposalMetadata {
  proposal_id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  business_logo?: string;
  activity_id?: string;
  activity_title?: string;
  total_price: number;
  currency: string;
  message?: string;
  services_offered?: any[];
  pricing_breakdown?: any[];
  withdrawal_reason?: string;
  previous_status?: string;
}

export interface SuggestionMetadata {
  suggestion_id: string;
  suggester_id: string;
  suggester_name: string;
  suggester_avatar?: string;
  activity_id?: string;
  activity_title?: string;
  place_name: string;
  reason: string;
  day_number?: number;
  category?: string;
  source_url?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  previous_status?: string;
}

export interface DeletedActivityMetadata {
  activity: {
    id: string;
    title: string;
    day_number: number;
    category?: string;
    estimated_cost?: number;
    location_name?: string;
  };
  deleted_by_name?: string;
  restored_at?: string;
  restored_by_name?: string;
}

export type ActivityFeedMetadata =
  | ProposalMetadata
  | SuggestionMetadata
  | DeletedActivityMetadata;

export interface ActivityFeedItem {
  id: string;
  trip_id: string;
  itinerary_item_id?: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  content: string;
  message_type: ActivityFeedMessageType;
  metadata?: ActivityFeedMetadata;
  created_at: string;
}
