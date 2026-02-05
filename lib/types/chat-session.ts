// Chat Session Types for Slot-Based Trip Planning
// This module provides types for the refactored chat system that uses
// slot filling instead of sending full conversation history.

// ============================================================================
// Constants (defined first for use in types)
// ============================================================================

/**
 * Valid travel style options
 */
export const TRAVEL_STYLES = ['adventure', 'relaxed', 'cultural', 'luxury'] as const;
export type TravelStyle = typeof TRAVEL_STYLES[number];

/**
 * Valid accommodation type options
 */
export const ACCOMMODATION_TYPES = ['hotel', 'hostel', 'airbnb', 'luxury'] as const;
export type AccommodationType = typeof ACCOMMODATION_TYPES[number];

// ============================================================================
// Core Types
// ============================================================================

export interface TripSlots {
  // Core 4 (required)
  destination: string | null;
  dates: {
    startDate: string | null;  // ISO date
    duration: number | null;   // days
  };
  budget: {
    amount: number | null;
    currency: string;
    perPerson: boolean;
  };
  travelers: {
    adults: number;
    children: number;
  };

  // Preferences (required)
  travelStyle: TravelStyle | null;
  interests: string[];             // ['food', 'temples', 'nightlife']
  accommodationType: AccommodationType | null;

  // Derived
  isComplete: boolean;
  completionPercentage: number;
}

export type ConversationState =
  | 'gathering'    // Collecting slot information
  | 'ready'        // All slots filled, waiting for user confirmation
  | 'generating'   // Creating the trip
  | 'refining';    // Trip exists, making modifications

export interface ChatSession {
  sessionId: string;
  slots: TripSlots;
  conversationState: ConversationState;
  lastMessages: Message[];      // Last 5 for display
  generatedTrip: GeneratedTrip | null;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GeneratedTrip {
  // Maps to trips.generated_content
  metadata: {
    destination: string;
    country: string;
    startDate: string;
    endDate: string;
    duration: number;
    budget: {
      total: number;
      currency: string;
      perPerson: boolean;
    };
    travelers: {
      adults: number;
      children: number;
    };
    travelStyle: string;
    interests: string[];
    accommodationType: string;
  };

  // Maps to itinerary_items table
  itinerary: Array<{
    dayNumber: number;
    items: Array<{
      title: string;
      category: 'accommodation' | 'food' | 'activity' | 'transport' | 'nightlife';
      startTime?: string;
      endTime?: string;
      estimatedCost?: number;
      location?: {
        name: string;
        address?: string;
        lat?: number;
        lng?: number;
      };
      description?: string;
      bookingUrl?: string;
      tips?: string;
    }>;
  }>;

  // Additional recommendations
  recommendations: {
    doAndDont: { do: string[]; dont: string[] };
    packingList: string[];
    localPhrases: Array<{ phrase: string; meaning: string }>;
    emergencyContacts: Array<{ name: string; number: string }>;
  };
}

/**
 * Human-readable labels for each slot, used in UI displays
 */
export const SLOT_LABELS = {
  destination: 'Destination',
  dates: 'Travel Dates',
  budget: 'Budget',
  travelers: 'Travelers',
  travelStyle: 'Travel Style',
  interests: 'Interests',
  accommodationType: 'Accommodation Type',
} as const;

export type SlotKey = keyof typeof SLOT_LABELS;

/**
 * Common interest categories
 */
export const INTEREST_OPTIONS = [
  'food',
  'temples',
  'nightlife',
  'nature',
  'history',
  'shopping',
  'beaches',
  'museums',
  'adventure',
  'photography',
  'local culture',
  'architecture',
] as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates an empty TripSlots object with default values
 */
export function getEmptySlots(): TripSlots {
  return {
    destination: null,
    dates: {
      startDate: null,
      duration: null,
    },
    budget: {
      amount: null,
      currency: 'USD',
      perPerson: true,
    },
    travelers: {
      adults: 1,
      children: 0,
    },
    travelStyle: null,
    interests: [],
    accommodationType: null,
    isComplete: false,
    completionPercentage: 0,
  };
}

/**
 * Slot progress information returned by calculateSlotProgress
 */
export interface SlotProgress {
  filled: number;
  total: number;
  missing: string[];
  percentage: number;
}

/**
 * Calculates how many slots are filled and which are missing
 * @param slots - The TripSlots object to analyze
 * @returns Progress information including filled count, total, missing slots, and percentage
 */
export function calculateSlotProgress(slots: TripSlots): SlotProgress {
  const slotChecks: Array<{ key: string; isFilled: boolean }> = [
    { key: 'destination', isFilled: !!slots.destination?.trim() },
    { key: 'dates', isFilled: slots.dates.startDate !== null && slots.dates.duration !== null && slots.dates.duration > 0 },
    { key: 'budget', isFilled: slots.budget.amount !== null && slots.budget.amount > 0 },
    { key: 'travelers', isFilled: slots.travelers.adults > 0 },
    { key: 'travelStyle', isFilled: !!slots.travelStyle?.trim() },
    { key: 'interests', isFilled: slots.interests.length > 0 },
    { key: 'accommodationType', isFilled: !!slots.accommodationType?.trim() },
  ];

  const filled = slotChecks.filter(s => s.isFilled).length;
  const total = slotChecks.length;
  const missing = slotChecks.filter(s => !s.isFilled).map(s => SLOT_LABELS[s.key] || s.key);
  const percentage = Math.round((filled / total) * 100);

  return {
    filled,
    total,
    missing,
    percentage,
  };
}

/**
 * Updates the isComplete and completionPercentage fields on a TripSlots object
 * @param slots - The TripSlots object to update
 * @returns A new TripSlots object with updated completion fields
 */
export function updateSlotCompletion(slots: TripSlots): TripSlots {
  const progress = calculateSlotProgress(slots);
  return {
    ...slots,
    isComplete: progress.filled === progress.total,
    completionPercentage: progress.percentage,
  };
}

/**
 * Creates an empty ChatSession with a new session ID
 * @param sessionId - Optional session ID, will generate one if not provided
 * @returns A new ChatSession object
 */
export function createEmptyChatSession(sessionId?: string): ChatSession {
  return {
    sessionId: sessionId || generateSessionId(),
    slots: getEmptySlots(),
    conversationState: 'gathering',
    lastMessages: [],
    generatedTrip: null,
    updatedAt: Date.now(),
  };
}

/**
 * Generates a unique session ID
 */
function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
