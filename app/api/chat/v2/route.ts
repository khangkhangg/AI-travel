import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
  TripSlots,
  ConversationState,
  GeneratedTrip,
  calculateSlotProgress,
  SlotProgress,
} from '@/lib/types/chat-session';
import {
  extractSlotsFromResponse,
  stripSlotsMetadata,
  mergeSlots,
} from '@/lib/chat/slot-extractor';

const SETTINGS_FILE = path.join(process.cwd(), 'config', 'settings.json');

interface Settings {
  deepseekApiKey: string;
  chatEnabled: boolean;
  maxTokens: number;
}

// Request body type
interface ChatV2Request {
  sessionId: string;
  slots: TripSlots;
  conversationState: ConversationState;
  latestMessage: string;
  generatedTrip?: GeneratedTrip;
}

// Response body type
interface ChatV2Response {
  message: string;
  updatedSlots: TripSlots;
  newState: ConversationState;
  generatedTrip?: GeneratedTrip;
  slotProgress: SlotProgress;
  aiMetrics: {
    model: string;
    provider: string;
    tokensUsed: number;
    promptTokens: number;
    completionTokens: number;
    cost: number;
  };
}

// Regex to extract trip JSON from response
const TRIP_JSON_PATTERN = /<!--TRIP_JSON(\{[\s\S]*?\})TRIP_JSON-->/;

async function loadSettings(): Promise<Settings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      deepseekApiKey: '',
      chatEnabled: true,
      maxTokens: 4096, // Higher for trip generation
    };
  }
}

/**
 * Build the system prompt based on current state and slots
 */
