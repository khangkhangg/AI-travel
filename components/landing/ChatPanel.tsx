'use client';

import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';

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

interface ChatPanelProps {
  initialPrompt?: string;
  onItineraryGenerated?: (itinerary: ItineraryDay[]) => void;
  onConversationStart?: () => void;
  onContextUpdate?: (context: TripContext) => void;
}

const smartTags = [
  { label: '+1 day', icon: Plus, color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' },
  { label: '-1 day', icon: Minus, color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
  { label: 'More food', icon: Utensils, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  { label: 'Sightseeing', icon: Camera, color: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
  { label: 'Swap days', icon: RefreshCw, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { label: 'Weather plan', icon: Sun, color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' },
];

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

      // Extract cost from title (patterns like "$25", "$25 per person", "($50)")
      let cost: number | undefined;
      const costMatch = title.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (costMatch) {
        cost = parseFloat(costMatch[1].replace(',', ''));
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
  const allText = messages.map(m => m.content).join(' ').toLowerCase();

  // Extract destination
  const destMatch = allText.match(/(?:to|visit|in|going to)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|!|\?|for|with|\s+is)/i);
  if (destMatch) context.destination = destMatch[1].trim();

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

  // Extract budget
  const budgetMatch = allText.match(/\$\s*(\d+[\d,]*)/);
  if (budgetMatch) context.budget = budgetMatch[0];

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
    suggestions.push({ label: 'Who\'s going?', prompt: 'How many people are traveling?', icon: '👥' });
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

export default function ChatPanel({ initialPrompt, onItineraryGenerated, onConversationStart, onContextUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your travel planning assistant. Tell me about your dream trip, or pick a destination to get started!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'itinerary' | 'packages'>('chat');
  const [tripContext, setTripContext] = useState<TripContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get dynamic suggestion prompts based on missing info
  const suggestionPrompts = getMissingSuggestions(tripContext, itinerary !== null && itinerary.length > 0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

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

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
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
          const newMessages = [...prev, assistantMessage];
          // Update context based on conversation
          const context = extractTripContext(newMessages);
          setTripContext(context);
          onContextUpdate?.(context);
          return newMessages;
        });

        // Parse itinerary from response
        const parsedItinerary = parseItineraryFromResponse(data.message);
        if (parsedItinerary.length > 0) {
          setItinerary(parsedItinerary);
          // Stay on chat tab - don't auto-switch to itinerary
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
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {[
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'itinerary', label: 'Itinerary', icon: Calendar, badge: itinerary?.length },
          { id: 'packages', label: 'Packages', icon: Package },
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
                    <p className="text-sm leading-relaxed">{message.content}</p>
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

            {/* Smart Suggestions - show missing info prompts first, then quick actions */}
            <div className="px-4 py-3 border-t border-gray-100">
              {suggestionPrompts.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Help me plan better:</p>
                  <div className="flex gap-2 flex-wrap">
                    {suggestionPrompts.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(suggestion.prompt)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 text-teal-700 text-xs font-medium hover:from-teal-100 hover:to-cyan-100 transition-all"
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
                      onClick={() => handleSendMessage(tag.label)}
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about your trip..."
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-teal-300 focus:bg-white focus:outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim()}
                  className="px-4 py-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="h-full overflow-y-auto p-4">
            {itinerary && itinerary.length > 0 ? (
              <div className="space-y-5">
                {itinerary.map((day) => (
                  <div key={day.day}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                        {day.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-gray-900">Day {day.day}</span>
                        {day.title && (
                          <p className="text-sm text-teal-600 truncate">{day.title}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-teal-100 pl-4 space-y-2">
                      {day.activities.map((activity, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                        >
                          <div className={`w-7 h-7 rounded-lg flex-shrink-0 ${getActivityColor(activity.type)} flex items-center justify-center`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{activity.time}</span>
                            </div>
                            <p className="font-medium text-sm text-gray-800">{activity.title}</p>
                            {activity.description && (
                              <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                            )}
                          </div>
                          {activity.cost && (
                            <div className="flex items-center gap-1 text-xs text-teal-600 font-semibold flex-shrink-0">
                              <DollarSign className="w-3 h-3" />
                              {activity.cost}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-teal-500" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">No itinerary yet</h4>
                <p className="text-sm text-gray-500 max-w-[200px]">
                  Start chatting to generate your personalized trip plan
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-3">
              {[
                { title: 'Fushimi Inari Sunrise Tour', provider: 'Kyoto Local Guides', rating: 4.9, reviews: 234, price: 45, image: '🎌' },
                { title: 'Traditional Tea Ceremony', provider: 'Camellia Garden', rating: 4.8, reviews: 189, price: 35, image: '🍵' },
                { title: 'Arashiyama Bamboo + Monkey Park', provider: 'Kyoto Adventures', rating: 4.7, reviews: 412, price: 67, image: '🎋' },
              ].map((pkg, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center text-2xl">
                      {pkg.image}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900">{pkg.title}</h4>
                      <p className="text-xs text-gray-500">{pkg.provider}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-amber-500">★ {pkg.rating}</span>
                        <span className="text-xs text-gray-400">({pkg.reviews})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-700">${pkg.price}</p>
                      <p className="text-xs text-gray-500">per person</p>
                    </div>
                  </div>
                  <button className="w-full mt-3 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-sm font-semibold text-teal-700 transition-colors">
                    Add to Day 2
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
