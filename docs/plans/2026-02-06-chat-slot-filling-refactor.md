# Chat Slot-Filling Refactor Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the landing page chatbox to use token-efficient slot-filling with auto-save and structured JSON output

**Architecture:** Slot-based information gathering → state machine conversation flow → structured trip generation

**Tech Stack:** Next.js API routes, Deepseek API, localStorage, TypeScript

---

## 1. Slot Structure

```typescript
// lib/types/chat-session.ts

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
  travelStyle: string | null;      // 'adventure' | 'relaxed' | 'cultural' | 'luxury'
  interests: string[];             // ['food', 'temples', 'nightlife']
  accommodationType: string | null; // 'hotel' | 'hostel' | 'airbnb' | 'luxury'

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
```

---

## 2. Conversation State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONVERSATION STATES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  GATHERING  │───▶│   READY     │───▶│ GENERATING  │          │
│  │    INFO     │    │ TO GENERATE │    │    TRIP     │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│        │                  │                   │                  │
│        │                  │                   ▼                  │
│        │                  │            ┌─────────────┐          │
│        │                  │            │  REFINING   │◀─┐       │
│        │                  │            │    TRIP     │──┘       │
│        └──────────────────┴────────────┴─────────────┘          │
│                         (can go back)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| State | Trigger | AI Behavior |
|-------|---------|-------------|
| `gathering` | < 7 slots filled | Ask clarifying questions, extract info |
| `ready` | All 7 slots filled | "I have everything! Ready to create your trip?" |
| `generating` | User confirms | Generate full itinerary JSON |
| `refining` | Trip exists | Make incremental changes |

---

## 3. API Structure

### New Endpoint: `POST /api/chat/v2`

**Request (token-efficient):**
```typescript
{
  sessionId: string;
  slots: TripSlots;
  conversationState: ConversationState;
  latestMessage: string;
  generatedTrip?: GeneratedTrip;
}
```

**Response:**
```typescript
{
  message: string;
  updatedSlots: TripSlots;
  newState: ConversationState;
  generatedTrip?: GeneratedTrip;
  slotProgress: {
    filled: number;
    total: number;
    missing: string[];
  };
}
```

### System Prompt (key parts):
```
You are a travel planning assistant. Your job is to gather trip information
and generate personalized itineraries.

CURRENT STATE: {conversationState}
FILLED SLOTS: {JSON summary of filled slots}
MISSING SLOTS: {list of missing slots}

RULES:
1. In GATHERING state: Ask ONE question at a time to fill missing slots
2. When all slots filled: Say "I have everything I need! Ready to create your trip?"
3. In GENERATING state: Output a JSON itinerary block
4. In REFINING state: Make incremental changes, don't regenerate everything

RESPONSE FORMAT:
- Conversational text for the user
- End with: <!--SLOTS{"destination":"Tokyo",...}SLOTS-->
```

---

## 4. Generated Trip JSON Format

```typescript
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
```

---

## 5. localStorage Session Storage

**Key:** `chatSession`

**Auto-save:** After every AI response

```typescript
// lib/chat/session-storage.ts

const STORAGE_KEY = 'chatSession';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function saveSession(session: ChatSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...session,
    updatedAt: Date.now()
  }));
}

export function loadSession(): ChatSession | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const session = JSON.parse(stored) as ChatSession;
  if (Date.now() - session.updatedAt > SESSION_EXPIRY_MS) {
    clearSession();
    return null;
  }
  return session;
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

---

## 6. UI Progress Indicator

```
┌─────────────────────────────────────────────────────┐
│  Planning your trip...                              │
│                                                     │
│  ✅ Destination      Tokyo, Japan                   │
│  ✅ Dates            Mar 15-20, 2025 (5 days)       │
│  ✅ Budget           $3,000 total                   │
│  ✅ Travelers        2 adults                       │
│  ⬜ Travel style     (asking...)                    │
│  ⬜ Interests                                       │
│  ⬜ Accommodation                                   │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░  4/7 complete     │
└─────────────────────────────────────────────────────┘
```

---

## 7. Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `lib/types/chat-session.ts` | CREATE | TripSlots, ChatSession, GeneratedTrip interfaces |
| `app/api/chat/v2/route.ts` | CREATE | New slot-based chat endpoint |
| `lib/chat/slot-extractor.ts` | CREATE | Extract slot values from AI response |
| `lib/chat/session-storage.ts` | CREATE | localStorage save/load helpers |
| `components/landing/ChatPanel.tsx` | MODIFY | Add progress indicator, use v2 API, auto-save |
| `components/landing/SlotProgressBar.tsx` | CREATE | Visual progress component |
| `app/api/trips/route.ts` | MODIFY | Accept GeneratedTrip JSON format on save |

---

## 8. Implementation Order

### Phase 1: Types & Storage
1. Create `lib/types/chat-session.ts`
2. Create `lib/chat/session-storage.ts`

### Phase 2: API
3. Create `lib/chat/slot-extractor.ts`
4. Create `app/api/chat/v2/route.ts`

### Phase 3: UI Components
5. Create `components/landing/SlotProgressBar.tsx`
6. Modify `components/landing/ChatPanel.tsx`

### Phase 4: Integration
7. Modify `app/api/trips/route.ts` for structured save

---

## 9. Key Benefits

1. **Token-efficient** - Send slots + latest message, not full history
2. **Auto-save every response** - No data loss on refresh
3. **Clear progress** - User sees what info is still needed
4. **Structured output** - Direct mapping to database schema
5. **State machine** - Predictable conversation flow
