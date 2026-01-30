'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Edit3,
  Check,
  X,
  Plus,
  Trash2,
  Share2,
  Save,
  Users,
  Utensils,
  Camera,
  Moon,
  Coffee,
  Sun,
  Sunset,
  LogIn,
  Copy,
  CheckCircle,
  Hotel,
  Plane,
  Car,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  Baby,
  GripVertical,
  ChevronRight,
  ExternalLink,
  Star,
  Loader2,
} from 'lucide-react';

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

interface Traveler {
  id: string;
  name: string;
  age: number;
  isChild: boolean;
  email?: string;
  phone?: string;
}

interface SelectedHotels {
  [day: number]: HotelResult;
}

interface ItineraryDisplayProps {
  itinerary: ItineraryDay[];
  travelers: Traveler[];
  destination?: string;
  duration?: string;
  budget?: string;
  selectedHotels?: SelectedHotels;
  onItineraryChange?: (itinerary: ItineraryDay[]) => void;
  onTravelersChange?: (travelers: Traveler[]) => void;
  onHotelSelect?: (day: number, hotel: HotelResult | null) => void;
  onSave?: () => void;
  onShare?: () => void;
  onLogin?: () => void;
  isLoggedIn?: boolean;
  isSaving?: boolean;
  shareUrl?: string;
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

interface DayHotels {
  day: number;
  location: string;
  hotels: HotelResult[];
  loading: boolean;
}

const BUDGET_OPTIONS = [
  { value: 'budget', label: 'Budget', icon: '💰' },
  { value: 'moderate', label: 'Moderate', icon: '💵' },
  { value: 'comfortable', label: 'Comfortable', icon: '💎' },
  { value: 'luxury', label: 'Luxury', icon: '👑' },
];

const PRICE_LABELS = ['Free', '$', '$$', '$$$', '$$$$'];

export default function ItineraryDisplay({
  itinerary,
  travelers,
  destination,
  duration,
  budget = 'moderate',
  selectedHotels = {},
  onItineraryChange,
  onTravelersChange,
  onHotelSelect,
  onSave,
  onShare,
  onLogin,
  isLoggedIn = false,
  isSaving = false,
  shareUrl,
}: ItineraryDisplayProps) {
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ItineraryActivity>>({});
  const [showAddTraveler, setShowAddTraveler] = useState(false);
  const [newTraveler, setNewTraveler] = useState({ name: '', age: '', email: '', phone: '' });
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());
  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [showHotels, setShowHotels] = useState(false);
  const [showFloatingCost, setShowFloatingCost] = useState(false);
  const costSummaryRef = useRef<HTMLDivElement>(null);
  const [selectedBudget, setSelectedBudget] = useState(budget);
  const [dayHotels, setDayHotels] = useState<DayHotels[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [expandedHotelDay, setExpandedHotelDay] = useState<number | null>(null);

  // Scroll detection for floating cost summary
  useEffect(() => {
    const handleScroll = () => {
      if (costSummaryRef.current) {
        const rect = costSummaryRef.current.getBoundingClientRect();
        // Show floating card when the main card scrolls out of view
        setShowFloatingCost(rect.bottom < 80);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get primary location for each day from activities
  const getDayLocation = (day: ItineraryDay): string => {
    // Find first activity with a location, or use destination
    const activityWithLocation = day.activities.find(a => a.location);
    if (activityWithLocation?.location) {
      return activityWithLocation.location;
    }
    return destination || '';
  };

  // Fetch hotels when showHotels is toggled or budget changes
  useEffect(() => {
    if (!showHotels) return;

    const fetchHotelsForDays = async () => {
      setLoadingHotels(true);

      const newDayHotels: DayHotels[] = [];

      for (const day of itinerary) {
        const location = getDayLocation(day) || destination || '';
        if (!location) continue;

        try {
          const res = await fetch(
            `/api/hotels/search?location=${encodeURIComponent(location)}&budget=${selectedBudget}`
          );
          const data = await res.json();

          newDayHotels.push({
            day: day.day,
            location,
            hotels: data.hotels || [],
            loading: false,
          });
        } catch (error) {
          newDayHotels.push({
            day: day.day,
            location,
            hotels: [],
            loading: false,
          });
        }
      }

      setDayHotels(newDayHotels);
      setLoadingHotels(false);

      // Auto-expand first day
      if (newDayHotels.length > 0) {
        setExpandedHotelDay(newDayHotels[0].day);
      }
    };

    fetchHotelsForDays();
  }, [showHotels, selectedBudget, itinerary, destination]);

  // Calculate total cost
  const totalCost = itinerary.reduce((total, day) => {
    return total + day.activities.reduce((dayTotal, activity) => {
      return dayTotal + (activity.cost || 0);
    }, 0);
  }, 0);

  // Itemized costs by category
  const costsByCategory = itinerary.reduce((acc, day) => {
    day.activities.forEach(activity => {
      if (activity.cost) {
        acc[activity.type] = (acc[activity.type] || 0) + activity.cost;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'food': return 'Food & Dining';
      case 'transport': return 'Transportation';
      case 'accommodation': return 'Accommodation';
      case 'nightlife': return 'Nightlife';
      default: return 'Activities';
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'food': return <Utensils className="w-4 h-4" />;
      case 'transport': return <Car className="w-4 h-4" />;
      case 'accommodation': return <Hotel className="w-4 h-4" />;
      case 'nightlife': return <Moon className="w-4 h-4" />;
      default: return <Camera className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'food': return 'bg-rose-500';
      case 'transport': return 'bg-blue-500';
      case 'accommodation': return 'bg-violet-500';
      case 'nightlife': return 'bg-purple-500';
      default: return 'bg-amber-500';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'food': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'transport': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'accommodation': return 'bg-violet-100 text-violet-600 border-violet-200';
      case 'nightlife': return 'bg-purple-100 text-purple-600 border-purple-200';
      default: return 'bg-amber-100 text-amber-600 border-amber-200';
    }
  };

  const getTimeIcon = (time: string) => {
    const hour = parseInt(time);
    if (time.toLowerCase().includes('am') || (hour >= 6 && hour < 12)) return <Coffee className="w-3.5 h-3.5" />;
    if (hour >= 12 && hour < 17) return <Sun className="w-3.5 h-3.5" />;
    if (hour >= 17 && hour < 21) return <Sunset className="w-3.5 h-3.5" />;
    return <Moon className="w-3.5 h-3.5" />;
  };

  const handleEditActivity = (dayIndex: number, activityIndex: number) => {
    const activity = itinerary[dayIndex].activities[activityIndex];
    setEditingActivity(`${dayIndex}-${activityIndex}`);
    setEditValues(activity);
  };

  const handleSaveEdit = (dayIndex: number, activityIndex: number) => {
    const newItinerary = [...itinerary];
    newItinerary[dayIndex].activities[activityIndex] = {
      ...newItinerary[dayIndex].activities[activityIndex],
      ...editValues,
    };
    onItineraryChange?.(newItinerary);
    setEditingActivity(null);
    setEditValues({});
  };

  const handleDeleteActivity = (dayIndex: number, activityIndex: number) => {
    const newItinerary = [...itinerary];
    newItinerary[dayIndex].activities.splice(activityIndex, 1);
    onItineraryChange?.(newItinerary);
  };

  const handleAddDay = () => {
    const newDay: ItineraryDay = {
      day: itinerary.length + 1,
      title: `Day ${itinerary.length + 1}`,
      activities: [],
    };
    onItineraryChange?.([...itinerary, newDay]);
  };

  const handleAddActivity = (dayIndex: number) => {
    const newActivity: ItineraryActivity = {
      id: Date.now().toString(),
      time: '12:00 PM',
      title: 'New Activity',
      type: 'activity',
      cost: 0,
    };
    const newItinerary = [...itinerary];
    newItinerary[dayIndex].activities.push(newActivity);
    onItineraryChange?.(newItinerary);
  };

  const handleAddTraveler = () => {
    if (!newTraveler.name || !newTraveler.age) return;
    const age = parseInt(newTraveler.age);
    const traveler: Traveler = {
      id: Date.now().toString(),
      name: newTraveler.name,
      age,
      isChild: age < 12,
      email: newTraveler.email || undefined,
      phone: newTraveler.phone || undefined,
    };
    onTravelersChange?.([...travelers, traveler]);
    setNewTraveler({ name: '', age: '', email: '', phone: '' });
    setShowAddTraveler(false);
  };

  const toggleDayCollapse = (dayIndex: number) => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  };

  const handleDayDragStart = (e: React.DragEvent, dayIndex: number) => {
    setDraggedDay(dayIndex);
    setDragOverDay(dayIndex);
    // Set drag image opacity
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDayDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    if (draggedDay === null) return;

    // Update the dragOver position to show where card will land
    if (dragOverDay !== dayIndex) {
      setDragOverDay(dayIndex);
    }
  };

  const handleDayDragEnd = () => {
    // Apply the reorder when drag ends
    if (draggedDay !== null && dragOverDay !== null && draggedDay !== dragOverDay) {
      const newItinerary = [...itinerary];
      const [draggedItem] = newItinerary.splice(draggedDay, 1);
      newItinerary.splice(dragOverDay, 0, draggedItem);

      // Renumber the days
      const renumbered = newItinerary.map((day, idx) => ({
        ...day,
        day: idx + 1,
      }));

      onItineraryChange?.(renumbered);
    }

    setDraggedDay(null);
    setDragOverDay(null);
  };

  const handleDayDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Drop is handled in dragEnd for smoother UX
  };

  // Calculate visual order during drag
  const getVisualIndex = (actualIndex: number): number => {
    if (draggedDay === null || dragOverDay === null) return actualIndex;
    if (actualIndex === draggedDay) return dragOverDay;

    if (draggedDay < dragOverDay) {
      // Dragging down: items between shift up
      if (actualIndex > draggedDay && actualIndex <= dragOverDay) {
        return actualIndex - 1;
      }
    } else {
      // Dragging up: items between shift down
      if (actualIndex >= dragOverDay && actualIndex < draggedDay) {
        return actualIndex + 1;
      }
    }
    return actualIndex;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRemoveTraveler = (id: string) => {
    onTravelersChange?.(travelers.filter(t => t.id !== id));
  };

  const handleCopyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const adults = travelers.filter(t => !t.isChild);
  const children = travelers.filter(t => t.isChild);

  // Calculate cost breakdown percentages for visual bar
  const totalForBar = Object.values(costsByCategory).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-600 via-teal-700 to-gray-100">
      {/* Floating Minimized Cost Summary - Left Side */}
      <div
        className={`fixed top-20 left-4 z-40 transition-all duration-300 ease-out ${
          showFloatingCost
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold text-gray-900">${totalCost.toFixed(0)}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span className="font-medium text-gray-700">{itinerary.length}d</span>
            </div>
            {travelers.length > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-xs">👤</span>
                  <span className="font-medium text-gray-700">{adults.length}</span>
                </div>
                {children.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs">👶</span>
                    <span className="font-medium text-gray-700">{children.length}</span>
                  </div>
                )}
              </>
            )}
          </div>
          {travelers.length > 0 && (
            <>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-xs text-gray-500">
                ${(totalCost / travelers.length).toFixed(0)}/person
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hero Header with Cost Summary */}
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Title & Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="text-white">
              <div className="flex items-center gap-2 text-teal-200 text-sm mb-2">
                <Sparkles className="w-4 h-4" />
                <span>AI-Generated Itinerary</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {destination ? `Your ${destination} Adventure` : 'Your Trip Itinerary'}
              </h1>
              <p className="text-teal-100">
                {itinerary.length} days • {itinerary.reduce((sum, d) => sum + d.activities.length, 0)} activities
                {travelers.length > 0 && ` • ${travelers.length} travelers`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-teal-700 rounded-xl hover:bg-teal-50 disabled:opacity-50 transition-all font-semibold shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={onShare}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-all font-semibold shadow-lg"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </>
              ) : (
                <button
                  onClick={onLogin}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-teal-700 rounded-xl hover:bg-teal-50 transition-all font-semibold shadow-lg"
                >
                  <LogIn className="w-4 h-4" />
                  Login to Save
                </button>
              )}
            </div>
          </div>

          {/* Share URL */}
          {shareUrl && (
            <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 flex items-center gap-3">
              <Share2 className="w-5 h-5 text-white flex-shrink-0" />
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-white text-sm truncate placeholder-white/50"
              />
              <button
                onClick={handleCopyShareUrl}
                className="flex items-center gap-1 px-4 py-2 bg-white text-teal-700 rounded-lg text-sm font-semibold hover:bg-teal-50 transition-colors"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {/* Beautiful Cost Summary Card */}
          <div ref={costSummaryRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Main Cost Display */}
            <div className="p-6 bg-gradient-to-r from-teal-600 to-cyan-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-teal-100 text-sm font-medium mb-1">Estimated Total Cost</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">${totalCost.toFixed(0)}</span>
                    {travelers.length > 0 && (
                      <span className="text-teal-100 text-lg">
                        (${(totalCost / travelers.length).toFixed(0)}/person)
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{itinerary.length}</p>
                    <p className="text-teal-100 text-sm">Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{travelers.length || '—'}</p>
                    <p className="text-teal-100 text-sm">Travelers</p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown Bar */}
              {Object.keys(costsByCategory).length > 0 && (
                <div className="mt-6">
                  <div className="flex h-3 rounded-full overflow-hidden bg-white/20">
                    {Object.entries(costsByCategory).map(([type, cost], idx) => (
                      <div
                        key={type}
                        className={`${getCategoryColor(type)} transition-all`}
                        style={{ width: `${(cost / totalForBar) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cost Breakdown Details */}
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(costsByCategory).map(([type, cost]) => (
                <div key={type} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${getActivityColor(type)} flex items-center justify-center`}>
                    {getCategoryIcon(type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 truncate leading-tight">{getCategoryLabel(type)}</p>
                    <p className="font-bold text-gray-900 text-sm">${cost.toFixed(0)}</p>
                  </div>
                </div>
              ))}

              {/* Travelers Card */}
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setShowAddTraveler(true)}
              >
                {/* Card content */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-dashed border-teal-200 group-hover:border-teal-400 group-hover:from-teal-100 group-hover:to-cyan-100 transition-all">
                  {travelers.length > 0 ? (
                    <>
                      {/* Adults section */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                          {adults.slice(0, 2).map((adult) => (
                            <div
                              key={adult.id}
                              className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-[9px] font-bold border-2 border-white shadow-sm"
                              title={adult.name}
                            >
                              {getInitials(adult.name)}
                            </div>
                          ))}
                          {adults.length > 2 && (
                            <div className="w-7 h-7 rounded-full bg-teal-200 flex items-center justify-center text-teal-700 text-[9px] font-bold border-2 border-white">
                              +{adults.length - 2}
                            </div>
                          )}
                        </div>
                        <div className="text-xs leading-tight">
                          <span className="font-bold text-teal-700">{adults.length}</span>
                          <span className="text-teal-600 ml-0.5">adult{adults.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-5 w-px bg-teal-200" />

                      {/* Kids section */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                          <span className="text-xs">👶</span>
                        </div>
                        <div className="text-xs leading-tight">
                          <span className="font-bold text-amber-700">{children.length}</span>
                          <span className="text-amber-600 ml-0.5">kid{children.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-sm">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <span className="text-teal-600">Add</span>
                        <span className="font-bold text-teal-700 ml-1">travelers</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Plus icon outside card */}
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Travelers Modal */}
          {showAddTraveler && (
            <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Manage Travelers
                </h3>
                <button onClick={() => setShowAddTraveler(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Existing Travelers */}
              {travelers.length > 0 && (
                <div className="space-y-2 mb-4">
                  {travelers.map((traveler) => (
                    <div key={traveler.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                        traveler.isChild
                          ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                          : 'bg-gradient-to-br from-teal-500 to-cyan-500'
                      }`}>
                        {traveler.isChild ? '👶' : getInitials(traveler.name)}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{traveler.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            {traveler.age}y {traveler.isChild ? '(Child)' : ''}
                          </span>
                        </div>
                        {(traveler.email || traveler.phone) && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {traveler.email && <span>{traveler.email}</span>}
                            {traveler.phone && <span>{traveler.phone}</span>}
                          </div>
                        )}
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveTraveler(traveler.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Traveler Form */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Name *"
                    value={newTraveler.name}
                    onChange={(e) => setNewTraveler({ ...newTraveler, name: e.target.value })}
                    className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Age *"
                    value={newTraveler.age}
                    onChange={(e) => setNewTraveler({ ...newTraveler, age: e.target.value })}
                    className="w-20 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newTraveler.email}
                    onChange={(e) => setNewTraveler({ ...newTraveler, email: e.target.value })}
                    className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={newTraveler.phone}
                    onChange={(e) => setNewTraveler({ ...newTraveler, phone: e.target.value })}
                    className="w-36 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                  />
                </div>
                <button
                  onClick={handleAddTraveler}
                  disabled={!newTraveler.name || !newTraveler.age}
                  className="w-full py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add Traveler
                </button>
              </div>
            </div>
          )}

          {/* Hotel Suggestions - By Day */}
          <div className="mb-6">
            <button
              onClick={() => setShowHotels(!showHotels)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Hotel className="w-6 h-6 text-violet-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">Where to Stay</h3>
                  <p className="text-sm text-gray-500">Hotels by day based on your itinerary locations</p>
                </div>
              </div>
              {showHotels ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {showHotels && (
              <div className="mt-3 bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Budget Filter */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-2">Filter by budget preference</p>
                  <div className="flex gap-2 flex-wrap">
                    {BUDGET_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedBudget(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedBudget === opt.value
                            ? 'bg-violet-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
                        }`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loading State */}
                {loadingHotels && (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Finding hotels near your destinations...</p>
                  </div>
                )}

                {/* Hotels by Day */}
                {!loadingHotels && dayHotels.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {dayHotels.map((dayData) => (
                      <div key={dayData.day}>
                        {/* Day Header */}
                        <button
                          onClick={() => setExpandedHotelDay(expandedHotelDay === dayData.day ? null : dayData.day)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm font-bold ${
                              selectedHotels[dayData.day] ? 'bg-green-600' : 'bg-violet-600'
                            }`}>
                              {selectedHotels[dayData.day] ? '✓' : dayData.day}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900">Day {dayData.day}</p>
                              {selectedHotels[dayData.day] ? (
                                <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                  <Hotel className="w-3 h-3" />
                                  {selectedHotels[dayData.day].name}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {dayData.location}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedHotels[dayData.day] ? (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                Hotel selected
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">{dayData.hotels.length} options</span>
                            )}
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedHotelDay === dayData.day ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </button>

                        {/* Hotels for this day */}
                        {expandedHotelDay === dayData.day && (
                          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {dayData.hotels.map((hotel) => {
                              const isSelected = selectedHotels[dayData.day]?.placeId === hotel.placeId;
                              return (
                                <div
                                  key={hotel.placeId}
                                  className={`p-4 rounded-xl border-2 transition-all ${
                                    isSelected
                                      ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                                      : 'border-gray-100 bg-gray-50 hover:border-violet-200 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-1">
                                      {isSelected && (
                                        <span className="text-xs px-2 py-0.5 bg-violet-600 text-white rounded-full font-medium">
                                          ✓ Selected
                                        </span>
                                      )}
                                      {hotel.priceLevel !== undefined && !isSelected && (
                                        <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">
                                          {PRICE_LABELS[hotel.priceLevel] || '$'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-500">
                                      <Star className="w-3 h-3 fill-current" />
                                      <span className="text-xs font-medium">{hotel.rating.toFixed(1)}</span>
                                      <span className="text-xs text-gray-400">({hotel.userRatingsTotal})</span>
                                    </div>
                                  </div>
                                  <h4 className={`font-semibold mb-1 ${isSelected ? 'text-violet-700' : 'text-gray-900'}`}>
                                    {hotel.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 mb-3 line-clamp-1">{hotel.vicinity}</p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => onHotelSelect?.(dayData.day, isSelected ? null : hotel)}
                                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isSelected
                                          ? 'bg-violet-200 text-violet-700 hover:bg-violet-300'
                                          : 'bg-violet-600 text-white hover:bg-violet-700'
                                      }`}
                                    >
                                      {isSelected ? 'Deselect' : 'Select'}
                                    </button>
                                    <a
                                      href={hotel.mapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                      title="View on Google Maps"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                            {dayData.hotels.length === 0 && (
                              <div className="col-span-2 text-center py-4 text-gray-500 text-sm">
                                No hotels found for this location
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* No hotels found */}
                {!loadingHotels && dayHotels.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Hotel className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No destinations found in your itinerary</p>
                    <p className="text-xs text-gray-400 mt-1">Add locations to your activities to see hotel suggestions</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Itinerary Days */}
          <div className="space-y-4">
            {itinerary.map((day, dayIndex) => {
              const isCollapsed = collapsedDays.has(dayIndex);
              const isDragging = draggedDay === dayIndex;
              const showDropBefore = draggedDay !== null && dragOverDay === dayIndex && draggedDay > dayIndex;
              const showDropAfter = draggedDay !== null && dragOverDay === dayIndex && draggedDay < dayIndex;

              return (
                <div key={day.day}>
                  {/* Drop zone indicator - before */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-out ${
                      showDropBefore ? 'h-16 mb-3' : 'h-0'
                    }`}
                  >
                    <div className="h-full rounded-2xl border-2 border-dashed border-teal-400 bg-teal-50/50 flex items-center justify-center">
                      <span className="text-teal-500 text-sm font-medium">Drop here</span>
                    </div>
                  </div>

                  {/* Day Card */}
                  <div
                    draggable
                    onDragStart={(e) => handleDayDragStart(e, dayIndex)}
                    onDragOver={(e) => handleDayDragOver(e, dayIndex)}
                    onDrop={handleDayDrop}
                    onDragEnd={handleDayDragEnd}
                    className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-150 ${
                      isDragging ? 'opacity-40 scale-[0.98] ring-2 ring-teal-400 shadow-2xl' : ''
                    }`}
                  >
                    {/* Day Header - Click to collapse */}
                    <div
                      className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-100 cursor-pointer select-none"
                      onClick={() => toggleDayCollapse(dayIndex)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Drag Handle */}
                          <div
                            className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>
                          {/* Day Number */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                            {day.day}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">Day {day.day}</h3>
                            <p className="text-sm text-teal-600">{day.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{day.activities.length} activities</p>
                            <p className="font-bold text-teal-600">
                              ${day.activities.reduce((sum, a) => sum + (a.cost || 0), 0).toFixed(0)}
                            </p>
                          </div>
                          {/* Collapse Toggle */}
                          <div className={`p-2 rounded-lg bg-gray-100 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}>
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Activities - Collapsible */}
                    <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0' : 'max-h-[2000px]'}`}>
                      <div className="p-4 space-y-3">
                        {day.activities.map((activity, activityIndex) => {
                          const isEditing = editingActivity === `${dayIndex}-${activityIndex}`;

                          return (
                            <div
                              key={activity.id || activityIndex}
                              className={`group relative p-4 rounded-xl border-2 transition-all ${
                                isEditing
                                  ? 'border-teal-400 bg-teal-50'
                                  : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                              }`}
                            >
                              {isEditing ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      value={editValues.time || ''}
                                      onChange={(e) => setEditValues({ ...editValues, time: e.target.value })}
                                      placeholder="Time (e.g., 9:00 AM)"
                                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                    />
                                    <div className="relative">
                                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="number"
                                        value={editValues.cost || ''}
                                        onChange={(e) => setEditValues({ ...editValues, cost: parseFloat(e.target.value) || 0 })}
                                        placeholder="Cost"
                                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    value={editValues.title || ''}
                                    onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                                    placeholder="Activity title"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                  />
                                  <select
                                    value={editValues.type || 'activity'}
                                    onChange={(e) => setEditValues({ ...editValues, type: e.target.value as any })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                  >
                                    <option value="activity">Activity</option>
                                    <option value="food">Food & Dining</option>
                                    <option value="transport">Transport</option>
                                    <option value="accommodation">Accommodation</option>
                                    <option value="nightlife">Nightlife</option>
                                  </select>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveEdit(dayIndex, activityIndex)}
                                      className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center justify-center gap-1"
                                    >
                                      <Check className="w-4 h-4" />
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingActivity(null)}
                                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 flex items-center justify-center gap-1"
                                    >
                                      <X className="w-4 h-4" />
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  {/* Activity Icon */}
                                  <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${getActivityColor(activity.type)} flex items-center justify-center border`}>
                                    {getCategoryIcon(activity.type)}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                      {getTimeIcon(activity.time)}
                                      <span className="font-medium">{activity.time}</span>
                                      {activity.location && (
                                        <>
                                          <MapPin className="w-3.5 h-3.5 ml-2" />
                                          <span className="truncate">{activity.location}</span>
                                        </>
                                      )}
                                    </div>
                                    <p className="font-semibold text-gray-900">{activity.title}</p>
                                    {activity.description && (
                                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{activity.description}</p>
                                    )}
                                  </div>

                                  {/* Cost Badge - Always visible on right */}
                                  <div className="flex-shrink-0 text-right">
                                    {activity.cost !== undefined && activity.cost > 0 ? (
                                      <div className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg font-bold">
                                        ${activity.cost}
                                      </div>
                                    ) : (
                                      <div className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm">
                                        Free
                                      </div>
                                    )}
                                  </div>

                                  {/* Edit/Delete Actions */}
                                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleEditActivity(dayIndex, activityIndex)}
                                      className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteActivity(dayIndex, activityIndex)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add Activity Button */}
                        <button
                          onClick={() => handleAddActivity(dayIndex)}
                          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Activity
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Drop zone indicator - after */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-out ${
                      showDropAfter ? 'h-16 mt-3' : 'h-0'
                    }`}
                  >
                    <div className="h-full rounded-2xl border-2 border-dashed border-teal-400 bg-teal-50/50 flex items-center justify-center">
                      <span className="text-teal-500 text-sm font-medium">Drop here</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Day Button */}
            <button
              onClick={handleAddDay}
              className="w-full py-5 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-teal-400 hover:text-teal-600 hover:bg-white transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Another Day
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
