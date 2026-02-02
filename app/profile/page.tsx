'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  MapPin,
  Mail,
  Phone,
  Globe,
  Edit,
  Camera,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Calendar,
  Award,
  Eye,
  Copy,
  ExternalLink,
  Lock,
  Loader2,
  Upload,
  Compass,
  Star,
} from 'lucide-react';
import {
  UserProfile,
  SocialPlatform,
  PaymentPlatform,
  SOCIAL_PLATFORMS,
  PAYMENT_PLATFORMS,
  BADGE_INFO,
  BADGE_DEFINITIONS,
  UserTravelHistory,
} from '@/lib/types/user';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';
import dynamic from 'next/dynamic';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { UserBadgeLevel } from '@/lib/badges';

// Dynamically import map component (Leaflet doesn't work with SSR)
const TravelMap = dynamic(() => import('@/components/profile/TravelMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />,
});

const AddTravelModal = dynamic(() => import('@/components/profile/AddTravelModal'), {
  ssr: false,
});

const AddLinkModal = dynamic(() => import('@/components/profile/AddLinkModal'), {
  ssr: false,
});

// Helper to count words
const countWords = (text: string): number => {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const MAX_BIO_WORDS = 600;

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badgeLevels, setBadgeLevels] = useState<UserBadgeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  // Modal states
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showSocialLinkModal, setShowSocialLinkModal] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [editingTravel, setEditingTravel] = useState<UserTravelHistory | null>(null);

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit form states
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    bio: '',
    location: '',
    phone: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [savingVisibility, setSavingVisibility] = useState(false);

  // Guide mode state
  const [isGuide, setIsGuide] = useState(false);
  const [guideDetails, setGuideDetails] = useState<{
    experience_level?: 'beginner' | 'intermediate' | 'expert';
    specialties?: string[];
    coverage_areas?: string[];
    hourly_rate?: number;
    bio?: string;
  }>({});
  const [savingGuideMode, setSavingGuideMode] = useState(false);
  const [editingGuideDetails, setEditingGuideDetails] = useState(false);

  // Bio word count
  const bioWordCount = countWords(editForm.bio);

  useEffect(() => {
    fetchProfile();
    fetchGuideMode();
  }, []);

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

  const fetchProfile = async () => {
    try {
      // First check if user is authenticated via Supabase
      const supabase = createBrowserSupabaseClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        // Not authenticated, redirect to home
        router.push('/');
        return;
      }

      // Try to get profile from API
      let response = await fetch('/api/users');

      // If user authenticated but no profile record exists, create one
      if (response.status === 404) {
        console.log('Profile not found, creating new profile...');
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
          // Retry fetching profile
          response = await fetch('/api/users');
        } else {
          const errorData = await createResponse.json();
          console.error('Failed to create profile:', errorData);
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
        setEditForm({
          fullName: data.user.fullName || '',
          username: data.user.username || '',
          bio: data.user.bio || '',
          location: data.user.location || '',
          phone: data.user.phone || '',
        });
        setProfileVisibility(data.user.profileVisibility || 'public');
      } else {
        console.error('Failed to fetch profile, status:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      await fetchProfile();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Travel history handlers
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

  // Social links handlers
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

  // Payment links handlers
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
    const newVisibility = profileVisibility === 'public' ? 'private' : 'public';
    setSavingVisibility(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileVisibility: newVisibility }),
      });

      if (response.ok) {
        setProfileVisibility(newVisibility);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update visibility');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleToggleGuideMode = async () => {
    setSavingGuideMode(true);
    try {
      const response = await fetch('/api/users/guide-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_guide: !isGuide }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsGuide(data.is_guide);
        if (data.is_guide && !editingGuideDetails) {
          setEditingGuideDetails(true);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update guide mode');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingGuideMode(false);
    }
  };

  const handleSaveGuideDetails = async () => {
    setSavingGuideMode(true);
    try {
      const response = await fetch('/api/users/guide-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guide_details: guideDetails }),
      });

      if (response.ok) {
        const data = await response.json();
        setGuideDetails(data.guide_details || {});
        setEditingGuideDetails(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save guide details');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingGuideMode(false);
    }
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      // Refresh profile to show new avatar
      await fetchProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle bio change with word limit
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const words = countWords(newText);

    // Allow typing but warn if over limit
    if (words <= MAX_BIO_WORDS) {
      setEditForm(prev => ({ ...prev, bio: newText }));
    } else {
      // Truncate to max words
      const wordsArray = newText.trim().split(/\s+/);
      const truncated = wordsArray.slice(0, MAX_BIO_WORDS).join(' ');
      setEditForm(prev => ({ ...prev, bio: truncated }));
    }
  };

  const daysUntilVerificationDeadline = profile?.user.verificationDeadline
    ? Math.ceil((new Date(profile.user.verificationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Email Verification Banner */}
      {!profile.user.emailVerified && daysUntilVerificationDeadline !== null && daysUntilVerificationDeadline > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-800">
                Please verify your email within <strong>{daysUntilVerificationDeadline} days</strong>
              </p>
            </div>
            <button className="text-sm text-amber-700 font-medium hover:underline">
              Resend verification email
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-gray-900">My Profile</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* View Public Profile button - only show if user has username */}
              {profile.user.username && !isEditing && (
                <Link
                  href={`/profile/${profile.user.username}`}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Public Profile
                </Link>
              )}

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-500" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <div className="w-32 h-32 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden">
                {uploadingAvatar ? (
                  <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                ) : profile.user.avatarUrl ? (
                  <img
                    src={profile.user.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-16 h-16 text-emerald-600" />
                  </div>
                )}
              </div>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              {/* Upload button - always visible */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-2 right-2 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                title="Upload avatar"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>

            {/* User Info */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Your name"
                      className="text-2xl font-bold text-gray-900 bg-gray-100 rounded-lg px-3 py-1 w-full max-w-xs"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">@</span>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') }))}
                        placeholder="username"
                        className="text-sm bg-gray-100 rounded-lg px-2 py-1 w-48"
                      />
                    </div>
                    <p className="text-xs text-gray-400">3-30 characters, letters, numbers, underscores, dots</p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile.user.fullName || 'Anonymous'}
                    </h2>
                    {profile.user.username && (
                      <p className="text-gray-500 text-sm">@{profile.user.username}</p>
                    )}
                  </div>
                )}

                <p className="text-gray-500 flex items-center gap-1 mt-1">
                  <Mail className="w-4 h-4" />
                  {profile.user.email}
                  {profile.user.emailVerified && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </p>

                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Your location"
                        className="text-sm bg-gray-100 rounded-lg px-3 py-1.5 flex-1 max-w-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone number"
                        className="text-sm bg-gray-100 rounded-lg px-3 py-1.5 flex-1 max-w-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                    {profile.user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.user.location}
                      </span>
                    )}
                    {profile.user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {profile.user.phone}
                      </span>
                    )}
                  </div>
                )}

                {isEditing ? (
                  <div className="mt-4">
                    <textarea
                      value={editForm.bio}
                      onChange={handleBioChange}
                      placeholder="Tell us about yourself, your travel experiences, favorite destinations, and what inspires your adventures..."
                      rows={6}
                      className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400">
                        Share your story with other travelers
                      </p>
                      <p className={`text-xs ${bioWordCount > MAX_BIO_WORDS * 0.9 ? (bioWordCount >= MAX_BIO_WORDS ? 'text-red-500' : 'text-amber-500') : 'text-gray-400'}`}>
                        {bioWordCount} / {MAX_BIO_WORDS} words
                      </p>
                    </div>
                  </div>
                ) : profile.user.bio ? (
                  <p className="mt-4 text-gray-600 whitespace-pre-wrap">{profile.user.bio}</p>
                ) : null}
              </div>

              {/* Stats */}
              <div className="flex gap-6 md:gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{profile.stats.itinerariesCount}</p>
                  <p className="text-xs text-gray-500">Itineraries</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{profile.stats.countriesVisited}</p>
                  <p className="text-xs text-gray-500">Countries</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {badgeLevels.filter(b => b.currentCount > 0).length + profile.badges.length}
                  </p>
                  <p className="text-xs text-gray-500">Badges</p>
                </div>
              </div>
            </div>

            {/* Gamified Badges */}
            {(badgeLevels.length > 0 || profile.badges.length > 0) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Badges & Achievements</h3>
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

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent activity</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Your Impact</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Views</span>
                    <span className="font-semibold">{profile.stats.totalViews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Itineraries Cloned</span>
                    <span className="font-semibold">{profile.stats.totalClones}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Public Itineraries</span>
                    <span className="font-semibold">{profile.stats.publicItinerariesCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel History Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Travel History</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowTravelModal(true)}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Place
                  </button>
                  <button
                    onClick={() => setShowWishlistModal(true)}
                    className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
                  >
                    <Plus className="w-4 h-4" />
                    Wishlist
                  </button>
                </div>
              </div>
              <TravelMap travelHistory={profile.travelHistory} />
              {profile.travelHistory.length > 0 ? (
                <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                  {profile.travelHistory.map((place) => (
                    <div
                      key={place.id}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        place.isWishlist ? 'bg-amber-100' : 'bg-emerald-100'
                      }`}>
                        <MapPin className={`w-5 h-5 ${place.isWishlist ? 'text-amber-600' : 'text-emerald-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {place.city}, {place.country}
                          </p>
                          {place.isWishlist && (
                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                              Wishlist
                            </span>
                          )}
                        </div>
                        {!place.isWishlist && (place.year || place.month) && (
                          <p className="text-sm text-gray-500">
                            {place.month && `${new Date(2000, place.month - 1).toLocaleString('default', { month: 'short' })} `}
                            {place.year}
                          </p>
                        )}
                        {place.notes && (
                          <p className="text-sm text-gray-600 mt-1">{place.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTravel(place.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No travel history yet</p>
                  <button
                    onClick={() => setShowTravelModal(true)}
                    className="mt-2 text-sm text-emerald-600 hover:underline"
                  >
                    Add your first destination
                  </button>
                </div>
              )}
            </div>

            {/* Links & Tips Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Social Links */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Social Links</h3>
                  <button
                    onClick={() => setShowSocialLinkModal(true)}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {profile.socialLinks.length > 0 ? (
                  <div className="space-y-3">
                    {profile.socialLinks.map((link) => {
                      const platform = SOCIAL_PLATFORMS[link.platform as SocialPlatform];
                      return (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group"
                        >
                          <span className="text-xl">{platform?.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{platform?.label}</p>
                            <p className="text-sm text-gray-500 truncate">{link.value}</p>
                          </div>
                          <a
                            href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteSocialLink(link.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No social links added</p>
                    <button
                      onClick={() => setShowSocialLinkModal(true)}
                      className="mt-2 text-sm text-emerald-600 hover:underline"
                    >
                      Add your first social link
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Links */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Tip Links</h3>
                  <button
                    onClick={() => setShowPaymentLinkModal(true)}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {profile.paymentLinks.length > 0 ? (
                  <div className="space-y-3">
                    {profile.paymentLinks.map((link) => {
                      const platform = PAYMENT_PLATFORMS[link.platform as PaymentPlatform];
                      return (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group"
                        >
                          <span className="text-xl">{platform?.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{platform?.label}</p>
                              {link.isPrimary && (
                                <span className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">
                                  Primary
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{link.value}</p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(link.value);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePaymentLink(link.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No tip links added</p>
                    <button
                      onClick={() => setShowPaymentLinkModal(true)}
                      className="mt-2 text-sm text-emerald-600 hover:underline"
                    >
                      Add your first tip method
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Account Settings</h3>
            <div className="space-y-6">
              {/* Profile Visibility */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  {profileVisibility === 'public' ? (
                    <Globe className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Profile Visibility</p>
                    <p className="text-sm text-gray-500">
                      {profileVisibility === 'public'
                        ? 'Anyone can view your public profile'
                        : 'Only you can see your profile'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleVisibility}
                  disabled={savingVisibility}
                  className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
                    profileVisibility === 'public' ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  {savingVisibility ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  ) : (
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                        profileVisibility === 'public' ? 'left-7' : 'left-1'
                      }`}
                    />
                  )}
                </button>
              </div>

              {/* Email Verification Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Email Verification</p>
                  <p className="text-sm text-gray-500">{profile.user.email}</p>
                </div>
                {profile.user.emailVerified ? (
                  <span className="flex items-center gap-1 text-sm text-emerald-600">
                    <Check className="w-4 h-4" />
                    Verified
                  </span>
                ) : (
                  <button className="text-sm text-emerald-600 hover:underline">
                    Verify Now
                  </button>
                )}
              </div>

              {/* Guide Mode */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Compass className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Guide Mode</p>
                      <p className="text-sm text-gray-600">
                        Offer your expertise as a local guide for travelers
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleGuideMode}
                    disabled={savingGuideMode}
                    className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
                      isGuide ? 'bg-amber-500' : 'bg-gray-300'
                    }`}
                  >
                    {savingGuideMode ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    ) : (
                      <div
                        className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                          isGuide ? 'left-7' : 'left-1'
                        }`}
                      />
                    )}
                  </button>
                </div>

                {isGuide && (
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    {editingGuideDetails ? (
                      <div className="space-y-4">
                        {/* Experience Level */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Experience Level
                          </label>
                          <select
                            value={guideDetails.experience_level || ''}
                            onChange={(e) => setGuideDetails(prev => ({
                              ...prev,
                              experience_level: e.target.value as any
                            }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          >
                            <option value="">Select experience level</option>
                            <option value="beginner">Beginner (1-2 years)</option>
                            <option value="intermediate">Intermediate (3-5 years)</option>
                            <option value="expert">Expert (5+ years)</option>
                          </select>
                        </div>

                        {/* Specialties */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Specialties
                          </label>
                          <input
                            type="text"
                            value={guideDetails.specialties?.join(', ') || ''}
                            onChange={(e) => setGuideDetails(prev => ({
                              ...prev,
                              specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            }))}
                            placeholder="e.g., Food tours, History, Adventure, Photography"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                        </div>

                        {/* Coverage Areas */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coverage Areas
                          </label>
                          <input
                            type="text"
                            value={guideDetails.coverage_areas?.join(', ') || ''}
                            onChange={(e) => setGuideDetails(prev => ({
                              ...prev,
                              coverage_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            }))}
                            placeholder="e.g., Tokyo, Kyoto, Osaka"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">Cities or regions you can guide in</p>
                        </div>

                        {/* Hourly Rate */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hourly Rate (USD)
                          </label>
                          <input
                            type="number"
                            value={guideDetails.hourly_rate || ''}
                            onChange={(e) => setGuideDetails(prev => ({
                              ...prev,
                              hourly_rate: e.target.value ? parseInt(e.target.value) : undefined
                            }))}
                            placeholder="e.g., 50"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>

                        {/* Guide Bio */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Guide Bio
                          </label>
                          <textarea
                            value={guideDetails.bio || ''}
                            onChange={(e) => setGuideDetails(prev => ({
                              ...prev,
                              bio: e.target.value
                            }))}
                            placeholder="Tell travelers about your experience, what makes your tours unique..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingGuideDetails(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveGuideDetails}
                            disabled={savingGuideMode}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                          >
                            {savingGuideMode ? 'Saving...' : 'Save Details'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {guideDetails.experience_level && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-gray-600">
                              {guideDetails.experience_level.charAt(0).toUpperCase() + guideDetails.experience_level.slice(1)} Guide
                            </span>
                          </div>
                        )}
                        {guideDetails.specialties && guideDetails.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {guideDetails.specialties.map((specialty, i) => (
                              <span key={i} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                                {specialty}
                              </span>
                            ))}
                          </div>
                        )}
                        {guideDetails.coverage_areas && guideDetails.coverage_areas.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {guideDetails.coverage_areas.join(', ')}
                          </p>
                        )}
                        {guideDetails.hourly_rate && (
                          <p className="text-sm font-medium text-gray-900">
                            ${guideDetails.hourly_rate}/hour
                          </p>
                        )}
                        <button
                          onClick={() => setEditingGuideDetails(true)}
                          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Edit Guide Details
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-medium text-red-600 mb-3">Danger Zone</h4>
                <button className="text-sm text-red-600 hover:underline">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AddTravelModal
        isOpen={showTravelModal}
        onClose={() => {
          setShowTravelModal(false);
          setEditingTravel(null);
        }}
        onSave={handleAddTravel}
        initialData={editingTravel ? {
          id: editingTravel.id,
          city: editingTravel.city,
          country: editingTravel.country,
          year: editingTravel.year,
          month: editingTravel.month,
          notes: editingTravel.notes,
          lat: editingTravel.lat,
          lng: editingTravel.lng,
        } : undefined}
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
        existingPlatforms={profile.socialLinks.map(l => l.platform)}
      />

      <AddLinkModal
        isOpen={showPaymentLinkModal}
        onClose={() => setShowPaymentLinkModal(false)}
        linkType="payment"
        onSave={handleAddPaymentLink}
        existingPlatforms={profile.paymentLinks.map(l => l.platform)}
      />
    </div>
  );
}
