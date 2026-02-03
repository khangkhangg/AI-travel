'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react';

interface Booking {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
}

interface BookingCounts {
  pending: number;
  confirmed: number;
  rejected: number;
  cancelled: number;
}

interface BookingsPanelProps {
  bookings: Booking[];
  bookingCounts: BookingCounts;
  loading?: boolean;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onFilterChange: (filter: string) => void;
  currentFilter: string;
  onBookingAction: (bookingId: string, status: 'confirmed' | 'rejected') => Promise<void>;
}

export default function BookingsPanel({
  bookings,
  bookingCounts,
  loading = false,
  selectedMonth,
  onMonthChange,
  onFilterChange,
  currentFilter,
  onBookingAction,
}: BookingsPanelProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (bookingId: string, status: 'confirmed' | 'rejected') => {
    setActionLoading(bookingId);
    try {
      await onBookingAction(bookingId, status);
    } finally {
      setActionLoading(null);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, direction === 'prev' ? month - 2 : month, 1);
    onMonthChange(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const stats = [
    { label: 'Pending', count: bookingCounts.pending, color: 'amber', icon: Clock },
    { label: 'Confirmed', count: bookingCounts.confirmed, color: 'emerald', icon: CheckCircle },
    { label: 'Rejected', count: bookingCounts.rejected, color: 'red', icon: XCircle },
    { label: 'Cancelled', count: bookingCounts.cancelled, color: 'gray', icon: X },
  ];

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>
        {currentFilter !== 'all' && (
          <button
            onClick={() => onFilterChange('all')}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            Show all
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <button
              key={stat.label}
              onClick={() =>
                onFilterChange(
                  currentFilter === stat.label.toLowerCase() ? 'all' : stat.label.toLowerCase()
                )
              }
              className={`p-4 rounded-xl border transition-all text-left ${
                currentFilter === stat.label.toLowerCase()
                  ? `bg-${stat.color}-50 border-${stat.color}-200`
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <stat.icon className={`w-5 h-5 text-${stat.color}-500 mb-2`} />
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mini Calendar */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Calendar</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium min-w-[100px] text-center">
                  {new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="py-2 text-gray-500 font-medium">
                  {day}
                </div>
              ))}
              {(() => {
                const [year, month] = selectedMonth.split('-').map(Number);
                const firstDay = new Date(year, month - 1, 1).getDay();
                const daysInMonth = new Date(year, month, 0).getDate();
                const days = [];

                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} className="py-2" />);
                }

                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayBookings = bookings.filter((b) => b.booking_date === dateStr);
                  const hasBooking = dayBookings.length > 0;
                  const hasPending = dayBookings.some((b) => b.status === 'pending');
                  const hasConfirmed = dayBookings.some((b) => b.status === 'confirmed');

                  days.push(
                    <div
                      key={day}
                      className={`py-2 rounded-lg relative ${
                        hasBooking
                          ? hasPending
                            ? 'bg-amber-100 text-amber-800 font-medium'
                            : hasConfirmed
                              ? 'bg-emerald-100 text-emerald-800 font-medium'
                              : 'bg-gray-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {day}
                      {hasBooking && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
                      )}
                    </div>
                  );
                }

                return days;
              })()}
            </div>
          </div>

          {/* Bookings List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              {currentFilter === 'all'
                ? 'All Bookings'
                : `${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)} Bookings`}
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No bookings yet</p>
                <p className="text-sm mt-1">Share your profile to start receiving booking requests</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {booking.visitor_name}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              booking.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : booking.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : booking.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(booking.booking_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <a
                            href={`mailto:${booking.visitor_email}`}
                            className="flex items-center gap-1 hover:text-emerald-600"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {booking.visitor_email}
                          </a>
                          {booking.visitor_phone && (
                            <a
                              href={`tel:${booking.visitor_phone}`}
                              className="flex items-center gap-1 hover:text-emerald-600"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {booking.visitor_phone}
                            </a>
                          )}
                        </div>

                        {booking.notes && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{booking.notes}</p>
                        )}
                      </div>

                      {booking.status === 'pending' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {actionLoading === booking.id ? (
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleAction(booking.id, 'confirmed')}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Confirm booking"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleAction(booking.id, 'rejected')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject booking"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
