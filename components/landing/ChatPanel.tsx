'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Bot,
  User,
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Minus,
  RefreshCw,
  Utensils,
  Camera,
  Sun,
  ChevronRight,
  Package,
  Maximize2,
  Minimize2,
  MessageSquare,
  Sparkles,
  Moon,
  Hotel,
  Star,
  MapPin,
  Users,
} from 'lucide-react';
import TourBrowser from '@/components/tours/TourBrowser';
import { Tour } from '@/lib/types/tour';
import {
  TripSlots,
  ConversationState,
  ChatSession,
  GeneratedTrip,
  getEmptySlots,
  createEmptyChatSession,
} from '@/lib/types/chat-session';
import { saveSession, loadSession, clearSession } from '@/lib/chat/session-storage';
import SlotProgressBar from './SlotProgressBar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ItineraryActivity {
  id?: string;
  time: string;
  title: string;
  type: 'activity' | 'food' | 'transport' | 'accommodation' | 'nightlife';
  description?: string;
  cost?: number;
  location?: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  date?: string;
  activities: ItineraryActivity[];
}

interface TripContext {
  destination?: string;
  duration?: string;
  travelType?: string[];
  budget?: string;
  travelers?: number;
  adults?: number;
  children?: number;
  childrenAges?: number[];
  travelMethod?: string;
  locationPreference?: string;
}

interface HotelResult {
  placeId: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number;
  vicinity: string;
  photos?: string[];
  location: { lat: number; lng: number };
  types: string[];
  mapsUrl: string;
}

interface SelectedHotels {
  [day: number]: HotelResult;
}

export interface AIMetrics {
  model: string;
  provider: string;
  tokensUsed: number;
  cost: number;
  responseCount: number;
}

interface ChatPanelProps {
  initialPrompt?: string;
  initialMessages?: Message[];
  parentItinerary?: ItineraryDay[];
  selectedHotels?: SelectedHotels;
  onItineraryGenerated?: (itinerary: ItineraryDay[]) => void;
  onConversationStart?: () => void;
  onContextUpdate?: (context: TripContext) => void;
  onMessagesChange?: (messages: Message[]) => void;
  onAIMetricsUpdate?: (metrics: AIMetrics) => void;
  packagesTabEnabled?: boolean;
  tripDetailsEnabled?: boolean;
  triggerCommand?: 'location' | 'duration' | 'budget' | 'travelers' | null;
  onTriggerCommandHandled?: () => void;
}

