'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Loader2 } from 'lucide-react';
import { UserProfile, UserTravelHistory, BADGE_DEFINITIONS } from '@/lib/types/user';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';
import { UserBadgeLevel } from '@/lib/badges';
import dynamic from 'next/dynamic';

import ProfileLayout from '@/components/profile/ProfileLayout';
import { SectionId, SubItemId } from '@/components/profile/ProfileSidebar';
import {
  DashboardPanel,
  PersonalInfoPanel,
  TravelHistoryPanel,
  BadgesPanel,
  LinksPanel,
  PrivacyPanel,
  GuideModePanel,
  BookingsPanel,
  ActivityPanel,
} from '@/components/profile/panels';

// Dynamically import modals
const AddTravelModal = dynamic(() => import('@/components/profile/AddTravelModal'), {
  ssr: false,
});

const AddLinkModal = dynamic(() => import('@/components/profile/AddLinkModal'), {
  ssr: false,
});

interface GuideDetails {
  experience_level?: 'beginner' | 'intermediate' | 'expert';
  specialties?: string[];
  coverage_areas?: string[];
  hourly_rate?: number;
  bio?: string;
  calendar_embed_code?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badgeLevels, setBadgeLevels] = useState<UserBadgeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guide mode state
  const [isGuide, setIsGuide] = useState(false);
  const [guideDetails, setGuideDetails] = useState<GuideDetails>({});
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingCounts, setBookingCounts] = useState({
    pending: 0,
    confirmed: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [bookingFilter, setBookingFilter] = useState<string>('all');

  // Activity state
  const [pendingActivityCount, setPendingActivityCount] = useState(0);

  // Modal states
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showSocialLinkModal, setShowSocialLinkModal] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [editingTravel, setEditingTravel] = useState<UserTravelHistory | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchGuideMode();
    fetchGoogleCalendarSetting();
    fetchPendingActivityCount();
  }, []);

  const fetchProfile = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/');
        return;
      }

      let response = await fetch('/api/users');

      if (response.status === 404) {
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: authUser.id,
            email: authUser.email,
            fullName: authUser.user_metadata?.full_name || '',
          }),
        });

        if (createResponse.ok) {
          response = await fetch('/api/users');
        }
      }

      if (response.status === 401) {
        router.push('/');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setBadgeLevels(data.badgeLevels || []);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuideMode = async () => {
    try {
      const response = await fetch('/api/users/guide-mode');
      if (response.ok) {
        const data = await response.json();
        setIsGuide(data.is_guide || false);
        setGuideDetails(data.guide_details || {});
      }
    } catch (err) {
      console.error('Failed to fetch guide mode:', err);
    }
  };

  const fetchGoogleCalendarSetting = async () => {
    try {
      const response = await fetch('/api/site-settings?key=google_calendar_booking_enabled');
      if (response.ok) {
        const data = await response.json();
        setGoogleCalendarEnabled(data.value === 'true');
      }
    } catch (err) {
      console.error('Failed to fetch Google Calendar setting:', err);
    }
  };

  const fetchPendingActivityCount = async () => {
    try {
      const response = await fetch('/api/users/me/activity?limit=50');
      if (response.ok) {
        const data = await response.json();
        const activities = data.activities || [];
        // Count pending items (received proposals/suggestions with pending or withdrawal_requested status)
        const pendingCount = activities.filter(
          (a: any) =>
            (a.type === 'bid_received' || a.type === 'suggestion_received') &&
            (a.status === 'pending' || a.status === 'withdrawal_requested')
        ).length;
        setPendingActivityCount(pendingCount);
      }
    } catch (err) {
      console.error('Failed to fetch pending activity count:', err);
    }
  };

  const fetchBookings = async (month?: string) => {
    setBookingsLoading(true);
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (bookingFilter !== 'all') params.append('status', bookingFilter);

      const response = await fetch(`/api/bookings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setBookingCounts(
          data.counts || { pending: 0, confirmed: 0, rejected: 0, cancelled: 0 }
        );
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Handlers
  const handleSaveProfile = async (data: {
    fullName: string;
    username: string;
    location: string;
    phone: string;
    bio: string;
  }) => {
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    await fetchProfile();
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/users/avatar', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to upload avatar');
    }

    await fetchProfile();
  };

  const handleAddTravel = async (data: {
    city: string;
    country: string;
    year?: number;
    month?: number;
    notes?: string;
    lat?: number;
    lng?: number;
  }) => {
    const response = await fetch('/api/users/travel-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add travel history');
    }

    await fetchProfile();
  };

  const handleDeleteTravel = async (id: string) => {
    if (!confirm('Remove this place from your travel history?')) return;

    const response = await fetch(`/api/users/travel-history?id=${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await fetchProfile();
    }
  };

  const handleAddSocialLink = async (platform: string, value: string) => {
    const response = await fetch('/api/users/social-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, value }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add social link');
    }

    await fetchProfile();
  };

  const handleDeleteSocialLink = async (id: string) => {
    if (!confirm('Remove this social link?')) return;

    const response = await fetch(`/api/users/social-links?id=${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await fetchProfile();
    }
  };

  const handleAddPaymentLink = async (platform: string, value: string, isPrimary?: boolean) => {
    const response = await fetch('/api/users/payment-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, value, isPrimary }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add payment link');
    }

    await fetchProfile();
  };

  const handleDeletePaymentLink = async (id: string) => {
    if (!confirm('Remove this tip method?')) return;

    const response = await fetch(`/api/users/payment-links?id=${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await fetchProfile();
    }
  };

  const handleToggleVisibility = async () => {
    const newVisibility = profile?.user.profileVisibility === 'public' ? 'private' : 'public';

    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileVisibility: newVisibility }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update visibility');
    }

    await fetchProfile();
  };

  const handleToggleGuideMode = async () => {
    const response = await fetch('/api/users/guide-mode', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_guide: !isGuide }),
    });

    if (response.ok) {
      const data = await response.json();
      setIsGuide(data.is_guide);
    } else {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update guide mode');
    }
  };

  const handleSaveGuideDetails = async (details: GuideDetails) => {
    const response = await fetch('/api/users/guide-mode', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guide_details: details }),
    });

    if (response.ok) {
      const data = await response.json();
      setGuideDetails(data.guide_details || {});
    } else {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save guide details');
    }
  };

  const handleBookingAction = async (bookingId: string, status: 'confirmed' | 'rejected') => {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      fetchBookings(selectedMonth);
    }
  };

  // Track if we've already fetched bookings to prevent duplicate fetches
  const hasFetchedBookings = useRef(false);

  // Fetch bookings when viewing bookings section (memoized to prevent infinite loops)
  const handleSectionChange = useCallback((section: SectionId) => {
    if (section === 'bookings' && isGuide && !hasFetchedBookings.current && !bookingsLoading) {
      hasFetchedBookings.current = true;
      fetchBookings(selectedMonth);
    }
  }, [isGuide, selectedMonth, bookingsLoading]);

  // Render panel based on active section
  const renderPanel = (activeSection: SectionId, activeSubItem: SubItemId | null) => {

    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardPanel
            stats={{
              totalViews: profile?.stats.totalViews || 0,
              totalClones: profile?.stats.totalClones || 0,
              itinerariesCount: profile?.stats.itinerariesCount || 0,
              publicItinerariesCount: profile?.stats.publicItinerariesCount || 0,
              countriesVisited: profile?.stats.countriesVisited || 0,
            }}
            username={profile?.user.username}
          />
        );

      case 'activity':
        return <ActivityPanel />;

      case 'profile':
        switch (activeSubItem) {
          case 'personal-info':
            return (
              <PersonalInfoPanel
                user={{
                  id: profile?.user.id || '',
                  fullName: profile?.user.fullName,
                  username: profile?.user.username,
                  email: profile?.user.email || '',
                  emailVerified: profile?.user.emailVerified,
                  avatarUrl: profile?.user.avatarUrl,
                  location: profile?.user.location,
                  phone: profile?.user.phone,
                  bio: profile?.user.bio,
                }}
                onSave={handleSaveProfile}
                onAvatarUpload={handleAvatarUpload}
              />
            );
          case 'travel-history':
            return (
              <TravelHistoryPanel
                travelHistory={profile?.travelHistory || []}
                onAddPlace={() => setShowTravelModal(true)}
                onAddWishlist={() => setShowWishlistModal(true)}
                onDelete={handleDeleteTravel}
                onEdit={(place) => {
                  setEditingTravel(place);
                  setShowTravelModal(true);
                }}
              />
            );
          case 'badges':
            return (
              <BadgesPanel
                badgeLevels={badgeLevels}
                specialBadges={profile?.badges || []}
              />
            );
          case 'links':
            return (
              <LinksPanel
                socialLinks={profile?.socialLinks || []}
                paymentLinks={profile?.paymentLinks || []}
                onAddSocialLink={() => setShowSocialLinkModal(true)}
                onAddPaymentLink={() => setShowPaymentLinkModal(true)}
                onDeleteSocialLink={handleDeleteSocialLink}
                onDeletePaymentLink={handleDeletePaymentLink}
              />
            );
          default:
            return (
              <PersonalInfoPanel
                user={{
                  id: profile?.user.id || '',
                  fullName: profile?.user.fullName,
                  username: profile?.user.username,
                  email: profile?.user.email || '',
                  emailVerified: profile?.user.emailVerified,
                  avatarUrl: profile?.user.avatarUrl,
                  location: profile?.user.location,
                  phone: profile?.user.phone,
                  bio: profile?.user.bio,
                }}
                onSave={handleSaveProfile}
                onAvatarUpload={handleAvatarUpload}
              />
            );
        }

      case 'settings':
        switch (activeSubItem) {
          case 'privacy':
            return (
              <PrivacyPanel
                profileVisibility={profile?.user.profileVisibility || 'public'}
                email={profile?.user.email || ''}
                emailVerified={profile?.user.emailVerified || false}
                onToggleVisibility={handleToggleVisibility}
              />
            );
          case 'guide-mode':
            return (
              <GuideModePanel
                isGuide={isGuide}
                guideDetails={guideDetails}
                googleCalendarEnabled={googleCalendarEnabled}
                onToggleGuideMode={handleToggleGuideMode}
                onSaveGuideDetails={handleSaveGuideDetails}
              />
            );
          case 'integrations':
            return (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Integrations</h2>
                <p className="text-gray-500">Coming soon...</p>
              </div>
            );
          default:
            return (
              <PrivacyPanel
                profileVisibility={profile?.user.profileVisibility || 'public'}
                email={profile?.user.email || ''}
                emailVerified={profile?.user.emailVerified || false}
                onToggleVisibility={handleToggleVisibility}
              />
            );
        }

      case 'bookings':
        return (
          <BookingsPanel
            bookings={bookings}
            bookingCounts={bookingCounts}
            loading={bookingsLoading}
            selectedMonth={selectedMonth}
            onMonthChange={(month) => {
              setSelectedMonth(month);
              fetchBookings(month);
            }}
            onFilterChange={(filter) => {
              setBookingFilter(filter);
            }}
            currentFilter={bookingFilter}
            onBookingAction={handleBookingAction}
          />
        );

      default:
        return <DashboardPanel stats={{ totalViews: 0, totalClones: 0, itinerariesCount: 0, publicItinerariesCount: 0, countriesVisited: 0 }} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Profile not found</p>
          <p className="text-gray-500 mb-4">Please sign in to view your profile</p>
          <Link href="/" className="text-emerald-600 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get initial section from query params
  const sectionParam = searchParams.get('section');
  const defaultSection = (sectionParam === 'activity' ? 'activity' : 'dashboard') as SectionId;

  return (
    <>
      <ProfileLayout
        user={{
          id: profile.user.id,
          fullName: profile.user.fullName,
          username: profile.user.username,
          avatarUrl: profile.user.avatarUrl,
          email: profile.user.email,
          role: (profile.user as any).role,
        }}
        isGuide={isGuide}
        pendingBookings={bookingCounts.pending}
        pendingActivity={pendingActivityCount}
        defaultSection={defaultSection}
        onSectionChange={handleSectionChange}
      >
        {renderPanel}
      </ProfileLayout>

      {/* Modals */}
      <AddTravelModal
        isOpen={showTravelModal}
        onClose={() => {
          setShowTravelModal(false);
          setEditingTravel(null);
        }}
        onSave={handleAddTravel}
        initialData={
          editingTravel
            ? {
                id: editingTravel.id,
                city: editingTravel.city,
                country: editingTravel.country,
                year: editingTravel.year,
                month: editingTravel.month,
                notes: editingTravel.notes,
                lat: editingTravel.lat,
                lng: editingTravel.lng,
              }
            : undefined
        }
      />

      <AddTravelModal
        isOpen={showWishlistModal}
        onClose={() => setShowWishlistModal(false)}
        onSave={handleAddTravel}
        isWishlist
      />

      <AddLinkModal
        isOpen={showSocialLinkModal}
        onClose={() => setShowSocialLinkModal(false)}
        linkType="social"
        onSave={handleAddSocialLink}
        existingPlatforms={profile.socialLinks.map((l) => l.platform)}
      />

      <AddLinkModal
        isOpen={showPaymentLinkModal}
        onClose={() => setShowPaymentLinkModal(false)}
        linkType="payment"
        onSave={handleAddPaymentLink}
        existingPlatforms={profile.paymentLinks.map((l) => l.platform)}
      />
    </>
  );
}
