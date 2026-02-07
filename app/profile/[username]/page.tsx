'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { UserProfile } from '@/lib/types/user';
import ProfileSidebar, { SectionId, SubItemId } from '@/components/profile/ProfileSidebar';

// Dynamically import design components
const JourneyDesign = dynamic(() => import('@/components/profile/designs/JourneyDesign'), {
  ssr: false,
  loading: () => <LoadingState />,
});

const ExplorerDesign = dynamic(() => import('@/components/profile/designs/ExplorerDesign'), {
  ssr: false,
  loading: () => <LoadingState />,
});

const DreamyPassportDesign = dynamic(() => import('@/components/profile/designs/DreamyPassportDesign'), {
  ssr: false,
  loading: () => <LoadingState />,
});

const WanderlustDiaryDesign = dynamic(() => import('@/components/profile/designs/WanderlustDiaryDesign'), {
  ssr: false,
  loading: () => <LoadingState />,
});

const CyberdeckDesign = dynamic(() => import('@/components/profile/designs/CyberdeckDesign'), {
  ssr: false,
  loading: () => <LoadingState />,
});

const HologramDesign = dynamic(() => import('@/components/profile/designs/HologramDesign'), {
  ssr: false,
  loading: () => <LoadingState />,
});

const DrifterDesign = dynamic(() => import('@/components/profile/designs/DrifterDesign'), {
  ssr: false,
  loading: () => <LoadingState />,
});

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );
}

type ProfileDesign = 'journey' | 'explorer' | 'dreamy-passport' | 'wanderlust-diary' | 'cyberdeck' | 'hologram' | 'drifter';

interface GuideDetails {
  experience_level?: 'beginner' | 'intermediate' | 'expert';
  specialties?: string[];
  coverage_areas?: string[];
  hourly_rate?: number;
  bio?: string;
}

