// Tour Package Types

export interface TourTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface TourGuide {
  id: string;
  userId: string;
  name: string;
  businessName?: string;
  bio?: string;
  city?: string;
  country?: string;
  phone?: string;
  website?: string;
  languages: string[];
  certifications: string[];
  yearsExperience: number;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  createdAt: string;
  updatedAt: string;
  // Joined from users table
  user?: {
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface TourImage {
  id: string;
  tourId: string;
  url: string;
  altText?: string;
  caption?: string;
  isCover: boolean;
  sortOrder: number;
}

export interface TourActivity {
  id: string;
  tourId: string;
  dayNumber: number;
  orderIndex: number;
  timeStart?: string;
  timeEnd?: string;
  title: string;
  description?: string;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  durationMinutes?: number;
  activityType: 'activity' | 'food' | 'transport' | 'accommodation' | 'free_time' | 'meeting';
  isOptional: boolean;
  extraCost?: number;
}

export interface Tour {
  id: string;
  guideId: string;

  // Basic info
  name: string;
  slug: string;
  description?: string;
  highlights: string[];

  // Location
  city: string;
  country: string;
  meetingPoint?: string;
  meetingPointLat?: number;
  meetingPointLng?: number;

  // Duration & Pricing
  durationDays: number;
  durationHours: number;
  pricePerPerson: number;
  priceCurrency: string;
  maxGroupSize: number;
  minGroupSize: number;

  // Content
  whatIncluded: string[];
  whatNotIncluded: string[];
  requirements: string[];
  notes?: string;
  instructions?: string;
  cancellationPolicy?: string;

  // Status
  status: 'draft' | 'pending' | 'active' | 'inactive' | 'archived';
  visibility: 'public' | 'private' | 'unlisted';
  isFeatured: boolean;

  // Stats
  viewsCount: number;
  bookingsCount: number;
  rating: number;
  reviewsCount: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  // Relations (optional, loaded on demand)
  guide?: TourGuide;
  tags?: TourTag[];
  images?: TourImage[];
  activities?: TourActivity[];
}

export interface TourAvailability {
  id: string;
  tourId: string;
  date: string;
  spotsAvailable: number;
  spotsBooked: number;
  priceOverride?: number;
  isAvailable: boolean;
  notes?: string;
}

export interface TourReview {
  id: string;
  tourId: string;
  userId: string;
  rating: number;
  title?: string;
  content?: string;
  photos: string[];
  isVerified: boolean;
  isVisible: boolean;
  guideResponse?: string;
  guideResponseAt?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  user?: {
    fullName: string;
    avatarUrl?: string;
  };
}

export interface TourBooking {
  id: string;
  tourId: string;
  userId: string;
  availabilityId?: string;
  bookingDate: string;
  numTravelers: number;
  totalPrice: number;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded' | 'no_show';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed';
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

// API Request/Response types
export interface CreateTourRequest {
  name: string;
  description?: string;
  highlights?: string[];
  city: string;
  country: string;
  meetingPoint?: string;
  durationDays: number;
  durationHours?: number;
  pricePerPerson: number;
  priceCurrency?: string;
  maxGroupSize?: number;
  minGroupSize?: number;
  whatIncluded?: string[];
  whatNotIncluded?: string[];
  requirements?: string[];
  notes?: string;
  instructions?: string;
  cancellationPolicy?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  tagIds?: string[];
  images?: { url: string; altText?: string; caption?: string; isCover?: boolean }[];
  activities?: Omit<TourActivity, 'id' | 'tourId'>[];
}

export interface UpdateTourRequest extends Partial<CreateTourRequest> {
  status?: 'draft' | 'pending' | 'active' | 'inactive' | 'archived';
}

export interface TourFilters {
  city?: string;
  country?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  minRating?: number;
  guideId?: string;
  status?: string;
  visibility?: string;
  search?: string;
  sortBy?: 'price' | 'rating' | 'reviews' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TourListResponse {
  tours: Tour[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateGuideRequest {
  businessName?: string;
  bio?: string;
  phone?: string;
  website?: string;
  languages?: string[];
  certifications?: string[];
  yearsExperience?: number;
}