const smartTags = [
  { label: '1 day', icon: Plus, color: 'bg-teal-100 text-teal-700 hover:bg-teal-200', needsInput: true, placeholder: 'What activities to add? e.g., beach day, city tour, rest day', prefix: 'Add one more day to the trip with: ' },
  { label: '1 day', icon: Minus, color: 'bg-rose-100 text-rose-700 hover:bg-rose-200', needsInput: true, placeholder: 'Which day to remove? e.g., day 3, or the shopping day', prefix: 'Remove from the itinerary: ' },
  { label: 'More food', icon: Utensils, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200', needsInput: true, placeholder: 'What cuisine? e.g., local street food, fine dining, seafood', prefix: 'Add more food experiences to the trip: ' },
  { label: 'Sightseeing', icon: Camera, color: 'bg-violet-100 text-violet-700 hover:bg-violet-200', needsInput: true, placeholder: 'What to see? e.g., historical sites, viewpoints, landmarks', prefix: 'Add more sightseeing activities: ' },
  { label: 'Swap days', icon: RefreshCw, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200', needsInput: true, placeholder: 'e.g., swap day 2 with day 3, or move beach day to day 1', prefix: 'Please adjust the itinerary: ' },
  { label: 'Weather plan', icon: Sun, color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200', needsInput: true, placeholder: 'Weather concern? e.g., rainy day backup, too hot, indoor alternatives', prefix: 'Adjust the plan for weather: ' },
];

// Strip hidden TRIP_DATA metadata from AI responses before display
function stripHiddenMetadata(content: string): string {
  return content.replace(/<!--TRIP_DATA[\s\S]*?TRIP_DATA-->/g, '').trim();
}

// Check if an activity is actually a cost summary item (not a real activity)
function isCostSummaryItem(time: string, title: string): boolean {
  const lowerTime = time.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Patterns that indicate this is a summary/budget item, not an actual activity
  const summaryPatterns = [
    /accommodation\s*\(\d+\s*nights?\)/i,
    /food\s*[&and]*\s*drink\s*\(\d+\s*days?\)/i,
    /activities\s*\([^)]+\)/i,
    /local\s*transport/i,
    /miscellaneous/i,
    /souvenirs/i,
    /estimated\s*total/i,
    /budget\s*breakdown/i,
    /total\s*cost/i,
    /per\s*person\s*cost/i,
    /family\s*of\s*\d+/i,
  ];

  const combinedText = `${lowerTime} ${lowerTitle}`;
  return summaryPatterns.some(pattern => pattern.test(combinedText));
}

// Convert GeneratedTrip (v2 API format) to ItineraryDay[] for display
function convertGeneratedTripToItinerary(trip: GeneratedTrip): ItineraryDay[] {
  if (!trip || !trip.itinerary || !Array.isArray(trip.itinerary)) {
    return [];
  }

  return trip.itinerary.map((day) => ({
    day: day.dayNumber,
    title: `Day ${day.dayNumber} in ${trip.metadata?.destination || 'your destination'}`,
    activities: (day.items || []).map((item) => ({
      time: item.startTime || '',
      title: item.title || '',
      price: item.estimatedCost ? `$${item.estimatedCost}` : '',
      description: item.description || '',
      place: item.location?.name || item.location?.address || '',
    })),
  }));
}

// Parse itinerary from AI response markdown
function parseItineraryFromResponse(response: string): ItineraryDay[] {
  const days: ItineraryDay[] = [];

  // Match day patterns like "**Day 1: Title**" or "Day 1: Title"
  const dayRegex = /\*?\*?Day\s*(\d+)[:\s]*([^\*\n]+)\*?\*?/gi;
  const dayMatches = [...response.matchAll(dayRegex)];

  if (dayMatches.length === 0) return [];

  dayMatches.forEach((match, index) => {
    const dayNum = parseInt(match[1]);
    const dayTitle = match[2].trim().replace(/\*+/g, '');
    const startIdx = match.index! + match[0].length;
    const endIdx = index < dayMatches.length - 1 ? dayMatches[index + 1].index! : response.length;
    const dayContent = response.slice(startIdx, endIdx);

    const activities: ItineraryActivity[] = [];

    // Match activity patterns like "* **Morning:** Description" or "* **2:00 PM:** Activity"
    const activityRegex = /\*\s*\*?\*?([^:*\n]+)\*?\*?:\s*\*?\*?([^\n]+)/g;
    const activityMatches = [...dayContent.matchAll(activityRegex)];

    activityMatches.forEach((actMatch) => {
      const timeOrPeriod = actMatch[1].trim();
      let title = actMatch[2].trim().replace(/\*+/g, '');

      // Skip cost summary items - they're not real activities
      if (isCostSummaryItem(timeOrPeriod, title)) {
        return;
      }

      // Extract cost from title - improved logic
      let cost: number | undefined;

      // First, look for explicit "Total for day: ~$X" or "Total: $X" patterns (total before amount)
      const totalBeforeMatch = title.match(/total(?:\s+for\s+day)?[:\s]*~?\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      if (totalBeforeMatch) {
        cost = parseFloat(totalBeforeMatch[1].replace(',', ''));
      } else {
        // Check for "~$X total" pattern (amount before total)
        const totalAfterMatch = title.match(/~?\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*total/i);
        if (totalAfterMatch) {
          // This is just a single item total, look for other costs in the string
          // Find all dollar amounts and sum them (excluding the "X total" part)
          const allCosts = [...title.matchAll(/(?<!~)\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g)];
          if (allCosts.length > 1) {
            // Sum all found costs except ones followed by "total"
            const cleanTitle = title.replace(/~?\$\d+(?:,\d{3})*(?:\.\d{2})?\s*total/gi, '');
            const remainingCosts = [...cleanTitle.matchAll(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g)];
            if (remainingCosts.length > 0) {
              cost = remainingCosts.reduce((sum, match) => sum + parseFloat(match[1].replace(',', '')), 0);
            }
          }
          if (cost === undefined) {
            cost = parseFloat(totalAfterMatch[1].replace(',', ''));
          }
        } else {
          // No total pattern found - sum all dollar amounts
          const allCosts = [...title.matchAll(/~?\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g)];
          if (allCosts.length > 0) {
            cost = allCosts.reduce((sum, match) => sum + parseFloat(match[1].replace(',', '')), 0);
          }
        }
      }

      // Determine activity type
      let type: 'activity' | 'food' | 'transport' | 'accommodation' | 'nightlife' = 'activity';
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('dinner') || lowerTitle.includes('lunch') || lowerTitle.includes('breakfast') ||
          lowerTitle.includes('food') || lowerTitle.includes('restaurant') || lowerTitle.includes('eat') ||
          lowerTitle.includes('café') || lowerTitle.includes('cafe') || lowerTitle.includes('coffee')) {
        type = 'food';
      } else if (lowerTitle.includes('check-in') || lowerTitle.includes('hotel') || lowerTitle.includes('accommodation') ||
                 lowerTitle.includes('stay') || lowerTitle.includes('resort')) {
        type = 'accommodation';
      } else if (lowerTitle.includes('arrive') || lowerTitle.includes('depart') || lowerTitle.includes('flight') ||
                 lowerTitle.includes('train') || lowerTitle.includes('drive') || lowerTitle.includes('transfer') ||
                 lowerTitle.includes('airport') || lowerTitle.includes('cable car')) {
        type = 'transport';
      } else if (lowerTitle.includes('bar') || lowerTitle.includes('pub') || lowerTitle.includes('club') ||
                 lowerTitle.includes('nightlife') || lowerTitle.includes('night market') || lowerTitle.includes('evening') ||
                 lowerTitle.includes('rooftop') || lowerTitle.includes('live music')) {
        type = 'nightlife';
      }

      // Clean up title - remove markdown links, cost info, and extra formatting
      title = title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*+/g, '').trim();
      // Remove cost from display title (it's now in the cost field)
      title = title.replace(/\s*\(\$[\d,]+(?:\.\d{2})?\s*(?:per person)?\)/gi, '').trim();
      title = title.replace(/\s*-\s*\$[\d,]+(?:\.\d{2})?\s*(?:per person)?$/gi, '').trim();
      if (title.length > 100) title = title.slice(0, 100) + '...';

      activities.push({
        time: timeOrPeriod,
        title: title,
        type: type,
        cost: cost,
      });
    });

    if (activities.length > 0) {
      days.push({
        day: dayNum,
        title: dayTitle,
        activities: activities,
      });
    }
  });

  return days;
}

// Extract trip context from conversation
function extractTripContext(messages: Message[]): TripContext {
  const context: TripContext = {};

  // First, try to parse structured TRIP_DATA from AI responses (most reliable)
  // Look for the hidden metadata block that AI includes in responses
  for (const msg of [...messages].reverse()) {
    if (msg.role === 'assistant') {
      const tripDataMatch = msg.content.match(/<!--TRIP_DATA\n([\s\S]*?)\nTRIP_DATA-->/);
      if (tripDataMatch) {
        const dataBlock = tripDataMatch[1];

        // Parse destination
        const destMatch = dataBlock.match(/destination:\s*(.+)/i);
        if (destMatch && destMatch[1].trim()) {
          context.destination = destMatch[1].trim();
        }

        // Parse duration
        const durMatch = dataBlock.match(/duration:\s*(.+)/i);
        if (durMatch && durMatch[1].trim()) {
          context.duration = durMatch[1].trim();
        }

        // Parse budget
        const budgetMatch = dataBlock.match(/budget:\s*(.+)/i);
        if (budgetMatch && budgetMatch[1].trim()) {
          context.budget = budgetMatch[1].trim();
        }

        // Parse travelers
        const travelersMatch = dataBlock.match(/travelers:\s*(\d+)/i);
        if (travelersMatch) {
          context.travelers = parseInt(travelersMatch[1]);
        }

        // If we found structured data, use it as the primary source
        if (context.destination || context.duration || context.budget || context.travelers) {
          break;
        }
      }
    }
  }

  // Fallback: extract from conversation text if no structured data found
  const allText = messages.map(m => m.content).join(' ').toLowerCase();

  // Common phrases that should NOT be detected as destinations
  const excludedPhrases = [
    'get started', 'start', 'begin', 'help', 'know', 'see', 'go', 'do',
    'plan', 'travel', 'visit somewhere', 'somewhere', 'anywhere', 'explore',
    'the world', 'your trip', 'my trip', 'a trip', 'this trip', 'our trip',
    'you', 'me', 'us', 'them', 'it', 'that', 'this', 'here', 'there',
  ];

  // If no destination from structured data, try regex patterns
  if (!context.destination) {
    const destPatterns = [
      // AI response patterns
      /(?:trip to|itinerary for|planning for|welcome to|exploring|adventure in|visiting)\s+([a-z][a-z\s]{2,25}?)(?:\.|,|!|\?|for|with|and|\s+is|\s*$)/i,
      // User input patterns
      /(?:to|visit|in|going to|explore|see|travel to)\s+([a-z][a-z\s]{2,25}?)(?:\.|,|!|\?|for|with|and|\s+is|\s*$)/i,
      // "I want [destination]" or "let's go [destination]"
      /(?:i want|let's go|take me to|show me)\s+([a-z][a-z\s]{2,25}?)(?:\.|,|!|\?|$)/i,
    ];

    for (const pattern of destPatterns) {
      const destMatch = allText.match(pattern);
      if (destMatch) {
        const potentialDest = destMatch[1].trim().toLowerCase();
        if (!excludedPhrases.some(phrase => potentialDest === phrase || potentialDest.startsWith(phrase + ' '))) {
          context.destination = potentialDest.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          break;
        }
      }
    }
  }

  // Extract duration
  const durationMatch = allText.match(/(\d+)\s*(?:day|night)/i);
  if (durationMatch) context.duration = `${durationMatch[1]} days`;

  // Extract travel type
  const types: string[] = [];
  if (allText.includes('family') || allText.includes('kid') || allText.includes('children')) types.push('family');
  if (allText.includes('food') || allText.includes('culinary') || allText.includes('restaurant')) types.push('food');
  if (allText.includes('adventure') || allText.includes('hiking')) types.push('adventure');
  if (allText.includes('beach') || allText.includes('tropical')) types.push('beach');
  if (allText.includes('culture') || allText.includes('museum') || allText.includes('history')) types.push('culture');
  if (types.length > 0) context.travelType = types;

  // Extract budget - prioritize "estimated total" or "total cost" patterns from AI
  const totalPatterns = [
    /estimated\s+total[:\s]*\$?\s*(\d+[\d,]*)/i,
    /total\s+(?:cost|budget|estimate)[:\s]*\$?\s*(\d+[\d,]*)/i,
    /budget[:\s]*\$?\s*(\d+[\d,]*)/i,
    /\$\s*(\d+[\d,]*)\s*(?:total|estimated|budget)/i,
  ];

  for (const pattern of totalPatterns) {
    const match = allText.match(pattern);
    if (match) {
      context.budget = `$${match[1]}`;
      break;
    }
  }

  // Fallback: any dollar amount if no total pattern found
  if (!context.budget) {
    const budgetMatch = allText.match(/\$\s*(\d+[\d,]*)/);
    if (budgetMatch) context.budget = budgetMatch[0];
  }

  // Extract number of travelers
  const travelersMatch = allText.match(/(\d+)\s*(?:people|person|travelers|traveler)/i);
  if (travelersMatch) context.travelers = parseInt(travelersMatch[1]);

  // Extract adults
  const adultsMatch = allText.match(/(\d+)\s*adult/i);
  if (adultsMatch) context.adults = parseInt(adultsMatch[1]);

  // Extract children
  const childrenMatch = allText.match(/(\d+)\s*(?:child|children|kid)/i);
  if (childrenMatch) context.children = parseInt(childrenMatch[1]);

  // Extract travel method
  if (allText.includes('fly') || allText.includes('flight') || allText.includes('plane')) {
    context.travelMethod = 'flight';
  } else if (allText.includes('drive') || allText.includes('car') || allText.includes('road trip')) {
    context.travelMethod = 'car';
  } else if (allText.includes('train')) {
    context.travelMethod = 'train';
  }

  // Extract location preference
  if (allText.includes('city center') || allText.includes('downtown')) {
    context.locationPreference = 'city center';
  } else if (allText.includes('near beach') || allText.includes('beachfront')) {
    context.locationPreference = 'beachfront';
  } else if (allText.includes('quiet') || allText.includes('peaceful') || allText.includes('secluded')) {
    context.locationPreference = 'quiet area';
  }

  return context;
}

// Generate suggestion prompts based on missing context
function getMissingSuggestions(context: TripContext, hasItinerary: boolean): { label: string; prompt: string; icon: string }[] {
  const suggestions: { label: string; prompt: string; icon: string }[] = [];

  if (!context.destination) {
    suggestions.push({ label: 'Where to?', prompt: 'Where would you like to go?', icon: '📍' });
  }
  if (!context.duration) {
    suggestions.push({ label: 'How long?', prompt: 'How many days are you planning to travel?', icon: '📅' });
  }
  if (!context.budget) {
    suggestions.push({ label: 'Budget', prompt: 'What\'s your budget for this trip?', icon: '💰' });
  }
  if (!context.travelers && !context.adults) {
    suggestions.push({ label: 'How many people?', prompt: 'How many people are traveling?', icon: '👥' });
  }
  if (context.travelers && !context.adults) {
    suggestions.push({ label: 'Adults?', prompt: 'How many adults in the group?', icon: '🧑' });
  }
  if (context.adults && !context.children && context.children !== 0) {
    suggestions.push({ label: 'Kids?', prompt: 'Any children coming along? If so, what are their ages?', icon: '👶' });
  }
  if (!context.travelMethod) {
    suggestions.push({ label: 'Getting there', prompt: 'How would you prefer to travel there - flight, car, or train?', icon: '✈️' });
  }
  if (!context.locationPreference && hasItinerary) {
    suggestions.push({ label: 'Stay preference', prompt: 'Do you prefer staying in the city center, beachfront, or a quieter area?', icon: '🏨' });
  }

  return suggestions.slice(0, 4); // Max 4 suggestions at a time
}

// Command menu options for "/" trigger
const commandOptions = [
  { id: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" />, placeholder: 'Where do you want to go?', prefix: 'I want to visit ' },
  { id: 'duration', label: 'Duration', icon: <Calendar className="w-4 h-4" />, placeholder: 'How many days?', prefix: "I'm planning a ", suffix: ' day trip' },
  { id: 'budget', label: 'Budget', icon: <DollarSign className="w-4 h-4" />, placeholder: 'What\'s your budget?', prefix: 'My budget is $', adjustPrefix: 'Please adjust the trip plan to fit a budget of $', adjustPlaceholder: 'Enter new budget amount' },
  { id: 'travelers', label: 'Travelers', icon: <Users className="w-4 h-4" />, placeholder: 'How many people?', prefix: "We're ", suffix: ' people traveling' },
];

const DEFAULT_WELCOME_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: "Hi! I'm your travel planning assistant. Tell me about your dream trip, or pick a destination to get started!",
  timestamp: new Date(),
};

export default function ChatPanel({ initialPrompt, initialMessages, parentItinerary, selectedHotels = {}, onItineraryGenerated, onConversationStart, onContextUpdate, onMessagesChange, onAIMetricsUpdate, packagesTabEnabled, tripDetailsEnabled, triggerCommand, onTriggerCommandHandled }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
      : [DEFAULT_WELCOME_MESSAGE]
  );
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'journey' | 'packages'>('chat');
  const [tripContext, setTripContext] = useState<TripContext>({});
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [activeCommand, setActiveCommand] = useState<typeof commandOptions[0] | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [isAdjustingBudget, setIsAdjustingBudget] = useState(false);
  const [activeSmartTag, setActiveSmartTag] = useState<typeof smartTags[0] | null>(null);
  const [smartTagInput, setSmartTagInput] = useState('');
  const [collectedInfo, setCollectedInfo] = useState<{
    location?: string;
    duration?: string;
    budget?: string;
    travelers?: string;
  }>({});
  const [aiMetrics, setAIMetrics] = useState<AIMetrics>({
    model: '',
    provider: '',
    tokensUsed: 0,
    cost: 0,
    responseCount: 0,
  });
  const [showPackagesTab, setShowPackagesTab] = useState(packagesTabEnabled ?? true);
  const [showTripDetails, setShowTripDetails] = useState(tripDetailsEnabled ?? true);

  // Slot-filling state
  const [slots, setSlots] = useState<TripSlots>(() => getEmptySlots());
  const [conversationState, setConversationState] = useState<ConversationState>('gathering');
  const [generatedTrip, setGeneratedTrip] = useState<GeneratedTrip | null>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [useV2Api, setUseV2Api] = useState(true); // Feature flag to switch between APIs

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandMenuRef = useRef<HTMLDivElement>(null);

  // Get dynamic suggestion prompts based on missing info
  // Filter out suggestions that duplicate the command options (Location, Duration, Budget, Travelers)
  const suggestionPrompts = getMissingSuggestions(tripContext, itinerary !== null && itinerary.length > 0)
    .filter(s => {
      // Don't show "Where to?" - we already have "Location" tag in command options
      if (s.label === 'Where to?') return false;
      // Don't show "How long?" - we already have "Duration" tag in command options
      if (s.label === 'How long?') return false;
      // Don't show "Budget" - we already have "Budget" tag in command options
      if (s.label === 'Budget') return false;
      // Don't show "How many people?" - we already have "Travelers" tag in command options
      if (s.label === 'How many people?') return false;
      return true;
    });

  // Handle input change - detect "/" for command menu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value === '/') {
      setShowCommandMenu(true);
      setActiveCommand(null);
      setCommandInput('');
    } else if (value.startsWith('/') && !activeCommand) {
      // Filter commands based on typed text after /
      const searchTerm = value.slice(1).toLowerCase();
      const matchedCommand = commandOptions.find(cmd =>
        cmd.label.toLowerCase().startsWith(searchTerm) ||
        cmd.id.toLowerCase().startsWith(searchTerm)
      );
      if (matchedCommand && value.toLowerCase() === `/${matchedCommand.id}`) {
        selectCommand(matchedCommand);
      }
    } else if (!value.startsWith('/') && showCommandMenu && !activeCommand) {
      setShowCommandMenu(false);
    }
  };

  // Select a command from the menu
  const selectCommand = (command: typeof commandOptions[0]) => {
    setActiveCommand(command);
    setInput('');
    setCommandInput('');
    // Check if budget is being adjusted (already has a value)
    if (command.id === 'budget' && (collectedInfo.budget || tripContext.budget)) {
      setIsAdjustingBudget(true);
    } else {
      setIsAdjustingBudget(false);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Cancel command mode
  const cancelCommand = () => {
    setShowCommandMenu(false);
    setActiveCommand(null);
    setInput('');
    setCommandInput('');
    setIsAdjustingBudget(false);
  };

  // Handle smart tag click
  const handleSmartTagClick = (tag: typeof smartTags[0]) => {
    if ('needsInput' in tag && tag.needsInput) {
      // Enter input mode for this tag
      setActiveSmartTag(tag);
      setSmartTagInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Direct send
      handleSendMessage(tag.label);
    }
  };

  // Submit smart tag with user input
  const submitSmartTag = () => {
    if (!activeSmartTag || !smartTagInput.trim()) return;

    const tag = activeSmartTag as any;
    const message = tag.prefix
      ? tag.prefix + smartTagInput.trim()
      : `${tag.label}: ${smartTagInput.trim()}`;

    setActiveSmartTag(null);
    setSmartTagInput('');
    handleSendMessage(message);
  };

  // Cancel smart tag input
  const cancelSmartTag = () => {
    setActiveSmartTag(null);
    setSmartTagInput('');
  };

  // Submit command value
  const submitCommand = () => {
    if (!activeCommand || !commandInput.trim()) return;

    // Store collected info
    setCollectedInfo(prev => ({
      ...prev,
      [activeCommand.id]: activeCommand.id === 'budget' ? `$${commandInput.trim()}` : commandInput.trim()
    }));

    // Build message from command
    let message: string;
    if (isAdjustingBudget && activeCommand.id === 'budget' && 'adjustPrefix' in activeCommand) {
      // Use adjust prefix for budget changes
      message = (activeCommand as any).adjustPrefix + commandInput.trim();
    } else {
      message = activeCommand.prefix + commandInput.trim();
      if (activeCommand.suffix) message += activeCommand.suffix;
    }

    // Reset command state
    setShowCommandMenu(false);
    setActiveCommand(null);
    setCommandInput('');
    setInput('');
    setIsAdjustingBudget(false);

    // Send the message
    handleSendMessage(message);
  };

  // Handle keyboard navigation in command menu
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (activeCommand || showCommandMenu) {
        cancelCommand();
        e.preventDefault();
      }
    } else if (e.key === 'Enter') {
      if (activeCommand && commandInput.trim()) {
        submitCommand();
        e.preventDefault();
      } else if (showCommandMenu && !activeCommand) {
        // Select first matching command
        const searchTerm = input.slice(1).toLowerCase();
        const matchedCommand = commandOptions.find(cmd =>
          !searchTerm || cmd.label.toLowerCase().includes(searchTerm) || cmd.id.includes(searchTerm)
        );
        if (matchedCommand) {
          selectCommand(matchedCommand);
          e.preventDefault();
        }
      } else if (!showCommandMenu && input.trim()) {
        handleSendMessage();
      }
    } else if (e.key === 'Backspace' && activeCommand && !commandInput) {
      // Go back to command selection
      setActiveCommand(null);
      setInput('/');
      e.preventDefault();
    }
  };

  // Handle AI suggestion selection - fills trip details
  const handleAISuggestionSelect = (opt: { label: string; value: string; type: 'option' | 'suggested' }) => {
    // Check if this is a destination/location option
    const isDestination = opt.type === 'option' ||
      opt.label === 'Recommended' ||
      /^(Option|Recommended)/i.test(opt.label);

    if (isDestination) {
      // Fill the location field with this destination
      setCollectedInfo(prev => ({
        ...prev,
        location: opt.value
      }));
      // Also send a message to continue the conversation
      handleSendMessage(`I'd like to go with ${opt.value}`);
    } else if (opt.value.toLowerCase().includes('day') || opt.value.toLowerCase().includes('itinerary')) {
      // This is a duration/itinerary suggestion - extract days if present
      const daysMatch = opt.value.match(/(\d+)[\s-]*day/i);
      if (daysMatch) {
        setCollectedInfo(prev => ({
          ...prev,
          duration: `${daysMatch[1]} days`
        }));
      }
      handleSendMessage(`Yes, let's go with the ${opt.value}`);
    } else {
      // Generic suggestion - just send the message
      handleSendMessage(`Tell me more about ${opt.value}`);
    }
  };

  // Check which info is filled
  const getFilledInfo = () => {
    const filled: { id: string; label: string; value: string }[] = [];

    if (collectedInfo.location || tripContext.destination) {
      filled.push({
        id: 'location',
        label: 'Location',
        value: collectedInfo.location || tripContext.destination || '',
      });
    }
    if (collectedInfo.duration || tripContext.duration) {
      filled.push({
        id: 'duration',
        label: 'Duration',
        value: collectedInfo.duration || tripContext.duration || '',
      });
    }
    if (collectedInfo.budget || tripContext.budget) {
      filled.push({
        id: 'budget',
        label: 'Budget',
        value: collectedInfo.budget || tripContext.budget || '',
      });
    }
    if (collectedInfo.travelers || tripContext.travelers) {
      filled.push({
        id: 'travelers',
        label: 'Travelers',
        value: collectedInfo.travelers || (tripContext.travelers ? `${tripContext.travelers} people` : ''),
      });
    }

    return filled;
  };

  const filledInfo = getFilledInfo();

  // Extract options/suggestions from AI messages
  const extractOptionsFromMessages = (): { label: string; value: string; type: 'option' | 'suggested' }[] => {
    const options: { label: string; value: string; type: 'option' | 'suggested' }[] = [];

    // Get the last assistant message
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMessage) return options;

    const content = lastAssistantMessage.content;

    // Match "Option N: Title" patterns (e.g., "Option 1: Phuket & The Phi Phi Islands")
    const optionMatches = [...content.matchAll(/\*?\*?Option\s*(\d+)[:\s]*\*?\*?\s*([^\n*]+)/gi)];
    for (const match of optionMatches) {
      const title = match[2].trim().replace(/\*+/g, '').trim();
      if (title && title.length > 2 && title.length < 60) {
        options.push({
          label: `Option ${match[1]}`,
          value: title,
          type: 'option'
        });
      }
    }

    // Match lettered options like "A. Destination" or "**A. Destination**"
    const letteredMatches = [...content.matchAll(/\*?\*?([A-C])\.\s*\*?\*?\s*([A-Z][a-zA-Z\s,&()]+?)(?:\*?\*?)(?:\n|$)/g)];
    for (const match of letteredMatches) {
      const letter = match[1];
      const title = match[2].trim().replace(/\*+/g, '').trim();
      if (title && title.length > 2 && title.length < 60) {
        // Convert letter to number for Option label
        const optionNum = letter.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
        options.push({
          label: `Option ${optionNum}`,
          value: title,
          type: 'option'
        });
      }
    }

    // Match "Suggested X:" patterns (e.g., "Suggested 7-Day Itinerary:")
    const suggestedMatches = [...content.matchAll(/\*?\*?Suggested\s+([^\n:]+):/gi)];
    for (const match of suggestedMatches) {
      const title = match[1].trim().replace(/\*+/g, '').trim();
      if (title && title.length > 2 && title.length < 40) {
        options.push({
          label: 'Suggested',
          value: title,
          type: 'suggested'
        });
      }
    }

    // Match recommendation patterns like "I'd recommend X or Y"
    const recommendMatches = [...content.matchAll(/(?:I'd|I would|we)\s*recommend\s+\*?\*?([A-Z][a-zA-Z\s]+?)(?:\*?\*?)(?:\s+or\s+\*?\*?([A-Z][a-zA-Z\s]+?)\*?\*?)?(?:\.|,|!)/gi)];
    for (const match of recommendMatches) {
      const place1 = match[1].trim().replace(/\*+/g, '');
      if (place1 && place1.length > 2 && place1.length < 40) {
        options.push({
          label: 'Recommended',
          value: place1,
          type: 'suggested'
        });
      }
      if (match[2]) {
        const place2 = match[2].trim().replace(/\*+/g, '');
        if (place2 && place2.length > 2 && place2.length < 40) {
          options.push({
            label: 'Recommended',
            value: place2,
            type: 'suggested'
          });
        }
      }
    }

    // Deduplicate by value
    const seen = new Set<string>();
    return options.filter(opt => {
      const key = opt.value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 4); // Max 4 options
  };

  const extractedOptions = extractOptionsFromMessages();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load saved session on mount
  useEffect(() => {
    const savedSession = loadSession();
    if (savedSession) {
      setSlots(savedSession.slots);

      // If session has a generated trip, check if it has valid itinerary data
      if (savedSession.generatedTrip) {
        const restoredItinerary = convertGeneratedTripToItinerary(savedSession.generatedTrip);
        if (restoredItinerary.length > 0) {
          // Valid itinerary exists - restore everything
          setConversationState(savedSession.conversationState);
          setGeneratedTrip(savedSession.generatedTrip);
          setItinerary(restoredItinerary);
          console.log('[ChatPanel] Restored itinerary from session:', restoredItinerary.length, 'days');
          onItineraryGenerated?.(restoredItinerary);
        } else {
          // Corrupted state: has generatedTrip metadata but no actual itinerary
          // Clear the trip and reset to 'ready' state so user can regenerate
          console.log('[ChatPanel] Corrupted session: generatedTrip exists but no itinerary data. Resetting to ready state.');
          setGeneratedTrip(null);
          // If all slots are filled, go to 'ready' state, otherwise 'gathering'
          const filledSlots = Object.values(savedSession.slots).filter(v => v !== null && v !== '').length;
          setConversationState(filledSlots >= 7 ? 'ready' : 'gathering');
        }
      } else {
        // No generated trip - restore normally
        setConversationState(savedSession.conversationState);
        setGeneratedTrip(null);
      }

      if (savedSession.lastMessages.length > 0) {
        setMessages(savedSession.lastMessages);
      }
    }
  }, []);

  // Fetch chatbox settings from public API if not provided as props
  useEffect(() => {
    // If both props are provided, use them directly
    if (packagesTabEnabled !== undefined && tripDetailsEnabled !== undefined) {
      setShowPackagesTab(packagesTabEnabled);
      setShowTripDetails(tripDetailsEnabled);
      return;
    }

    const fetchSettings = async () => {
      try {
        // Use public endpoint (no auth required) instead of admin endpoint
        const response = await fetch('/api/settings/public');
        if (response.ok) {
          const data = await response.json();
          // Only update from API if prop wasn't provided
          if (packagesTabEnabled === undefined) {
            setShowPackagesTab(data.packagesTabEnabled ?? true);
          }
          if (tripDetailsEnabled === undefined) {
            setShowTripDetails(data.tripDetailsEnabled ?? true);
          }
        }
      } catch {
        // If fetch fails, keep defaults (true)
      }
    };
    fetchSettings();
  }, [packagesTabEnabled, tripDetailsEnabled]);

  // Notify parent when messages change (for saving to database)
  useEffect(() => {
    if (onMessagesChange && messages.length > 1) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  // Sync collected info from trip context (smart detection from messages)
  useEffect(() => {
    if (tripContext.destination && !collectedInfo.location) {
      setCollectedInfo(prev => ({ ...prev, location: tripContext.destination }));
    }
    if (tripContext.duration && !collectedInfo.duration) {
      setCollectedInfo(prev => ({ ...prev, duration: tripContext.duration }));
    }
    if (tripContext.budget && !collectedInfo.budget) {
      setCollectedInfo(prev => ({ ...prev, budget: tripContext.budget }));
    }
    if (tripContext.travelers && !collectedInfo.travelers) {
      setCollectedInfo(prev => ({ ...prev, travelers: `${tripContext.travelers} people` }));
    }
  }, [tripContext, collectedInfo]);

  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // Handle external trigger to activate a command (e.g., from "Start Planning" button)
  useEffect(() => {
    if (triggerCommand) {
      const cmd = commandOptions.find(c => c.id === triggerCommand);
      if (cmd) {
        // Switch to chat tab first
        setActiveTab('chat');
        // Then activate the command
        selectCommand(cmd);
        // Notify parent that we handled the trigger
        onTriggerCommandHandled?.();
      }
    }
  }, [triggerCommand, onTriggerCommandHandled]);

  // Parse initial messages to restore trip context and itinerary when resuming
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      // Extract trip context from loaded messages
      const context = extractTripContext(messages);
      setTripContext(context);
      onContextUpdate?.(context);

      // Try to parse itinerary from the last assistant message
      for (const msg of [...messages].reverse()) {
        if (msg.role === 'assistant') {
          const parsedItinerary = parseItineraryFromResponse(msg.content);
          if (parsedItinerary.length > 0) {
            setItinerary(parsedItinerary);
            onItineraryGenerated?.(parsedItinerary);
            break;
          }
        }
      }
    }
  }, []); // Only run once on mount

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    // Notify parent that conversation has started
    if (messages.length <= 1) {
      onConversationStart?.();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      if (useV2Api) {
        // Use slot-based v2 API
        console.log('[ChatPanel v2] Sending request:', {
          conversationState,
          hasGeneratedTrip: !!generatedTrip,
          slotsFilledCount: Object.values(slots).filter(v => v !== null && v !== '').length,
        });
        const response = await fetch('/api/chat/v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: crypto.randomUUID(), // or use a stored session ID
            slots,
            conversationState,
            latestMessage: messageText,
            generatedTrip,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[ChatPanel v2] Response received:', {
            newState: data.newState,
            hasGeneratedTrip: !!data.generatedTrip,
            itineraryDays: data.generatedTrip?.itinerary?.length || 0,
            slotProgress: data.slotProgress,
          });

          // Update slots and state
          setSlots(data.updatedSlots);
          setConversationState(data.newState);
          if (data.generatedTrip) {
            setGeneratedTrip(data.generatedTrip);
          }

          // Determine active slot from missing slots
          if (data.slotProgress.missing.length > 0) {
            setActiveSlot(data.slotProgress.missing[0]);
          } else {
            setActiveSlot(null);
          }

          // Add assistant message
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          };
          const updatedMessages = [...newMessages, assistantMessage];
          setMessages(updatedMessages);

          // Update context based on conversation
          const context = extractTripContext(updatedMessages);
          setTripContext(context);
          onContextUpdate?.(context);

          // Auto-save session - preserve existing generatedTrip if API doesn't return one
          const tripToSave = data.generatedTrip || generatedTrip || null;
          saveSession({
            sessionId: crypto.randomUUID(),
            slots: data.updatedSlots,
            conversationState: data.newState,
            lastMessages: updatedMessages.slice(-5), // Keep last 5 messages
            generatedTrip: tripToSave,
            updatedAt: Date.now(),
          });

          // Update AI metrics - use functional update pattern like v1 to avoid stale closure
          if (data.aiMetrics) {
            console.log('[ChatPanel v2] aiMetrics received:', data.aiMetrics);
            setAIMetrics((prev) => {
              const updated = {
                model: data.aiMetrics.model || prev.model,
                provider: data.aiMetrics.provider || prev.provider,
                tokensUsed: prev.tokensUsed + (data.aiMetrics.tokensUsed || 0),
                cost: prev.cost + (data.aiMetrics.cost || 0),
                responseCount: prev.responseCount + 1,
              };
              console.log('[ChatPanel v2] Updated metrics:', updated);
              // Notify parent if callback exists
              onAIMetricsUpdate?.(updated);
              return updated;
            });
          } else {
            console.warn('[ChatPanel v2] No aiMetrics in response');
          }

          // Convert generated trip to itinerary format if available
          // Otherwise fall back to parsing markdown from message
          let parsedItinerary: ItineraryDay[] = [];
          if (data.generatedTrip) {
            parsedItinerary = convertGeneratedTripToItinerary(data.generatedTrip);
            console.log('[ChatPanel v2] Converted generatedTrip to itinerary:', parsedItinerary.length, 'days');
          } else {
            parsedItinerary = parseItineraryFromResponse(data.message);
            console.log('[ChatPanel v2] Parsed itinerary from message:', parsedItinerary.length, 'days');
          }

          if (parsedItinerary.length > 0) {
            setItinerary(parsedItinerary);
            console.log('[ChatPanel v2] Calling onItineraryGenerated');
            onItineraryGenerated?.(parsedItinerary);
          }
        } else {
          // Fallback to v1 API if v2 fails
          console.warn('[ChatPanel] v2 API failed, falling back to v1');
          throw new Error('v2 API failed');
        }
      } else {
        // Existing v1 API logic
        // Prepare conversation history for API
        const conversationHistory = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: conversationHistory }),
        });

        const data = await response.json();

        if (response.ok && data.message) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          };
          setMessages((prev) => {
            const newMsgs = [...prev, assistantMessage];
            // Update context based on conversation
            const context = extractTripContext(newMsgs);
            setTripContext(context);
            onContextUpdate?.(context);
            return newMsgs;
          });

          // Update AI metrics from response (wrapped in try/catch to not break itinerary flow)
          try {
            if (data.aiMetrics) {
              setAIMetrics((prev) => {
                const updated = {
                  model: data.aiMetrics.model || prev.model,
                  provider: data.aiMetrics.provider || prev.provider,
                  tokensUsed: prev.tokensUsed + (data.aiMetrics.tokensUsed || 0),
                  cost: prev.cost + (data.aiMetrics.cost || 0),
                  responseCount: prev.responseCount + 1,
                };
                // Notify parent of metrics update
                onAIMetricsUpdate?.(updated);
                return updated;
              });
            }
          } catch (metricsError) {
            console.error('Error updating AI metrics:', metricsError);
          }

          // Parse itinerary from response
          const parsedItinerary = parseItineraryFromResponse(data.message);
          console.log('[ChatPanel] Parsed itinerary:', parsedItinerary.length, 'days');
          if (parsedItinerary.length > 0) {
            setItinerary(parsedItinerary);
            // Stay on chat tab - don't auto-switch to itinerary
            console.log('[ChatPanel] Calling onItineraryGenerated');
            onItineraryGenerated?.(parsedItinerary);
          }
        } else {
          // Fallback to mock response if API fails
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.error || getAIFallbackResponse(messageText),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIFallbackResponse(messageText),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getAIFallbackResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    if (lower.includes('beach') || lower.includes('tropical')) {
      return "Perfect choice! I'm crafting a beautiful beach itinerary for you. Based on your preferences, I'd recommend Bali or the Maldives. Let me show you a preview...";
    }
    if (lower.includes('food') || lower.includes('culinary')) {
      return "A food-focused adventure! I love it. Japan, Thailand, and Italy are incredible for culinary experiences. Let me build an itinerary that hits all the best spots...";
    }
    if (lower.includes('kyoto') || lower.includes('japan')) {
      return "Kyoto is magical! Cherry blossoms, ancient temples, and incredible cuisine. I've put together a 5-day itinerary covering the highlights. Check the Itinerary tab!";
    }
    return "Great! I'm putting together a personalized itinerary based on your preferences. Here's what I've come up with so far...";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'food': return <Utensils className="w-3.5 h-3.5" />;
      case 'transport': return <ChevronRight className="w-3.5 h-3.5" />;
      case 'accommodation': return <Calendar className="w-3.5 h-3.5" />;
      case 'nightlife': return <Moon className="w-3.5 h-3.5" />;
      default: return <Camera className="w-3.5 h-3.5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'food': return 'bg-rose-100 text-rose-600';
      case 'transport': return 'bg-blue-100 text-blue-600';
      case 'accommodation': return 'bg-violet-100 text-violet-600';
      case 'nightlife': return 'bg-purple-100 text-purple-600';
      default: return 'bg-amber-100 text-amber-600';
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50' : 'h-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Trip Assistant</h3>
            <p className="text-xs text-teal-100">Powered by AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              clearSession();
              setSlots(getEmptySlots());
              setConversationState('gathering');
              setGeneratedTrip(null);
              setMessages([DEFAULT_WELCOME_MESSAGE]);
              setActiveSlot(null);
              setItinerary(null);
              setCollectedInfo({});
              setTripContext({});
            }}
            className="text-xs text-teal-100 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            New Trip
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {[
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'journey', label: 'Your Journey', icon: MapPin, badge: (parentItinerary || itinerary)?.length },
          ...(showPackagesTab ? [{ id: 'packages', label: 'Packages', icon: Package }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-teal-700'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="px-1.5 py-0.5 text-xs bg-teal-600 text-white rounded-full">
                {tab.badge}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Slot Progress Bar - always starts collapsed to not block chat input */}
            {conversationState !== 'refining' && (
              <div className="px-4 pt-4">
                <SlotProgressBar
                  slots={slots}
                  isExpanded={false}
                  activeSlot={activeSlot || undefined}
                />
              </div>
            )}
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    {message.role === 'user' ? (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    ) : (
                      <div className="text-sm leading-relaxed prose prose-sm prose-gray max-w-none
                        prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-2
                        prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                        prose-p:my-1.5 prose-p:text-gray-700
                        prose-strong:text-teal-700 prose-strong:font-semibold
                        prose-ul:my-1.5 prose-ul:pl-4 prose-li:my-0.5
                        prose-ol:my-1.5 prose-ol:pl-4
                        prose-hr:my-3 prose-hr:border-gray-300
                        prose-table:my-2 prose-table:text-xs prose-table:border-collapse
                        prose-th:bg-teal-50 prose-th:text-teal-800 prose-th:px-2 prose-th:py-1 prose-th:border prose-th:border-gray-200 prose-th:font-semibold
                        prose-td:px-2 prose-td:py-1 prose-td:border prose-td:border-gray-200
                        [&>*:first-child]:mt-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{stripHiddenMetadata(message.content)}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-gray-100 rounded-bl-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Smart Suggestions - show trip info status tags */}
            <div className="px-4 py-3 border-t border-gray-100">
              {/* Trip Info Status Tags */}
              {showTripDetails && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Trip details:</p>
                  <div className="flex gap-2 flex-wrap">
                    {commandOptions.map((cmd) => {
                      const filled = filledInfo.find(f => f.id === cmd.id);
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => selectCommand(cmd)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            filled
                              ? 'bg-teal-100 border border-teal-300 text-teal-700'
                              : 'bg-gray-100 border border-gray-200 text-gray-500 hover:bg-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {cmd.icon}
                          {filled ? (
                            <>
                              <span className="truncate max-w-[80px]">
                                {cmd.id === 'budget' ? filled.value.replace(/^\$/, '') : filled.value}
                              </span>
                              <span className="text-teal-500 ml-1">✓</span>
                            </>
                          ) : (
                            <span>{cmd.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Additional suggestion prompts if still missing info */}
              {suggestionPrompts.length > 0 && suggestionPrompts.length < 4 && (
                <div className="mb-2">
                  <div className="flex gap-2 flex-wrap">
                    {suggestionPrompts.slice(0, 2).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(suggestion.prompt)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 text-xs font-medium hover:from-amber-100 hover:to-orange-100 transition-all"
                      >
                        <span className="text-sm">{suggestion.icon}</span>
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {itinerary && itinerary.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {smartTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleSmartTagClick(tag)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${tag.color}`}
                    >
                      <tag.icon className="w-3 h-3" />
                      {tag.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100">
              {/* AI-Extracted Options - Options/Suggestions from AI response */}
              {extractedOptions.length > 0 && !showCommandMenu && !activeCommand && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                    <span>✨</span> AI Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {extractedOptions.map((opt, idx) => (
                      <button
                        key={`${opt.type}-${idx}`}
                        onClick={() => handleAISuggestionSelect(opt)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          opt.type === 'option'
                            ? 'bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 hover:border-violet-300'
                            : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300'
                        }`}
                      >
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/60 font-semibold">
                          {opt.label}
                        </span>
                        <span className="truncate max-w-[120px]">{opt.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Command Menu */}
              {showCommandMenu && !activeCommand && (
                <div
                  ref={commandMenuRef}
                  className="mb-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                >
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Quick commands</p>
                  </div>
                  <div className="p-1">
                    {commandOptions.map((cmd) => {
                      const isFilled = filledInfo.some(f => f.id === cmd.id);
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => selectCommand(cmd)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            isFilled
                              ? 'bg-teal-50 hover:bg-teal-100'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-gray-500">{cmd.icon}</span>
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${isFilled ? 'text-teal-700' : 'text-gray-700'}`}>
                              /{cmd.id}
                            </span>
                            <span className="text-gray-400 ml-2 text-xs">{cmd.placeholder}</span>
                          </div>
                          {isFilled && (
                            <span className="text-teal-600 text-xs font-medium bg-teal-100 px-2 py-0.5 rounded-full">
                              ✓ Set
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400">Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">Esc</kbd> to cancel</p>
                  </div>
                </div>
              )}

              {/* Active Command Input Mode */}
              {activeCommand && (
                <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-xl border border-teal-200">
                  <span className="text-lg">{activeCommand.icon}</span>
                  <span className="text-teal-700 font-medium text-sm">
                    {isAdjustingBudget ? 'Adjust Budget' : activeCommand.label}:
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isAdjustingBudget && 'adjustPlaceholder' in activeCommand ? (activeCommand as any).adjustPlaceholder : activeCommand.placeholder}
                    autoFocus
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-teal-400"
                  />
                  <button
                    onClick={submitCommand}
                    disabled={!commandInput.trim()}
                    className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={cancelCommand}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Smart Tag Input Mode (e.g., Swap days, +1 day, etc.) */}
              {activeSmartTag && (
                <div className={`mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  activeSmartTag.label === '+1 day' ? 'bg-teal-50 border-teal-200' :
                  activeSmartTag.label === '-1 day' ? 'bg-rose-50 border-rose-200' :
                  activeSmartTag.label === 'More food' ? 'bg-amber-50 border-amber-200' :
                  activeSmartTag.label === 'Sightseeing' ? 'bg-violet-50 border-violet-200' :
                  activeSmartTag.label === 'Swap days' ? 'bg-blue-50 border-blue-200' :
                  'bg-cyan-50 border-cyan-200'
                }`}>
                  <activeSmartTag.icon className={`w-4 h-4 ${
                    activeSmartTag.label === '+1 day' ? 'text-teal-600' :
                    activeSmartTag.label === '-1 day' ? 'text-rose-600' :
                    activeSmartTag.label === 'More food' ? 'text-amber-600' :
                    activeSmartTag.label === 'Sightseeing' ? 'text-violet-600' :
                    activeSmartTag.label === 'Swap days' ? 'text-blue-600' :
                    'text-cyan-600'
                  }`} />
                  <span className={`font-medium text-sm ${
                    activeSmartTag.label === '+1 day' ? 'text-teal-700' :
                    activeSmartTag.label === '-1 day' ? 'text-rose-700' :
                    activeSmartTag.label === 'More food' ? 'text-amber-700' :
                    activeSmartTag.label === 'Sightseeing' ? 'text-violet-700' :
                    activeSmartTag.label === 'Swap days' ? 'text-blue-700' :
                    'text-cyan-700'
                  }`}>{activeSmartTag.label}:</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={smartTagInput}
                    onChange={(e) => setSmartTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && smartTagInput.trim()) {
                        submitSmartTag();
                        e.preventDefault();
                      } else if (e.key === 'Escape') {
                        cancelSmartTag();
                        e.preventDefault();
                      }
                    }}
                    placeholder={'placeholder' in activeSmartTag ? (activeSmartTag as any).placeholder : 'Enter details...'}
                    autoFocus
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400"
                  />
                  <button
                    onClick={submitSmartTag}
                    disabled={!smartTagInput.trim()}
                    className={`p-1.5 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      activeSmartTag.label === '+1 day' ? 'bg-teal-600 hover:bg-teal-700' :
                      activeSmartTag.label === '-1 day' ? 'bg-rose-600 hover:bg-rose-700' :
                      activeSmartTag.label === 'More food' ? 'bg-amber-600 hover:bg-amber-700' :
                      activeSmartTag.label === 'Sightseeing' ? 'bg-violet-600 hover:bg-violet-700' :
                      activeSmartTag.label === 'Swap days' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-cyan-600 hover:bg-cyan-700'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={cancelSmartTag}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Regular Input */}
              {!activeCommand && !activeSmartTag && (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder='Type "/" for quick commands or ask anything...'
                      className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-teal-300 focus:bg-white focus:outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
                    />
                    {!input && !showCommandMenu && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400 pointer-events-none">
                        <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] text-gray-500 font-mono">/</kbd>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || showCommandMenu}
                    className="px-4 py-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'journey' && (
          <div className="h-full flex flex-col">
            {/* Use parentItinerary if available, otherwise fall back to internal itinerary */}
            {(() => {
              const displayItinerary = parentItinerary || itinerary;
              return displayItinerary && displayItinerary.length > 0 ? (
                <>
                  {/* Horizontal Scroll Daily View */}
                  <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
                    <div className="flex gap-4 p-4 h-full" style={{ minWidth: 'max-content' }}>
                      {displayItinerary.map((day) => {
                        const selectedHotel = selectedHotels[day.day];
                        return (
                          <div
                            key={day.day}
                            className="w-64 flex-shrink-0 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full"
                          >
                            {/* Day Header */}
                            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4 text-white">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xl font-bold">Day {day.day}</span>
                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                  {day.activities.length} activities
                                </span>
                              </div>
                              <p className="text-sm text-teal-100 truncate">{day.title}</p>
                            </div>

                            {/* Selected Hotel - At the Top */}
                            {selectedHotel ? (
                              <div className="p-3 border-b border-gray-100 bg-violet-50">
                                <div className="flex items-start gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                                    <Hotel className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-violet-600 font-medium mb-0.5">Staying at</p>
                                    <p className="font-semibold text-gray-900 text-sm truncate">{selectedHotel.name}</p>
                                    <div className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                                      <Star className="w-3 h-3 fill-current" />
                                      <span>{selectedHotel.rating.toFixed(1)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Hotel className="w-4 h-4" />
                                  <span className="text-xs">No hotel selected</span>
                                </div>
                              </div>
                            )}

                            {/* Activities */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                              {day.activities.map((activity, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 p-2 rounded-lg bg-white border border-gray-100 hover:border-teal-200 transition-colors"
                                >
                                  <div className={`w-6 h-6 rounded-md flex-shrink-0 ${getActivityColor(activity.type)} flex items-center justify-center`}>
                                    {getActivityIcon(activity.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      {activity.time}
                                    </p>
                                    <p className="font-medium text-xs text-gray-800 line-clamp-2">{activity.title}</p>
                                  </div>
                                  {activity.cost !== undefined && activity.cost > 0 && (
                                    <span className="text-[10px] font-bold text-teal-600">${activity.cost}</span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Day Total */}
                            <div className="p-3 bg-gray-50 border-t border-gray-100">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Day total</span>
                                <span className="font-bold text-teal-600">
                                  ${day.activities.reduce((sum, a) => sum + (a.cost || 0), 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scroll hint */}
                  <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-100">
                    ← Swipe to see all days →
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-teal-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Your journey awaits</h4>
                  <p className="text-sm text-gray-500 max-w-[200px]">
                    Start chatting to plan your personalized trip with hotels and activities
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {showPackagesTab && activeTab === 'packages' && (
          <TourBrowser
            destination={tripContext.destination}
            compact={true}
            onSelectTour={(tour: Tour) => {
              // TODO: Open tour detail modal or navigate to tour page
              console.log('Selected tour:', tour);
            }}
          />
        )}
      </div>
    </div>
  );
}
