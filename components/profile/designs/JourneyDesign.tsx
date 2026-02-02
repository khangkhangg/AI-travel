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

interface ProfileDesignProps {
  profile: UserProfile;
  isOwner: boolean;
  isFollowing?: boolean;
  followersCount: number;
  onFollow?: () => void;
  onUnfollow?: () => void;
  itineraries?: any[];
}

export default function JourneyDesign({
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
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
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
                  className="px-4 py-2 bg-white text-zinc-900 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors"
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
              {profile.user.bio && (
                <p className="mt-6 text-lg text-zinc-300 max-w-2xl leading-[1.7] font-normal">
                  {profile.user.bio}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
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

      {/* Gamified Badge Grid */}
      {(badgeLevels.length > 0 || profile.badges.filter(b => BADGE_DEFINITIONS[b.badgeType as keyof typeof BADGE_DEFINITIONS]).length > 0) && (
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <BadgeGrid
              badges={badgeLevels}
              specialBadges={profile.badges
                .filter((badge) => BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS])
                .map(b => ({ type: b.badgeType, metadata: b.metadata }))}
              size="lg"
            />
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
      <section className="py-16 px-6">
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
