export interface CollaborateActivity {
  id: string;
  trip_id: string;
  day_number: number;
  order_index: number;
  title: string;
  summary?: string;
  description?: string;
  category?: string;
  location_name?: string;
  location_address?: string;
  estimated_cost?: number;
  time_start?: string;
  time_end?: string;
  is_final: boolean;
  payer_id?: string;
  is_split: boolean;
  source_url?: string;
  place_data?: PlaceData;
  votes?: ActivityVote[];
  comment_count?: number;
}

export interface ActivityVote {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  vote: 'up' | 'down' | 'pending';
}

export interface PlaceData {
  name: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  priceLevel?: string;
  hours?: string;
  categories?: string[];
  description?: string;
  photos?: string[];
  coordinates?: { lat: number; lng: number };
  sourceUrl?: string;
}

export interface DayData {
  dayNumber: number;
  title?: string;
  date?: string;
  hotel?: CollaborateActivity;
  activities: CollaborateActivity[];
}

export interface Traveler {
  id: string;
  name: string;
  age: number;
  is_child: boolean;
  user_id?: string;
  email?: string;
}

export interface CostBreakdown {
  total: number;
  perPerson: number;
  paidBy: {
    travelerId: string;
    travelerName: string;
    amount: number;
  }[];
  settlements: Settlement[];
}

export interface Settlement {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  isSettled: boolean;
}

export interface CollaborateTrip {
  id: string;
  title: string;
  city?: string;
  arrival_time?: string;
  departure_time?: string;
  start_date?: string;
  days: DayData[];
  travelers: Traveler[];
  user_role?: string;
}
