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
  Calendar,
  Heart,
} from 'lucide-react';
import { UserProfile, SOCIAL_PLATFORMS, PAYMENT_PLATFORMS, BADGE_DEFINITIONS, SocialPlatform, PaymentPlatform } from '@/lib/types/user';
import dynamic from 'next/dynamic';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { UserBadgeLevel } from '@/lib/badges';
import AuthModal from '@/components/auth/AuthModal';

const TravelMapWithWishlist = dynamic(() => import('../TravelMapWithWishlist'), {
  ssr: false,
  loading: () => <div className="h-full min-h-[400px] bg-gray-100 animate-pulse" />,
});

interface ProfileDesignProps {
  profile: UserProfile;
  isOwner: boolean;
  isFollowing?: boolean;
  followersCount: number;
  onFollow?: () => void;
  onUnfollow?: () => void;
  itineraries?: any[];
}

export default function ExplorerDesign({
  profile,
  isOwner,
  isFollowing,
  followersCount,
  onFollow,
  onUnfollow,
  itineraries = [],
}: ProfileDesignProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [badgeLevels, setBadgeLevels] = useState<UserBadgeLevel[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCloneId, setPendingCloneId] = useState<string | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

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
          setPendingCloneId(tripId);
          setShowAuthModal(true);
          return;
        }
        throw new Error(data.error || 'Failed to clone trip');
      }

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
      await handleClone(pendingCloneId);
      setPendingCloneId(null);
    }
  };

  const visitedPlaces = profile.travelHistory.filter(p => !p.isWishlist);
  const wishlistPlaces = profile.travelHistory.filter(p => p.isWishlist);

  const memberSince = new Date(profile.user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-stone-50 font-[var(--font-plus-jakarta)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-stone-500 hover:text-stone-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              {isOwner ? (
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
                >
                  Edit
                </Link>
              ) : (
                <button
                  onClick={isFollowing ? onUnfollow : onFollow}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isFollowing
                      ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Columns */}
      <div className="pt-16 flex flex-col lg:flex-row min-h-screen">
        {/* Left Column - Profile Info */}
        <div className="w-full lg:w-[400px] xl:w-[450px] lg:flex-shrink-0 bg-white border-r border-stone-200 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
          <div className="p-8 lg:p-10">
            {/* Vertical Text Accent */}
            <div className="hidden lg:block absolute left-4 top-24 text-[10px] tracking-[0.4em] text-stone-300 font-semibold transform -rotate-90 origin-left">
              EXPLORER
            </div>

            {/* Avatar */}
            <div className="mb-8">
              {profile.user.avatarUrl ? (
                <img
                  src={profile.user.avatarUrl}
                  alt={profile.user.fullName}
                  className="w-24 h-24 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {(profile.user.fullName || 'A')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">
              {(profile.user.fullName || 'Anonymous').toUpperCase()}
            </h1>

            {profile.user.username && (
              <p className="text-stone-500 mt-1">@{profile.user.username}</p>
            )}

            {/* Meta Info */}
            <div className="mt-4 space-y-2 text-sm text-stone-500">
              {profile.user.location && (
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {profile.user.location}
                </p>
              )}
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined {memberSince}
              </p>
              <p className="flex items-center gap-2">
                {profile.user.profileVisibility === 'public' ? (
                  <Globe className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {profile.user.profileVisibility === 'public' ? 'Public Profile' : 'Private Profile'}
              </p>
            </div>

            {/* Followers */}
            <div className="mt-6 flex items-center gap-1">
              <span className="text-2xl font-bold text-stone-900">{followersCount}</span>
              <span className="text-stone-500">followers</span>
            </div>

            {/* Bio */}
            {profile.user.bio && (
              <div className="mt-8 pt-8 border-t border-stone-100">
                <h3 className="text-xs font-semibold tracking-widest text-stone-400 mb-3">BIO</h3>
                <p className="text-stone-600 leading-[1.7] font-normal text-[15px]">{profile.user.bio}</p>
              </div>
            )}

            {/* Gamified Badge Grid */}
            {(badgeLevels.length > 0 || profile.badges.filter(b => BADGE_DEFINITIONS[b.badgeType as keyof typeof BADGE_DEFINITIONS]).length > 0) && (
              <div className="mt-8 pt-8 border-t border-stone-100">
                <h3 className="text-xs font-semibold tracking-widest text-stone-400 mb-3">BADGES</h3>
                <BadgeGrid
                  badges={badgeLevels}
                  specialBadges={profile.badges
                    .filter((badge) => BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS])
                    .map(b => ({ type: b.badgeType, metadata: b.metadata }))}
                  size="md"
                />
              </div>
            )}

            {/* Social Links */}
            {profile.socialLinks.length > 0 && (
              <div className="mt-8 pt-8 border-t border-stone-100">
                <h3 className="text-xs font-semibold tracking-widest text-stone-400 mb-3">CONNECT</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.socialLinks.map((link) => {
                    const platform = SOCIAL_PLATFORMS[link.platform as SocialPlatform];
                    return (
                      <a
                        key={link.id}
                        href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 flex items-center justify-center bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors text-lg"
                        title={platform?.label}
                      >
                        {platform?.icon}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="flex-1 min-w-0">
          {/* Map Section */}
          <div className="p-6 lg:p-10">
            <div className="mb-8">
              <h2 className="text-xs font-semibold tracking-widest text-stone-400 mb-1">TRAVEL MAP</h2>
              <div className="flex items-center gap-6 text-sm text-stone-500">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {visitedPlaces.length} visited
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {wishlistPlaces.length} wishlist
                </span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
              <TravelMapWithWishlist
                travelHistory={profile.travelHistory}
                height="400px"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 lg:px-10 py-8 bg-white border-y border-stone-200">
            <div className="flex flex-wrap gap-12">
              <div>
                <p className="text-4xl font-black text-stone-900">{profile.stats.countriesVisited}</p>
                <p className="text-xs tracking-widest text-stone-400 mt-1">COUNTRIES</p>
              </div>
              <div>
                <p className="text-4xl font-black text-stone-900">{visitedPlaces.length}</p>
                <p className="text-xs tracking-widest text-stone-400 mt-1">PLACES</p>
              </div>
              <div>
                <p className="text-4xl font-black text-stone-900">{profile.stats.itinerariesCount}</p>
                <p className="text-xs tracking-widest text-stone-400 mt-1">TRIPS</p>
              </div>
              <div>
                <p className="text-4xl font-black text-stone-900">{profile.stats.totalClones}</p>
                <p className="text-xs tracking-widest text-stone-400 mt-1">CLONES</p>
              </div>
            </div>
          </div>

          {/* Itineraries */}
          {itineraries.length > 0 && (
            <div className="p-6 lg:p-10">
              <h2 className="text-xs font-semibold tracking-widest text-stone-400 mb-6">ITINERARIES</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {itineraries.map((trip) => {
                  const images = trip.images || [];
                  const placeholderColors = ['from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-violet-400 to-purple-500', 'from-rose-400 to-pink-500'];
                  const placesCount = trip.itemCount || trip.placesCount || 0;

                  return (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      className="group block"
                    >
                      {/* Image Collage */}
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                        {images.length >= 3 ? (
                          <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-full">
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
                        ) : images.length === 1 ? (
                          <img src={images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${placeholderColors[Math.floor(Math.random() * placeholderColors.length)]} flex items-center justify-center`}>
                            <MapPin className="w-12 h-12 text-white/30" />
                          </div>
                        )}

                        {/* Top left badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          {placesCount > 0 && (
                            <div className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-stone-700">
                              {placesCount} places
                            </div>
                          )}
                          {trip.cloneCount > 0 && (
                            <div className="px-2 py-0.5 bg-emerald-500/90 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center gap-1">
                              <Copy className="w-3 h-3" />
                              {trip.cloneCount}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.preventDefault(); }}
                            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-stone-500 hover:text-rose-500 transition-colors"
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleClone(trip.id);
                            }}
                            disabled={cloning === trip.id}
                            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-stone-500 hover:text-emerald-500 transition-colors disabled:opacity-50"
                            title="Clone this itinerary"
                          >
                            <Copy className={`w-4 h-4 ${cloning === trip.id ? 'animate-pulse' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Trip Info */}
                      <div className="mt-3">
                        <h3 className="font-bold text-stone-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {trip.title}
                        </h3>
                        {trip.destinationCity && (
                          <p className="text-stone-500 text-sm mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {trip.destinationCity}, {trip.destinationCountry}
                          </p>
                        )}
                        <p className="text-stone-400 text-sm mt-1 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-700">
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
          )}

          {/* Tip Section */}
          {profile.paymentLinks.length > 0 && (
            <div className="p-6 lg:p-10">
              <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl p-8 border border-rose-100">
                <h2 className="text-xs font-semibold tracking-widest text-rose-400 mb-4">SUPPORT MY TRAVELS</h2>
                <p className="text-stone-600 mb-6">If my guides helped you, consider supporting my next adventure!</p>
                <div className="flex flex-wrap gap-3">
                  {profile.paymentLinks.map((link) => {
                    const platform = PAYMENT_PLATFORMS[link.platform as PaymentPlatform];
                    return (
                      <a
                        key={link.id}
                        href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          link.isPrimary
                            ? 'bg-rose-500 text-white hover:bg-rose-600'
                            : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                        }`}
                      >
                        <span>{platform?.icon}</span>
                        <span>{platform?.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