function buildSystemPrompt(
  slots: TripSlots,
  conversationState: ConversationState,
  generatedTrip?: GeneratedTrip
): string {
  const destinationStr = slots.destination || 'not set';
  const datesStr =
    slots.dates.startDate && slots.dates.duration
      ? `${slots.dates.startDate} for ${slots.dates.duration} days`
      : 'not set';
  const budgetStr =
    slots.budget.amount !== null
      ? `$${slots.budget.amount} ${slots.budget.currency}${slots.budget.perPerson ? ' per person' : ' total'}`
      : 'not set';
  const travelersStr = `${slots.travelers.adults} adults, ${slots.travelers.children} children`;
  const travelStyleStr = slots.travelStyle || 'not set';
  const interestsStr = slots.interests.length > 0 ? slots.interests.join(', ') : 'not set';
  const accommodationStr = slots.accommodationType || 'not set';

  const progress = calculateSlotProgress(slots);
  const missingStr = progress.missing.length > 0 ? progress.missing.join(', ') : 'none';

  let stateInstructions = '';
  switch (conversationState) {
    case 'gathering':
      stateInstructions = `
STATE INSTRUCTIONS:
- Ask ONE question at a time about missing slots
- Be conversational and friendly
- Extract any trip details mentioned in the user's message
- If user provides multiple details at once, acknowledge them all`;
      break;
    case 'ready':
      stateInstructions = `
STATE INSTRUCTIONS:
- All slots are filled! Summarize the trip details
- Ask "I have everything I need! Ready to create your personalized itinerary?"
- Wait for user confirmation before generating`;
      break;
    case 'generating':
      stateInstructions = `
STATE INSTRUCTIONS:
- Generate a complete, detailed itinerary based on the filled slots
- Output the itinerary as JSON in a <!--TRIP_JSON{...}TRIP_JSON--> block
- The JSON should match the GeneratedTrip type structure
- Include day-by-day activities with times, costs, and locations
- Be creative and provide local insights`;
      break;
    case 'refining':
      stateInstructions = `
STATE INSTRUCTIONS:
- A trip has already been generated
- Make incremental changes based on user requests
- If they want major changes, you can regenerate portions
- Output any trip updates in a <!--TRIP_JSON{...}TRIP_JSON--> block`;
      break;
  }

  return `You are a travel planning assistant using a slot-filling approach.

CURRENT STATE: ${conversationState}

FILLED SLOTS:
- Destination: ${destinationStr}
- Dates: ${datesStr}
- Budget: ${budgetStr}
- Travelers: ${travelersStr}
- Travel Style: ${travelStyleStr}
- Interests: ${interestsStr}
- Accommodation: ${accommodationStr}

SLOT PROGRESS: ${progress.filled}/${progress.total} (${progress.percentage}%)
MISSING SLOTS: ${missingStr}

${stateInstructions}

${generatedTrip ? `
EXISTING TRIP:
The user already has a generated trip to ${generatedTrip.metadata.destination}.
They may be asking to modify or refine it.
` : ''}

RESPONSE FORMAT RULES:
1. Be conversational, helpful, and enthusiastic about travel
2. ${conversationState === 'generating' ? 'Output the full itinerary JSON in a <!--TRIP_JSON{...}TRIP_JSON--> block' : ''}
3. At the END of EVERY response (except when generating trip), include slot updates:
   <!--SLOTS{...JSON of any updated slot values...}SLOTS-->

SLOT UPDATE FORMAT (only include fields that were mentioned/updated):
<!--SLOTS{
  "destination": "Paris, France",
  "dates": {"startDate": "2024-06-15", "duration": 7},
  "budget": {"amount": 3000, "currency": "USD", "perPerson": true},
  "travelers": {"adults": 2, "children": 0},
  "travelStyle": "cultural",
  "interests": ["food", "museums", "architecture"],
  "accommodationType": "hotel"
}SLOTS-->

${conversationState === 'generating' ? `
TRIP JSON FORMAT:
<!--TRIP_JSON{
  "metadata": {
    "destination": "...",
    "country": "...",
    "startDate": "...",
    "endDate": "...",
    "duration": ...,
    "budget": {"total": ..., "currency": "...", "perPerson": ...},
    "travelers": {"adults": ..., "children": ...},
    "travelStyle": "...",
    "interests": [...],
    "accommodationType": "..."
  },
  "itinerary": [
    {
      "dayNumber": 1,
      "items": [
        {
          "title": "Activity name",
          "category": "accommodation|food|activity|transport|nightlife",
          "startTime": "09:00",
          "endTime": "11:00",
          "estimatedCost": 50,
          "location": {"name": "...", "address": "...", "lat": ..., "lng": ...},
          "description": "...",
          "tips": "..."
        }
      ]
    }
  ],
  "recommendations": {
    "doAndDont": {"do": [...], "dont": [...]},
    "packingList": [...],
    "localPhrases": [{"phrase": "...", "meaning": "..."}],
    "emergencyContacts": [{"name": "...", "number": "..."}]
  }
}TRIP_JSON-->
` : ''}`;
}

/**
 * Determine the next conversation state based on current state and response
 */
function determineNextState(
  currentState: ConversationState,
  updatedSlots: TripSlots,
  userMessage: string,
  hasGeneratedTrip: boolean
): ConversationState {
  const progress = calculateSlotProgress(updatedSlots);
  const allSlotsFilled = progress.filled === progress.total;

  // Check for user intent keywords
  const lowerMessage = userMessage.toLowerCase();
  const wantsToGenerate =
    lowerMessage.includes('yes') ||
    lowerMessage.includes('go ahead') ||
    lowerMessage.includes('create') ||
    lowerMessage.includes('generate') ||
    lowerMessage.includes("let's do it") ||
    lowerMessage.includes('sounds good') ||
    lowerMessage.includes('perfect');

  const wantsToChange =
    lowerMessage.includes('change') ||
    lowerMessage.includes('modify') ||
    lowerMessage.includes('different') ||
    lowerMessage.includes('instead') ||
    lowerMessage.includes('actually');

  switch (currentState) {
    case 'gathering':
      if (allSlotsFilled) {
        return 'ready';
      }
      return 'gathering';

    case 'ready':
      if (wantsToChange) {
        return 'gathering';
      }
      if (wantsToGenerate) {
        return 'generating';
      }
      return 'ready';

    case 'generating':
      // After generating, move to refining
      return 'refining';

    case 'refining':
      if (wantsToChange && !allSlotsFilled) {
        return 'gathering';
      }
      return 'refining';

    default:
      return 'gathering';
  }
}

