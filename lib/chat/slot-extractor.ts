// Slot Extractor for AI Response Parsing
// This module extracts slot information from AI response metadata blocks
// and merges them with existing TripSlots.

import {
  TripSlots,
  TravelStyle,
  AccommodationType,
  TRAVEL_STYLES,
  ACCOMMODATION_TYPES,
  updateSlotCompletion,
} from '@/lib/types/chat-session';

// Regex pattern to match the SLOTS metadata block
// Format: <!--SLOTS{...JSON...}SLOTS-->
const SLOTS_PATTERN = /<!--SLOTS(\{[\s\S]*?\})SLOTS-->/;

/**
 * Validates that a value is a valid TravelStyle
 */
function isValidTravelStyle(value: unknown): value is TravelStyle {
  return typeof value === 'string' && TRAVEL_STYLES.includes(value as TravelStyle);
}

/**
 * Validates that a value is a valid AccommodationType
 */
function isValidAccommodationType(value: unknown): value is AccommodationType {
  return typeof value === 'string' && ACCOMMODATION_TYPES.includes(value as AccommodationType);
}

/**
 * Validates and sanitizes the extracted slots data
 * Returns a partial TripSlots object with only valid fields
 */
function validateExtractedSlots(data: unknown): Partial<TripSlots> | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const raw = data as Record<string, unknown>;
  const result: Partial<TripSlots> = {};

  // Validate destination
  if (typeof raw.destination === 'string' && raw.destination.trim()) {
    result.destination = raw.destination.trim();
  }

  // Validate dates
  if (raw.dates && typeof raw.dates === 'object') {
    const dates = raw.dates as Record<string, unknown>;
    const startDate = typeof dates.startDate === 'string' ? dates.startDate : null;
    const duration = typeof dates.duration === 'number' ? dates.duration : null;

    if (startDate !== null || duration !== null) {
      result.dates = {
        startDate: startDate,
        duration: duration,
      };
    }
  }

  // Validate budget
  if (raw.budget && typeof raw.budget === 'object') {
    const budget = raw.budget as Record<string, unknown>;
    const amount = typeof budget.amount === 'number' ? budget.amount : null;
    const currency = typeof budget.currency === 'string' ? budget.currency : 'USD';
    const perPerson = typeof budget.perPerson === 'boolean' ? budget.perPerson : true;

    if (amount !== null) {
      result.budget = {
        amount,
        currency,
        perPerson,
      };
    }
  }

  // Validate travelers
  if (raw.travelers && typeof raw.travelers === 'object') {
    const travelers = raw.travelers as Record<string, unknown>;
    const adults = typeof travelers.adults === 'number' ? travelers.adults : 1;
    const children = typeof travelers.children === 'number' ? travelers.children : 0;

    result.travelers = {
      adults: Math.max(1, adults), // At least 1 adult
      children: Math.max(0, children),
    };
  }

  // Validate travelStyle
  if (isValidTravelStyle(raw.travelStyle)) {
    result.travelStyle = raw.travelStyle;
  }

  // Validate interests
  if (Array.isArray(raw.interests)) {
    const validInterests = raw.interests
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim());

    if (validInterests.length > 0) {
      result.interests = validInterests;
    }
  }

  // Validate accommodationType
  if (isValidAccommodationType(raw.accommodationType)) {
    result.accommodationType = raw.accommodationType;
  }

  // Return null if no valid fields were extracted
  if (Object.keys(result).length === 0) {
    return null;
  }

  return result;
}

/**
 * Extract the SLOTS metadata from AI response text
 * Returns null if no metadata found or if parsing fails
 *
 * @param responseText - The full AI response text that may contain SLOTS metadata
 * @returns Partial TripSlots object with extracted values, or null if not found/invalid
 */
export function extractSlotsFromResponse(responseText: string): Partial<TripSlots> | null {
  if (!responseText || typeof responseText !== 'string') {
    return null;
  }

  const match = responseText.match(SLOTS_PATTERN);
  if (!match || !match[1]) {
    return null;
  }

  try {
    const jsonString = match[1];
    const parsed = JSON.parse(jsonString);
    return validateExtractedSlots(parsed);
  } catch (error) {
    // JSON parse error - return null gracefully
    console.warn('Failed to parse SLOTS metadata:', error);
    return null;
  }
}

/**
 * Strip the SLOTS metadata from the response text for display
 * Returns the clean text to show the user
 *
 * @param responseText - The full AI response text that may contain SLOTS metadata
 * @returns The response text with SLOTS metadata removed
 */
export function stripSlotsMetadata(responseText: string): string {
  if (!responseText || typeof responseText !== 'string') {
    return responseText || '';
  }

  // Remove the SLOTS metadata block and any trailing whitespace it may have caused
  return responseText.replace(SLOTS_PATTERN, '').trimEnd();
}

/**
 * Merge extracted slots with existing slots
 * Only updates fields that have values in the extracted slots
 * Recalculates isComplete and completionPercentage after merge
 *
 * @param existing - The current TripSlots object
 * @param extracted - Partial TripSlots with values extracted from AI response
 * @returns New TripSlots object with merged values and updated completion status
 */
export function mergeSlots(existing: TripSlots, extracted: Partial<TripSlots>): TripSlots {
  if (!extracted) {
    return existing;
  }

  const merged: TripSlots = { ...existing };

  // Merge destination
  if (extracted.destination !== undefined && extracted.destination !== null) {
    merged.destination = extracted.destination;
  }

  // Merge dates (partial merge - only update non-null values)
  if (extracted.dates) {
    merged.dates = {
      startDate: extracted.dates.startDate ?? existing.dates.startDate,
      duration: extracted.dates.duration ?? existing.dates.duration,
    };
  }

  // Merge budget (partial merge - only update if amount is present)
  if (extracted.budget && extracted.budget.amount !== null) {
    merged.budget = {
      amount: extracted.budget.amount,
      currency: extracted.budget.currency ?? existing.budget.currency,
      perPerson: extracted.budget.perPerson ?? existing.budget.perPerson,
    };
  }

  // Merge travelers
  if (extracted.travelers) {
    merged.travelers = {
      adults: extracted.travelers.adults ?? existing.travelers.adults,
      children: extracted.travelers.children ?? existing.travelers.children,
    };
  }

  // Merge travelStyle
  if (extracted.travelStyle !== undefined && extracted.travelStyle !== null) {
    merged.travelStyle = extracted.travelStyle;
  }

  // Merge interests (replace if provided, don't append)
  if (extracted.interests && extracted.interests.length > 0) {
    merged.interests = extracted.interests;
  }

  // Merge accommodationType
  if (extracted.accommodationType !== undefined && extracted.accommodationType !== null) {
    merged.accommodationType = extracted.accommodationType;
  }

  // Recalculate completion status
  return updateSlotCompletion(merged);
}