interface PublicProfileData {
  user: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
    profileVisibility?: string;
    profileTheme?: string;
    createdAt: string;
    isGuide?: boolean;
    guideDetails?: GuideDetails;
  };
  isOwner: boolean;
  socialLinks: { id: string; platform: string; value: string }[];
  paymentLinks: { id: string; platform: string; value: string; isPrimary: boolean }[];
  travelHistory: { id: string; userId: string; city: string; country: string; year?: number; month?: number; lat?: number; lng?: number; isWishlist?: boolean; createdAt: string }[];
  badges: { id: string; badgeType: string; metadata?: any; earnedAt: string }[];
  stats: { tripCount: number; countriesCount: number; totalClones: number };
  trips: any[];
  followersCount: number;
  isFollowing: boolean;
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [design, setDesign] = useState<ProfileDesign>('journey');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar state for owner view
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [activeSubItem, setActiveSubItem] = useState<SubItemId | null>(null);

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load profile');
        }
        return;
      }
      const data = await response.json();
      setProfile({
        ...data,
        followersCount: data.followersCount || 0,
        isFollowing: data.isFollowing || false,
      });
      // Use the user's selected theme
      if (data.user?.profileTheme) {
        setDesign(data.user.profileTheme as ProfileDesign);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    try {
      await fetch(`/api/users/${profile.user.id}/follow`, { method: 'POST' });
      setProfile(prev => prev ? {
        ...prev,
        isFollowing: true,
        followersCount: prev.followersCount + 1,
      } : null);
    } catch (error) {
      console.error('Failed to follow:', error);
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;
    try {
      await fetch(`/api/users/${profile.user.id}/follow`, { method: 'DELETE' });
      setProfile(prev => prev ? {
        ...prev,
        isFollowing: false,
        followersCount: Math.max(0, prev.followersCount - 1),
      } : null);
    } catch (error) {
      console.error('Failed to unfollow:', error);
    }
  };

  const handleSectionChange = (section: SectionId, subItem?: SubItemId) => {
    // Navigate to the private profile page with the selected section
    const sectionPath = section === 'dashboard' ? '' : `?section=${section}${subItem ? `&sub=${subItem}` : ''}`;
    window.location.href = `/profile${sectionPath}`;
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{error || 'Profile not found'}</h2>
          <p className="text-gray-500 mb-4">This profile doesn't exist or is private.</p>
          <Link href="/" className="text-emerald-600 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Transform profile data to match design component props
  const profileData: UserProfile = {
    user: {
      id: profile.user.id,
      email: '',
      username: profile.user.username,
      fullName: profile.user.name,
      avatarUrl: profile.user.avatarUrl,
      bio: profile.user.bio,
      location: profile.user.location,
      profileVisibility: profile.user.profileVisibility as any,
      emailVerified: true,
      createdAt: profile.user.createdAt,
      updatedAt: profile.user.createdAt,
    },
    socialLinks: profile.socialLinks.map(l => ({
      id: l.id,
      userId: profile.user.id,
      platform: l.platform as any,
      value: l.value,
      createdAt: profile.user.createdAt,
    })),
    paymentLinks: profile.paymentLinks.map(l => ({
      id: l.id,
      userId: profile.user.id,
      platform: l.platform as any,
      value: l.value,
      isPrimary: l.isPrimary,
      createdAt: profile.user.createdAt,
    })),
    travelHistory: profile.travelHistory.map(t => ({
      id: t.id,
      userId: t.userId,
      city: t.city,
      country: t.country,
      year: t.year,
      month: t.month,
      lat: t.lat,
      lng: t.lng,
      isWishlist: t.isWishlist,
      createdAt: t.createdAt,
    })),
    badges: profile.badges.map(b => ({
      id: b.id,
      userId: profile.user.id,
      badgeType: b.badgeType as any,
      metadata: b.metadata,
      earnedAt: b.earnedAt,
    })),
    stats: {
      itinerariesCount: profile.stats.tripCount,
      publicItinerariesCount: profile.stats.tripCount,
      totalClones: profile.stats.totalClones || 0,
      totalViews: 0,
      countriesVisited: profile.stats.countriesCount,
    },
  };

  // Common props for all designs
  const designProps = {
    profile: profileData,
    isOwner: profile.isOwner,
    isFollowing: profile.isFollowing,
    followersCount: profile.followersCount,
    onFollow: handleFollow,
    onUnfollow: handleUnfollow,
    itineraries: profile.trips,
    isGuide: profile.user.isGuide,
    guideDetails: profile.user.guideDetails,
  };

  // Render the selected design
  const renderDesign = () => {
    switch (design) {
      case 'explorer':
        return <ExplorerDesign {...designProps} />;
      case 'dreamy-passport':
        return <DreamyPassportDesign {...designProps} />;
      case 'wanderlust-diary':
        return <WanderlustDiaryDesign {...designProps} />;
      case 'cyberdeck':
        return <CyberdeckDesign {...designProps} />;
      case 'hologram':
        return <HologramDesign {...designProps} />;
      case 'drifter':
        return <DrifterDesign {...designProps} />;
      case 'journey':
      default:
        return <JourneyDesign {...designProps} />;
    }
  };

  // If owner is viewing their own public profile, show sidebar
  if (profile.isOwner) {
    return (
      <div className="flex h-screen bg-zinc-950">
        {/* Sidebar */}
        <ProfileSidebar
          user={{
            id: profile.user.id,
            fullName: profile.user.name,
            username: profile.user.username,
            avatarUrl: profile.user.avatarUrl,
            email: '',
          }}
          isGuide={profile.user.isGuide || false}
          activeSection={activeSection}
          activeSubItem={activeSubItem}
          onSectionChange={handleSectionChange}
          variant="dark"
          previewMode={true}
        />

        {/* Main Content - Public Profile Preview */}
        <main className="flex-1 overflow-auto relative z-0">
          {renderDesign()}
        </main>
      </div>
    );
  }

  // Non-owner view - no sidebar
  return renderDesign();
}
