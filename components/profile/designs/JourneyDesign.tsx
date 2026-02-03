'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Globe,
  Heart,
  Compass,
  Star,
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  MessageSquare,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { UserProfile, SOCIAL_PLATFORMS, PAYMENT_PLATFORMS, BADGE_DEFINITIONS, SocialPlatform, PaymentPlatform } from '@/lib/types/user';
import dynamic from 'next/dynamic';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { UserBadgeLevel } from '@/lib/badges';
import AuthModal from '@/components/auth/AuthModal';

const TravelMapWithWishlist = dynamic(() => import('../TravelMapWithWishlist'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-zinc-900 rounded-xl animate-pulse" />,
});

interface GuideDetails {
  experience_level?: 'beginner' | 'intermediate' | 'expert';
  specialties?: string[];
  coverage_areas?: string[];
  hourly_rate?: number;
  bio?: string;
  google_calendar_embed?: string;
}

// Safe Google Calendar component - extracts URL and renders button/link
function GoogleCalendarButton({ embedCode }: { embedCode: string }) {
  // Extract the calendar URL from the embed code
  // Google Calendar embeds contain URLs like: https://calendar.google.com/calendar/appointments/...
  const urlMatch = embedCode.match(/https:\/\/calendar\.google\.com\/calendar\/appointments\/[^"'\s]+/);
  const calendarUrl = urlMatch ? urlMatch[0] : null;

  if (!calendarUrl) {
    return null;
  }

  return (
    <div className="mt-8 pt-8 border-t border-amber-500/20">
      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-amber-400" />
        Book via Google Calendar
      </h4>
      <a
        href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Schedule with Google Calendar
      </a>
      <p className="text-zinc-500 text-sm mt-2">
        Opens Google Calendar to pick an available time slot
      </p>
    </div>
  );
}

interface ProfileDesignProps {
  profile: UserProfile;
  isOwner: boolean;
  isFollowing?: boolean;
  followersCount: number;
  onFollow?: () => void;
  onUnfollow?: () => void;
  itineraries?: any[];
  isGuide?: boolean;
  guideDetails?: GuideDetails;
}

export default function JourneyDesign({
  profile,
  isOwner,
  isFollowing,
  followersCount,
  onFollow,
  onUnfollow,
  itineraries = [],
  isGuide,
  guideDetails,
}: ProfileDesignProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [badgeLevels, setBadgeLevels] = useState<UserBadgeLevel[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCloneId, setPendingCloneId] = useState<string | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    booking_date: '',
    start_time: '09:00',
    end_time: '12:00',
    party_size: 1,
    visitor_name: '',
    visitor_email: '',
    visitor_phone: '',
    notes: '',
  });

  // Fetch gamified badge levels
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch(`/api/users/${profile.user.id}/badges`);
        if (res.ok) {
          const data = await res.json();
          setBadgeLevels(data.badges || []);
        }
      } catch (error) {
        console.error('Failed to fetch badge levels:', error);
      }
    };

    if (profile.user.id) {
      fetchBadges();
    }
  }, [profile.user.id]);

  // Check if Google Calendar booking is enabled globally
  useEffect(() => {
    const checkGoogleCalendar = async () => {
      try {
        const res = await fetch('/api/admin/site-settings?key=google_calendar_booking_enabled');
        if (res.ok) {
          const data = await res.json();
          setGoogleCalendarEnabled(data.value === 'true');
        }
      } catch (error) {
        console.error('Failed to check Google Calendar setting:', error);
      }
    };
    checkGoogleCalendar();
  }, []);

  // Handle booking form submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitting(true);
    setBookingError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide_id: profile.user.id,
          ...bookingForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit booking');
      }

      setBookingSuccess(true);
      setBookingForm({
        booking_date: '',
        start_time: '09:00',
        end_time: '12:00',
        party_size: 1,
        visitor_name: '',
        visitor_email: '',
        visitor_phone: '',
        notes: '',
      });
    } catch (error: any) {
      setBookingError(error.message);
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Calculate estimated cost
  const calculateEstimatedCost = () => {
    if (!guideDetails?.hourly_rate || !bookingForm.start_time || !bookingForm.end_time) return 0;
    const start = bookingForm.start_time.split(':').map(Number);
    const end = bookingForm.end_time.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    const hours = Math.max(0, (endMinutes - startMinutes) / 60);
    return Math.round(hours * guideDetails.hourly_rate);
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClone = async (tripId: string) => {
    setCloning(tripId);
    try {
      const response = await fetch(`/api/trips/${tripId}/clone`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresAuth) {
          // User not authenticated - show auth modal
          setPendingCloneId(tripId);
          setShowAuthModal(true);
          return;
        }
        throw new Error(data.error || 'Failed to clone trip');
      }

      // Success - redirect to the cloned trip
      router.push(`/trips/${data.tripId}`);
    } catch (error) {
      console.error('Clone error:', error);
    } finally {
      setCloning(null);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    if (pendingCloneId) {
      // Retry clone after successful auth
      await handleClone(pendingCloneId);
      setPendingCloneId(null);
    }
  };

  const visitedPlaces = profile.travelHistory.filter(p => !p.isWishlist);
  const wishlistPlaces = profile.travelHistory.filter(p => p.isWishlist);
  const nameParts = (profile.user.fullName || 'Anonymous').split(' ');

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-[var(--font-plus-jakarta)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between h-16 px-6">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Share'}
              </button>
              {isOwner ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Edit Profile
                </Link>
              ) : (
                <button
                  onClick={isFollowing ? onUnfollow : onFollow}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isFollowing
                      ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
          </div>
        </div>
      </header>

      {/* Hero Section - Giant Name */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="flex-1">
              <div className="space-y-0">
                {nameParts.map((part, i) => (
                  <h1
                    key={i}
                    className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none"
                  >
                    {part.toUpperCase()}
                  </h1>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-zinc-400">
                {profile.user.username && (
                  <span className="text-lg">@{profile.user.username}</span>
                )}
                {profile.user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  {profile.user.profileVisibility === 'public' ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {profile.user.profileVisibility === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
              {profile.user.bio && (() => {
                const words = profile.user.bio.split(/\s+/);
                const isLong = words.length > 150;
                const truncatedBio = isLong ? words.slice(0, 150).join(' ') + '...' : profile.user.bio;
                return (
                  <div className="mt-6 max-w-2xl">
                    <p className="text-lg text-zinc-300 leading-[1.7] font-normal">
                      {bioExpanded || !isLong ? profile.user.bio : truncatedBio}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => setBioExpanded(!bioExpanded)}
                        className="mt-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {bioExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              {profile.user.avatarUrl ? (
                <img
                  src={profile.user.avatarUrl}
                  alt={profile.user.fullName}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover ring-4 ring-zinc-800"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-4 ring-zinc-800">
                  <span className="text-5xl font-bold text-white">
                    {(profile.user.fullName || 'A')[0].toUpperCase()}
                  </span>
                </div>
              )}
              {/* Badges below avatar */}
              {(badgeLevels.length > 0 || profile.badges.filter(b => BADGE_DEFINITIONS[b.badgeType as keyof typeof BADGE_DEFINITIONS]).length > 0) && (
                <div className="flex justify-center">
                  <BadgeGrid
                    badges={badgeLevels}
                    specialBadges={profile.badges
                      .filter((badge) => BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS])
                      .map(b => ({ type: b.badgeType, metadata: b.metadata }))}
                    size="md"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Giant Stats Bar */}
      <section className="py-12 border-y border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-start gap-12 md:gap-20">
            <div>
              <p className="text-5xl md:text-6xl font-black text-white">{profile.stats.countriesVisited}</p>
              <p className="text-sm uppercase tracking-widest text-zinc-500 mt-1">Countries</p>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-black text-white">{profile.stats.itinerariesCount}</p>
              <p className="text-sm uppercase tracking-widest text-zinc-500 mt-1">Trips</p>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-black text-white">{profile.stats.totalClones}</p>
              <p className="text-sm uppercase tracking-widest text-zinc-500 mt-1">Clones</p>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-black text-emerald-400">{followersCount}</p>
              <p className="text-sm uppercase tracking-widest text-zinc-500 mt-1">Followers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Guide For Hire Section */}
      {isGuide && guideDetails && (
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/20 border border-amber-500/30">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-amber-400 blur-3xl" />
                <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-orange-400 blur-2xl" />
              </div>

              <div className="relative p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                  {/* Left side - Header and rate */}
                  <div className="lg:w-1/3">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Compass className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">AVAILABLE</h3>
                        <p className="text-amber-400 text-sm font-semibold">AS GUIDE</p>
                      </div>
                    </div>

                    {/* Experience Level */}
                    {guideDetails.experience_level && (
                      <div className="flex items-center gap-2 mb-4">
                        {[...Array(guideDetails.experience_level === 'expert' ? 3 : guideDetails.experience_level === 'intermediate' ? 2 : 1)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                        ))}
                        {[...Array(3 - (guideDetails.experience_level === 'expert' ? 3 : guideDetails.experience_level === 'intermediate' ? 2 : 1))].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-zinc-600" />
                        ))}
                        <span className="text-zinc-300 text-sm ml-2 capitalize">
                          {guideDetails.experience_level} Guide
                        </span>
                      </div>
                    )}

                    {/* Hourly Rate */}
                    {guideDetails.hourly_rate && (
                      <div className="mb-4">
                        <p className="text-4xl font-black text-white">
                          ${guideDetails.hourly_rate}
                          <span className="text-lg font-normal text-zinc-400">/hour</span>
                        </p>
                      </div>
                    )}

                    {/* Specialties */}
                    {guideDetails.specialties && guideDetails.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {guideDetails.specialties.map((specialty, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-amber-500/20 text-amber-300 text-sm font-medium rounded-full border border-amber-500/30"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right side - Bio and coverage */}
                  <div className="lg:w-2/3">
                    {/* Guide Bio */}
                    {guideDetails.bio && (
                      <div className="bg-zinc-900/50 rounded-xl p-6 mb-4 border border-zinc-800">
                        <p className="text-zinc-300 leading-relaxed italic">
                          "{guideDetails.bio}"
                        </p>
                      </div>
                    )}

                    {/* Coverage Areas */}
                    {guideDetails.coverage_areas && guideDetails.coverage_areas.length > 0 && (
                      <div className="flex items-center gap-2 text-zinc-300 mb-6">
                        <MapPin className="w-5 h-5 text-amber-400" />
                        <span className="font-medium">Available in:</span>
                        <span>{guideDetails.coverage_areas.join(', ')}</span>
                      </div>
                    )}

                    {/* Book Tour / Google Calendar */}
                    {!showBookingForm && !bookingSuccess && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setShowBookingForm(true)}
                          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl transition-colors"
                        >
                          Book a Tour
                        </button>
                        {googleCalendarEnabled && guideDetails.google_calendar_embed && (
                          <div className="text-zinc-400 text-sm flex items-center gap-2">
                            <span>or</span>
                            <span className="text-amber-400">use calendar below</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Form */}
                {showBookingForm && !bookingSuccess && (
                  <div className="mt-8 pt-8 border-t border-amber-500/20">
                    <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-400" />
                      Book a Tour
                    </h4>
                    <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Date */}
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Date</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingForm.booking_date}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, booking_date: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>

                      {/* Party Size */}
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Party Size</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={bookingForm.party_size}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, party_size: parseInt(e.target.value) || 1 }))}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Start Time */}
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Start Time</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input
                            type="time"
                            required
                            value={bookingForm.start_time}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, start_time: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* End Time */}
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">End Time</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input
                            type="time"
                            required
                            value={bookingForm.end_time}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, end_time: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Your Name */}
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={bookingForm.visitor_name}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, visitor_name: e.target.value }))}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input
                            type="email"
                            required
                            value={bookingForm.visitor_email}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, visitor_email: e.target.value }))}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="md:col-span-2">
                        <label className="block text-sm text-zinc-400 mb-1">Phone (optional)</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input
                            type="tel"
                            value={bookingForm.visitor_phone}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, visitor_phone: e.target.value }))}
                            placeholder="+1 234 567 8900"
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="md:col-span-2">
                        <label className="block text-sm text-zinc-400 mb-1">Notes (optional)</label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                          <textarea
                            value={bookingForm.notes}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any special requests or interests..."
                            rows={3}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* Error message */}
                      {bookingError && (
                        <div className="md:col-span-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                          {bookingError}
                        </div>
                      )}

                      {/* Submit */}
                      <div className="md:col-span-2 flex items-center justify-between pt-4">
                        <div>
                          {guideDetails.hourly_rate && (
                            <p className="text-zinc-400 text-sm">
                              Estimated cost: <span className="text-xl font-bold text-white">${calculateEstimatedCost()}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowBookingForm(false)}
                            className="px-5 py-3 text-zinc-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={bookingSubmitting}
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-zinc-900 font-bold rounded-xl transition-colors flex items-center gap-2"
                          >
                            {bookingSubmitting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Request Booking'
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* Booking Success */}
                {bookingSuccess && (
                  <div className="mt-8 pt-8 border-t border-amber-500/20">
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                      <h4 className="text-2xl font-bold text-white mb-2">Booking Request Sent!</h4>
                      <p className="text-zinc-400 mb-6">
                        Your booking request has been submitted. The guide will review and confirm your booking soon.
                      </p>
                      <button
                        onClick={() => {
                          setBookingSuccess(false);
                          setShowBookingForm(false);
                        }}
                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                      >
                        Book Another Tour
                      </button>
                    </div>
                  </div>
                )}

                {/* Google Calendar Button - safe external link */}
                {googleCalendarEnabled && guideDetails.google_calendar_embed && (
                  <GoogleCalendarButton embedCode={guideDetails.google_calendar_embed} />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Map Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              WHERE I'VE<br />BEEN
            </h2>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-zinc-400">{visitedPlaces.length} visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-zinc-400">{wishlistPlaces.length} wishlist</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-zinc-800">
            <TravelMapWithWishlist
              travelHistory={profile.travelHistory}
              height="450px"
              darkMode
            />
          </div>
        </div>
      </section>

      {/* Itineraries */}
      {itineraries.length > 0 && (
        <section className="py-16 px-6 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-8">
              ITINERARIES
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itineraries.map((trip) => {
                const images = trip.images || [];
                const placeholderColors = ['from-amber-500 to-orange-600', 'from-emerald-500 to-teal-600', 'from-violet-500 to-purple-600', 'from-rose-500 to-pink-600'];
                const placesCount = trip.itemCount || trip.placesCount || 0;

                return (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="group block"
                  >
                    {/* Image Collage */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden">
                      {images.length >= 3 ? (
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                          <div className="row-span-2">
                            <img src={images[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <img src={images[1]} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <img src={images[2]} alt="" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      ) : images.length === 2 ? (
                        <div className="grid grid-cols-2 gap-1 h-full">
                          <img src={images[0]} alt="" className="w-full h-full object-cover" />
                          <img src={images[1]} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : images.length === 1 ? (
                        <img src={images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${placeholderColors[Math.floor(Math.random() * placeholderColors.length)]} flex items-center justify-center`}>
                          <MapPin className="w-16 h-16 text-white/30" />
                        </div>
                      )}

                      {/* Top left badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {placesCount > 0 && (
                          <div className="px-2.5 py-1 bg-zinc-900/80 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                            {placesCount} places
                          </div>
                        )}
                        {trip.cloneCount > 0 && (
                          <div className="px-2.5 py-1 bg-emerald-600/80 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center gap-1">
                            <Copy className="w-3 h-3" />
                            {trip.cloneCount}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          onClick={(e) => { e.preventDefault(); }}
                          className="p-2 bg-zinc-900/60 backdrop-blur-sm rounded-full text-white/70 hover:text-white hover:bg-zinc-900/80 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleClone(trip.id);
                          }}
                          disabled={cloning === trip.id}
                          className="p-2 bg-zinc-900/60 backdrop-blur-sm rounded-full text-white/70 hover:text-white hover:bg-zinc-900/80 transition-colors disabled:opacity-50"
                          title="Clone this itinerary"
                        >
                          <Copy className={`w-4 h-4 ${cloning === trip.id ? 'animate-pulse' : ''}`} />
                        </button>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>

                    {/* Trip Info */}
                    <div className="mt-3">
                      <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {trip.title}
                      </h3>
                      {trip.destinationCity && (
                        <p className="text-zinc-400 text-sm mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {trip.destinationCity}, {trip.destinationCountry}
                        </p>
                      )}
                      <p className="text-zinc-500 text-sm mt-1 flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-xs">
                          {(profile.user.fullName || 'A')[0].toUpperCase()}
                        </span>
                        {profile.user.username || profile.user.fullName}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Social & Tips */}
      <section id="connect-section" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {profile.socialLinks.length > 0 && (
              <div>
                <h2 className="text-2xl font-black tracking-tight mb-6">CONNECT</h2>
                <div className="space-y-3">
                  {profile.socialLinks.map((link) => {
                    const platform = SOCIAL_PLATFORMS[link.platform as SocialPlatform];
                    return (
                      <a
                        key={link.id}
                        href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group"
                      >
                        <span className="text-xl">{platform?.icon}</span>
                        <span>{platform?.label}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            {profile.paymentLinks.length > 0 && (
              <div>
                <h2 className="text-2xl font-black tracking-tight mb-6">SUPPORT</h2>
                <div className="space-y-3">
                  {profile.paymentLinks.map((link) => {
                    const platform = PAYMENT_PLATFORMS[link.platform as PaymentPlatform];
                    return (
                      <a
                        key={link.id}
                        href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 transition-colors group ${
                          link.isPrimary ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xl">{platform?.icon}</span>
                        <span>{platform?.label}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Auth Modal for cloning */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingCloneId(null);
        }}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