/**
 * Extract generated trip from AI response
 */
function extractGeneratedTrip(responseText: string): GeneratedTrip | null {
  const match = responseText.match(TRIP_JSON_PATTERN);
  if (!match || !match[1]) {
    return null;
  }

  try {
    const tripData = JSON.parse(match[1]);
    // Basic validation
    if (tripData.metadata && tripData.itinerary && Array.isArray(tripData.itinerary)) {
      return tripData as GeneratedTrip;
    }
    return null;
  } catch (error) {
    console.warn('Failed to parse TRIP_JSON:', error);
    return null;
  }
}

/**
 * Strip trip JSON metadata from response for display
 */
function stripTripJsonMetadata(responseText: string): string {
  return responseText.replace(TRIP_JSON_PATTERN, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const settings = await loadSettings();

    if (!settings.chatEnabled) {
      return NextResponse.json({ error: 'Chat is currently disabled' }, { status: 503 });
    }

    if (!settings.deepseekApiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    const body: ChatV2Request = await request.json();
    const { sessionId, slots, conversationState, latestMessage, generatedTrip } = body;

    // Validate request
    if (!sessionId || !slots || !conversationState || !latestMessage) {
      return NextResponse.json(
        { error: 'Invalid request: sessionId, slots, conversationState, and latestMessage required' },
        { status: 400 }
      );
    }

    // Build system prompt based on current state
    const systemPrompt = buildSystemPrompt(slots, conversationState, generatedTrip);

    // Prepare messages for Deepseek API
    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: latestMessage,
      },
    ];

    // Call Deepseek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: apiMessages,
        max_tokens: settings.maxTokens,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Deepseek API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get AI response. Please try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Extract slots from response
    const extractedSlots = extractSlotsFromResponse(assistantMessage);
    const updatedSlots = extractedSlots ? mergeSlots(slots, extractedSlots) : slots;

    // Extract generated trip if in generating state
    let newGeneratedTrip = generatedTrip;
    if (conversationState === 'generating') {
      const extracted = extractGeneratedTrip(assistantMessage);
      if (extracted) {
        newGeneratedTrip = extracted;
      }
    }

    // Determine next state
    const newState = determineNextState(
      conversationState,
      updatedSlots,
      latestMessage,
      !!newGeneratedTrip
    );

    // Strip metadata from message for display
    let cleanMessage = stripSlotsMetadata(assistantMessage);
    cleanMessage = stripTripJsonMetadata(cleanMessage);

    // Calculate slot progress
    const slotProgress = calculateSlotProgress(updatedSlots);

    // Calculate tokens used and cost
    const tokensUsed = data.usage?.total_tokens || 0;
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;

    // Deepseek pricing: ~$0.14/1M input tokens, ~$0.28/1M output tokens
    const inputCost = (promptTokens / 1000000) * 0.14;
    const outputCost = (completionTokens / 1000000) * 0.28;
    const cost = inputCost + outputCost;

    const responseBody: ChatV2Response = {
      message: cleanMessage,
      updatedSlots,
      newState,
      slotProgress,
      aiMetrics: {
        model: 'deepseek-chat',
        provider: 'deepseek',
        tokensUsed,
        promptTokens,
        completionTokens,
        cost,
      },
    };

    // Only include generatedTrip if it exists
    if (newGeneratedTrip) {
      responseBody.generatedTrip = newGeneratedTrip;
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('Chat V2 API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
