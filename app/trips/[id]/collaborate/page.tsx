'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, Users, Plus, Link as LinkIcon, Settings, Calendar, DollarSign,
} from 'lucide-react';
import Header from '@/components/landing/Header';
import KanbanBoard from '@/components/collaborate/KanbanBoard';
import DiscussionSidebar from '@/components/collaborate/DiscussionSidebar';
import CostSummary from '@/components/collaborate/CostSummary';
import AddPlaceModal from '@/components/collaborate/AddPlaceModal';
import TravelersCollaboratorsPopover from '@/components/collaborate/TravelersCollaboratorsPopover';
import { CollaborateTrip, CollaborateActivity, DayData, Traveler, CostBreakdown } from '@/lib/types/collaborate';

export default function CollaboratePage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<CollaborateTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [addToDay, setAddToDay] = useState<number>(1);
  const [addCategory, setAddCategory] = useState<string>('attraction');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [editingTimes, setEditingTimes] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [discussionRefreshKey, setDiscussionRefreshKey] = useState(0);

  // Fetch trip data
  const fetchTrip = useCallback(async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.ok) {
        const data = await response.json();
        const tripData = data.trip;

        // Transform data into CollaborateTrip format
        const days: DayData[] = [];
        const itineraryItems = tripData.itinerary_items || [];
        const generatedContent = tripData.generated_content || {};

        // Get unique day numbers
        const dayNumbers = [...new Set(itineraryItems.map((item: any) => item.day_number))].sort((a: any, b: any) => a - b);

        // If no items, create days from generated content
        if (dayNumbers.length === 0 && generatedContent.itinerary) {
          generatedContent.itinerary.forEach((day: any, index: number) => {
            days.push({
              dayNumber: index + 1,
              title: day.title,
              date: day.date,
              activities: (day.activities || []).map((act: any, actIndex: number) => ({
                id: `gen-${index}-${actIndex}`,
                trip_id: tripId,
                day_number: index + 1,
                order_index: actIndex,
                title: act.title,
                description: act.description,
                category: act.type,
                location_name: act.location,
                estimated_cost: act.cost,
                time_start: act.time,
                is_final: false,
                is_split: true,
                votes: [],
              })),
            });
          });
        } else {
          dayNumbers.forEach((dayNum: any) => {
            const dayItems = itineraryItems
              .filter((item: any) => item.day_number === dayNum)
              .sort((a: any, b: any) => a.order_index - b.order_index);

            days.push({
              dayNumber: dayNum,
              title: generatedContent.itinerary?.[dayNum - 1]?.title,
              activities: dayItems.map((item: any) => ({
                ...item,
                votes: item.votes || [],
              })),
            });
          });
        }

        // Ensure at least one day exists
        if (days.length === 0) {
          days.push({ dayNumber: 1, activities: [] });
        }

        setTrip({
          id: tripData.id,
          title: tripData.title || 'My Trip',
          city: tripData.city,
          arrival_time: tripData.arrival_time,
          departure_time: tripData.departure_time,
          start_date: tripData.start_date,
          days,
          travelers: generatedContent.travelers || [],
          user_role: tripData.user_role,
        });

        setArrivalTime(tripData.arrival_time || '');
        setDepartureTime(tripData.departure_time || '');
        setStartDate(tripData.start_date || '');
      } else {
        router.push('/my-trips');
      }
    } catch (error) {
      console.error('Failed to fetch trip:', error);
    } finally {
      setLoading(false);
    }
  }, [tripId, router]);

  // Fetch cost breakdown
  const fetchCosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/costs`);
      if (response.ok) {
        const data = await response.json();
        setCostBreakdown(data);
      }
    } catch (error) {
      console.error('Failed to fetch costs:', error);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
      fetchCosts();
    }
  }, [tripId, fetchTrip, fetchCosts]);

  // Handle activity reorder
  const handleReorder = async (
    activityId: string,
    newDayNumber: number,
    newOrderIndex: number
  ) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/items/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: activityId, newDayNumber, newOrderIndex }),
      });

      if (response.ok) {
        fetchTrip();
      }
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  // Handle activity vote
  const handleVote = async (activityId: string, vote: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/trips/${tripId}/items/${activityId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      });

      if (response.ok) {
        fetchTrip();
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  // Handle finalize activity
  const handleFinalize = async (activityId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/items/${activityId}/finalize`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchTrip();
      }
    } catch (error) {
      console.error('Failed to finalize:', error);
    }
  };

  // Handle payer assignment
  const handleAssignPayer = async (activityId: string, payerId: string | null, isSplit: boolean) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/items/${activityId}/payer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payerId, isSplit }),
      });

      if (response.ok) {
        fetchTrip();
        fetchCosts();
      }
    } catch (error) {
      console.error('Failed to assign payer:', error);
    }
  };

  // Handle add place from URL
  const handleAddPlace = (dayNumber: number) => {
    setAddToDay(dayNumber);
    setAddCategory('attraction');
    setShowAddPlaceModal(true);
  };

  // Handle add hotel
  const handleAddHotel = (dayNumber: number) => {
    setAddToDay(dayNumber);
    setAddCategory('hotel');
    setShowAddPlaceModal(true);
  };

  // Handle place added
  const handlePlaceAdded = () => {
    setShowAddPlaceModal(false);
    fetchTrip();
    fetchCosts();
  };

  // Handle update times
  const handleUpdateTimes = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/times`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arrivalTime, departureTime }),
      });

      if (response.ok) {
        setEditingTimes(false);
        fetchTrip();
      }
    } catch (error) {
      console.error('Failed to update times:', error);
    }
  };

  // Handle update start date
  const handleUpdateStartDate = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/dates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate }),
      });

      if (response.ok) {
        setEditingDates(false);
        fetchTrip();
      }
    } catch (error) {
      console.error('Failed to update dates:', error);
    }
  };

  // Calculate end date from start date
  const getEndDate = (start: string, numDays: number): string => {
    if (!start) return '';
    const startDateObj = new Date(start);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + numDays - 1);
    return endDateObj.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Handle settle
  const handleSettle = async (settlementId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/costs/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementId }),
      });

      if (response.ok) {
        fetchCosts();
      }
    } catch (error) {
      console.error('Failed to settle:', error);
    }
  };

  // Handle delete activity
  const handleDelete = async (activityId: string) => {
    // Optimistically remove from UI immediately
    setTrip(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map(day => ({
          ...day,
          activities: day.activities.filter(a => a.id !== activityId)
        }))
      };
    });

    // If this is a generated (unsaved) activity, we're done
    if (activityId.startsWith('gen-')) {
      return;
    }

    // For real database items, call the API
    try {
      const response = await fetch(`/api/trips/${tripId}/items/${activityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // If API failed, refetch to restore the item
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed:', errorData);
        fetchTrip(); // Restore the item by refetching
      } else {
        fetchCosts(); // Update costs
        setDiscussionRefreshKey(k => k + 1); // Refresh discussions to show deletion message
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      fetchTrip(); // Restore on error
    }
  };

  // Handle update price
  const handleUpdatePrice = async (activityId: string, price: number) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/items/${activityId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price }),
      });

      if (response.ok) {
        fetchTrip();
        fetchCosts();
      }
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  };

  // Handle update URL
  const handleUpdateUrl = async (activityId: string, url: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/items/${activityId}/url`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        fetchTrip();
      }
    } catch (error) {
      console.error('Failed to update URL:', error);
    }
  };

  // Handle update summary
  const handleUpdateSummary = async (activityId: string, summary: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/items/${activityId}/summary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });

      if (response.ok) {
        fetchTrip();
      }
    } catch (error) {
      console.error('Failed to update summary:', error);
    }
  };

  // Handle update description
  const handleUpdateDescription = async (activityId: string, description: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/items/${activityId}/description`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        fetchTrip();
      }
    } catch (error) {
      console.error('Failed to update description:', error);
    }
  };

  // Handle travelers change
  const handleTravelersChange = (travelers: Traveler[]) => {
    setTrip(prev => {
      if (!prev) return prev;
      return { ...prev, travelers };
    });
    // Refetch costs since travelers affect cost splitting
    fetchCosts();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading collaborative planner...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
            <button
              onClick={() => router.push('/my-trips')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Back to My Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalDays = trip.days.length;

  // Calculate total trip cost (ensure numbers, not strings)
  const totalTripCost = trip.days.reduce((sum, day) => {
    return sum + day.activities.reduce((daySum, activity) => {
      return daySum + (Number(activity.estimated_cost) || 0);
    }, 0);
  }, 0);

  const endDate = getEndDate(startDate, totalDays);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-16">
        {/* Trip Header Bar */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
          <div className="max-w-full mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(`/trips/${tripId}`)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back</span>
                </button>

                <div className="h-6 w-px bg-gray-300" />

                <h1 className="text-lg font-bold text-gray-900">{trip.title}</h1>

                {trip.city && (
                  <span className="text-sm text-gray-500">• {trip.city}</span>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Trip Dates */}
                <div className="flex items-center gap-2 text-sm">
                  {editingDates ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <button
                        onClick={handleUpdateStartDate}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDates(false)}
                        className="px-2 py-1 text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingDates(true)}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                      title="Set trip dates"
                    >
                      <Calendar className="w-4 h-4" />
                      {startDate ? (
                        <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
                      ) : (
                        <span className="text-gray-400">Set dates</span>
                      )}
                    </button>
                  )}
                </div>

                <div className="h-6 w-px bg-gray-300" />

                {/* Arrival/Departure Times */}
                <div className="flex items-center gap-3 text-sm">
                  {editingTimes ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Arrive:</span>
                        <input
                          type="time"
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Depart:</span>
                        <input
                          type="time"
                          value={departureTime}
                          onChange={(e) => setDepartureTime(e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <button
                        onClick={handleUpdateTimes}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTimes(false)}
                        className="px-3 py-1 text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {(trip.arrival_time || trip.departure_time) && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {trip.arrival_time && <span>Arrive: {trip.arrival_time}</span>}
                          {trip.departure_time && <span>Depart: {trip.departure_time}</span>}
                        </div>
                      )}
                      <button
                        onClick={() => setEditingTimes(true)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Edit times"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="h-6 w-px bg-gray-300" />

                {/* Total Cost */}
                <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  <DollarSign className="w-4 h-4" />
                  <span>{totalTripCost}</span>
                  <span className="text-emerald-500 font-normal">total</span>
                </div>

                <div className="h-6 w-px bg-gray-300" />

                <TravelersCollaboratorsPopover
                  tripId={tripId}
                  travelers={trip.travelers}
                  onTravelersChange={handleTravelersChange}
                />

                <button
                  onClick={() => setShowAddPlaceModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Add Place</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-8rem)]">
          {/* Kanban Board - Left 70% */}
          <div className="flex-1 overflow-x-auto p-4">
            <KanbanBoard
              days={trip.days}
              travelers={trip.travelers}
              tripStartDate={startDate}
              onReorder={handleReorder}
              onVote={handleVote}
              onFinalize={handleFinalize}
              onAssignPayer={handleAssignPayer}
              onAddPlace={handleAddPlace}
              onAddHotel={handleAddHotel}
              onSelectActivity={(id) => setSelectedActivityId(id)}
              selectedActivityId={selectedActivityId}
              onDelete={handleDelete}
              onUpdatePrice={handleUpdatePrice}
              onUpdateUrl={handleUpdateUrl}
              onUpdateSummary={handleUpdateSummary}
              onUpdateDescription={handleUpdateDescription}
            />
          </div>

          {/* Right Sidebar - 30% */}
          <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
            {/* Discussion Panel */}
            <div className="flex-1 overflow-hidden">
              <DiscussionSidebar
                tripId={tripId}
                selectedActivityId={selectedActivityId}
                activities={trip.days.flatMap(d => d.activities)}
                onClearSelection={() => setSelectedActivityId(null)}
                onActivityRestored={() => { fetchTrip(); fetchCosts(); }}
                refreshKey={discussionRefreshKey}
              />
            </div>

            {/* Cost Summary */}
            <div className="border-t border-gray-200">
              <CostSummary
                costBreakdown={costBreakdown}
                travelers={trip.travelers}
                onSettle={handleSettle}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Place Modal */}
      {showAddPlaceModal && (
        <AddPlaceModal
          tripId={tripId}
          dayNumber={addToDay}
          totalDays={totalDays}
          defaultCategory={addCategory}
          onClose={() => setShowAddPlaceModal(false)}
          onPlaceAdded={handlePlaceAdded}
        />
      )}
    </div>
  );
}
