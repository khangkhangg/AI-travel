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
import { query } from '@/lib/db';

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
 * Log chat metrics to database for analytics
 */
async function logChatMetrics(metrics: {
  sessionId: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  conversationState: string;
  slotsFilled: number;
  slotsTotal: number;
  responseTimeMs?: number;
  tripGenerated: boolean;
}): Promise<void> {
  try {
    console.log('[chat/v2] Logging metrics:', {
      totalTokens: metrics.totalTokens,
      cost: metrics.cost,
      state: metrics.conversationState,
      responseTimeMs: metrics.responseTimeMs,
    });

    await query(
      `INSERT INTO chat_metrics (
        session_id, model, provider, prompt_tokens, completion_tokens,
        total_tokens, cost, conversation_state, slots_filled, slots_total,
        response_time_ms, trip_generated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        metrics.sessionId,
        metrics.model,
        metrics.provider,
        metrics.promptTokens,
        metrics.completionTokens,
        metrics.totalTokens,
        metrics.cost,
        metrics.conversationState,
        metrics.slotsFilled,
        metrics.slotsTotal,
        metrics.responseTimeMs || null,
        metrics.tripGenerated,
      ]
    );
    console.log('[chat/v2] Metrics logged successfully');
  } catch (error: any) {
    // Log error but don't fail the request - metrics are not critical
    console.error('[chat/v2] Failed to log chat metrics:', error?.message || error);
    // If table doesn't exist, remind to run migration
    if (error?.message?.includes('does not exist')) {
      console.error('[chat/v2] HINT: Run migration at POST /api/admin/migrate to create chat_metrics table');
    }
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
      // Check if all slots were just filled with this message
      if (progress.filled === progress.total) {
        stateInstructions = `
STATE INSTRUCTIONS:
- ALL SLOTS ARE NOW FILLED! The user just provided the last piece of information.
- Acknowledge what they told you, then summarize ALL the trip details:
  * Destination: ${destinationStr}
  * Dates: ${datesStr}
  * Budget: ${budgetStr}
  * Travelers: ${travelersStr}
  * Travel Style: ${travelStyleStr}
  * Interests: ${interestsStr}
  * Accommodation: ${accommodationStr}
- End your response with: "I have everything I need! Ready to create your personalized itinerary?"
- Do NOT generate the itinerary yet - wait for user confirmation`;
      } else {
        stateInstructions = `
STATE INSTRUCTIONS:
- You are ONLY gathering information. You are NOT ready to create an itinerary yet.
- Ask ONE question at a time about the missing slots listed above
- Be conversational and friendly while asking about missing information
- Extract any trip details mentioned in the user's message
- If user provides multiple details at once, acknowledge them all and ask about the next missing slot

CRITICAL - DO NOT:
- Do NOT mention "putting together an itinerary" or "creating your trip"
- Do NOT say "Here's what I've come up with" or anything similar
- Do NOT describe or preview the trip until ALL ${progress.total} slots are filled (currently ${progress.filled} filled)
- Do NOT transition to generating mode - you MUST stay in gathering mode
- Do NOT summarize what the final trip will look like

Your ONLY job right now: Ask about the missing slots: ${missingStr}`;
      }
      break;
    case 'ready':
      stateInstructions = `
STATE INSTRUCTIONS:
- All slots are filled and summarized already.
- The user may be confirming they want to proceed OR asking to change something.
- If they confirm (yes, ready, let's go, etc.), respond briefly: "Great! Generating your personalized itinerary now..."
  Then the system will transition to generating mode.
- If they want to change something, help them update the specific slot.
- Do NOT repeat the full trip summary - it was already shown.
- Do NOT generate the itinerary JSON yourself - just acknowledge their confirmation.`;
      break;
    case 'generating':
      stateInstructions = `
STATE INSTRUCTIONS:
- Generate a complete, detailed itinerary based on the filled slots
- Start with a brief exciting intro (1-2 sentences max), then output the JSON
- Output the COMPLETE itinerary as JSON in a <!--TRIP_JSON{...}TRIP_JSON--> block
- The JSON MUST be complete and valid - do not truncate or cut off
- Include 3-5 activities per day with times, costs, and locations
- Keep descriptions concise (1-2 sentences) to fit within token limits
- CRITICAL: Ensure the JSON ends properly with all closing brackets

JSON FORMAT - Follow this structure exactly:
<!--TRIP_JSON{
  "metadata": {...},
  "itinerary": [{
    "dayNumber": 1,
    "items": [{"title": "...", "category": "...", "startTime": "...", "endTime": "...", "estimatedCost": 0, "location": {"name": "...", "address": "..."}, "description": "...", "tips": "..."}]
  }],
  "recommendations": {"doAndDont": {"do": [...], "dont": [...]}, "packingList": [...], "localPhrases": [...], "emergencyContacts": [...]}
}TRIP_JSON-->`;
      break;
    case 'refining':
      stateInstructions = `
STATE INSTRUCTIONS:
- A trip has already been generated for this session
- IMPORTANT: If the user asks to "create itinerary", "show itinerary", "generate trip", etc., remind them that their trip has ALREADY been created. Say something like:
  "Your [destination] itinerary is already created and ready! You can see it displayed on the left. Would you like me to make any changes to it?"
  Do NOT start over asking for all the trip details again.
- IMPORTANT: Check if the user is SATISFIED with the trip. Satisfaction phrases include:
  * "no" (when asked if they want changes), "no changes", "no that's it"
  * "perfect", "it's perfect", "looks perfect"
  * "great", "looks great", "that's great"
  * "good", "looks good", "that's good", "all good"
  * "love it", "I love it"
  * "done", "I'm done", "we're done"
  * "satisfied", "I'm satisfied", "I'm happy with it"
  * "nothing else", "that's all", "that's everything"
- If the user indicates satisfaction, DO NOT ask for more changes. Simply say something brief like:
  "Wonderful! Your trip is all set. Have an amazing time in [destination]! 🎉"
  Then STOP. Do not ask any follow-up questions.
- Only if the user explicitly requests changes should you make modifications
- If they want changes, make incremental updates based on their requests
- If they want major changes, you can regenerate portions
- Output any trip updates in a <!--TRIP_JSON{...}TRIP_JSON--> block`;
      break;
  }

  return `You are a travel planning assistant using a slot-filling approach.

IMPORTANT: You MUST complete gathering ALL information before generating ANY itinerary.
Do NOT generate, preview, or describe trip details until you reach the "generating" state.

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

${generatedTrip && generatedTrip.itinerary && generatedTrip.itinerary.length > 0 ? `
EXISTING TRIP:
The user already has a generated trip to ${generatedTrip.metadata?.destination || 'their destination'}.
The itinerary has ${generatedTrip.itinerary.length} days of activities.
They may be asking to modify or refine it.
` : ''}

RESPONSE FORMAT RULES:
1. Be conversational, helpful, and enthusiastic about travel
2. ${conversationState === 'gathering' ? 'STAY FOCUSED: Only ask about missing slots. Do NOT describe, preview, or generate any trip content.' : ''}
3. ${conversationState === 'generating' ? 'Output the full itinerary JSON in a <!--TRIP_JSON{...}TRIP_JSON--> block' : ''}
4. **CRITICAL - SLOT EXTRACTION**: You MUST analyze the user's message and extract ANY trip-related information:
   - Numbers like "10 days", "5 days" → set dates.duration
   - Numbers like "$3000", "2000 budget" → set budget.amount
   - Family mentions like "family of 4", "2 kids", "couple" → set travelers
   - Activities like "food", "adventure", "culture", "beach" → set interests array
   - Styles like "luxury", "budget", "adventure" → set travelStyle
   - Places like "Paris", "Tokyo", "Vancouver" → set destination
   - Accommodation like "hotel", "hostel", "airbnb" → set accommodationType

5. **MANDATORY**: At the END of EVERY response, you MUST include the SLOTS block with ALL values you extracted:
   <!--SLOTS{...extracted values as JSON...}SLOTS-->

   Even if only one field was mentioned, OUTPUT THE SLOTS BLOCK. This is how the system remembers information!

SLOT UPDATE FORMAT (example - include any fields the user mentioned):
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
    lowerMessage.includes('perfect') ||
    lowerMessage.includes('ready') ||
    lowerMessage.includes("let's go") ||
    lowerMessage.includes('do it') ||
    lowerMessage.includes('sure') ||
    lowerMessage.includes('ok') ||
    lowerMessage.includes('okay');

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
  const startTime = Date.now();
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

    // Log incoming request for debugging
    const requestSlotProgress = calculateSlotProgress(slots);
    console.log('[chat/v2] Request received:', {
      conversationState,
      slotsProgress: `${requestSlotProgress.filled}/${requestSlotProgress.total}`,
      hasGeneratedTrip: !!generatedTrip,
      destination: generatedTrip?.metadata?.destination || slots.destination,
      userMessage: latestMessage.substring(0, 50),
    });

    // Validate request
    if (!sessionId || !slots || !conversationState || !latestMessage) {
      return NextResponse.json(
        { error: 'Invalid request: sessionId, slots, conversationState, and latestMessage required' },
        { status: 400 }
      );
    }

    // Fix corrupted state: if in 'refining' but no valid itinerary, reset to 'generating'
    let effectiveState = conversationState;
    let effectiveTrip = generatedTrip;
    const hasValidItinerary = generatedTrip?.itinerary && generatedTrip.itinerary.length > 0;

    if (conversationState === 'refining' && !hasValidItinerary) {
      console.log('[chat/v2] Corrupted state detected: refining without valid itinerary. Resetting to generating.');
      effectiveState = 'generating';
      effectiveTrip = undefined;
    }

    // Build system prompt based on current state
    const systemPrompt = buildSystemPrompt(slots, effectiveState, effectiveTrip);

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

    // Use higher token limit for generating state (full itinerary needs more tokens)
    const maxTokens = effectiveState === 'generating' ? 8192 : settings.maxTokens;

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
        max_tokens: maxTokens,
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

    // Log usage data from Deepseek for debugging
    console.log('[chat/v2] Deepseek usage:', {
      hasUsage: !!data.usage,
      usage: data.usage,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    });

    if (!assistantMessage) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Extract slots from response
    const extractedSlots = extractSlotsFromResponse(assistantMessage);
    const updatedSlots = extractedSlots ? mergeSlots(slots, extractedSlots) : slots;

    // Debug logging for slot extraction
    const hasSlotsBlock = assistantMessage.includes('<!--SLOTS');
    console.log('[chat/v2] Slot extraction:', {
      hasSlotsBlock,
      extractedSlots: extractedSlots ? Object.keys(extractedSlots) : 'none',
      updatedSlotsCount: Object.values(updatedSlots).filter(v => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)).length,
    });

    // Extract generated trip if in generating or refining state
    // In generating: creates new trip, in refining: updates existing trip
    let newGeneratedTrip = effectiveTrip;
    if (effectiveState === 'generating' || effectiveState === 'refining') {
      const extracted = extractGeneratedTrip(assistantMessage);
      if (extracted) {
        newGeneratedTrip = extracted;
        console.log('[chat/v2] Extracted trip from AI response in', effectiveState, 'state');
      }
    }

    // Ensure we always return the existing trip if we have one (and it's valid)
    if (!newGeneratedTrip && effectiveTrip && effectiveTrip.itinerary?.length > 0) {
      newGeneratedTrip = effectiveTrip;
      console.log('[chat/v2] Preserving existing generated trip');
    }

    // Determine next state
    const newState = determineNextState(
      effectiveState,
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

    // Log response metrics for debugging
    console.log('[chat/v2] Response aiMetrics:', {
      tokensUsed,
      promptTokens,
      completionTokens,
      cost: cost.toFixed(6),
    });

    // Log metrics to database for analytics (non-blocking)
    logChatMetrics({
      sessionId,
      model: 'deepseek-chat',
      provider: 'deepseek',
      promptTokens,
      completionTokens,
      totalTokens: tokensUsed,
      cost,
      conversationState: newState,
      slotsFilled: slotProgress.filled,
      slotsTotal: slotProgress.total,
      responseTimeMs: Date.now() - startTime,
      tripGenerated: !!newGeneratedTrip,
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('Chat V2 API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
