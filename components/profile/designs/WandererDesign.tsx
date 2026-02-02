'use client';

import { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { UserProfile, SOCIAL_PLATFORMS, PAYMENT_PLATFORMS, BADGE_DEFINITIONS, SocialPlatform, PaymentPlatform } from '@/lib/types/user';
import dynamic from 'next/dynamic';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { UserBadgeLevel } from '@/lib/badges';
import AuthModal from '@/components/auth/AuthModal';

const TravelMapWithWishlist = dynamic(() => import('../TravelMapWithWishlist'), {
  ssr: false,
  loading: () => <div className="h-[500px] bg-gray-100 animate-pulse" />,
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

export default function WandererDesign({
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
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
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

  return (
    <div className="min-h-screen bg-white font-[var(--font-plus-jakarta)]">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
              {isOwner ? (
                <Link
                  href="/profile"
                  className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Edit Profile
                </Link>
              ) : (
                <button
                  onClick={isFollowing ? onUnfollow : onFollow}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 px-6 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile.user.avatarUrl ? (
                  <img
                    src={profile.user.avatarUrl}
                    alt={profile.user.fullName}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover ring-4 ring-white/30 shadow-2xl"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center ring-4 ring-white/30 shadow-2xl">
                    <span className="text-5xl font-bold text-white">
                      {(profile.user.fullName || 'A')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                  {(profile.user.fullName || 'Anonymous').toUpperCase()}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-white/80">
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

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xl font-bold text-white">{followersCount}</span>
                  <span className="text-white/70">followers</span>
                </div>

                {/* Social Icons */}
                {profile.socialLinks.length > 0 && (
                  <div className="mt-6 flex items-center gap-3">
                    {profile.socialLinks.map((link) => {
                      const platform = SOCIAL_PLATFORMS[link.platform as SocialPlatform];
                      return (
                        <a
                          key={link.id}
                          href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition-colors text-white text-lg"
                          title={platform?.label}
                        >
                          {platform?.icon}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-wrap justify-center gap-12 md:gap-20">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-black text-gray-900">{profile.stats.countriesVisited}</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">Countries</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-black text-gray-900">{profile.stats.itinerariesCount}</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">Trips</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-black text-gray-900">{profile.stats.totalClones}</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">Clones</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-black text-gray-900">{visitedPlaces.length}</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">Visited</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-black text-amber-500">{wishlistPlaces.length}</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">Wishlist</p>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-emerald-600 tracking-wide">PLACES</p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mt-1">
                Where I've Been
              </h2>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-gray-500">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                Visited
              </span>
              <span className="flex items-center gap-2 text-gray-500">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                Wishlist
              </span>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-100">
            <TravelMapWithWishlist
              travelHistory={profile.travelHistory}
              height="500px"
            />
          </div>
        </div>
      </section>

      {/* Itineraries - Horizontal Scroll */}
      {itineraries.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-sm font-semibold text-emerald-600 tracking-wide">JOURNEYS</p>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mt-1">
                  Itineraries
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={scrollLeft}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={scrollRight}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Horizontal Scroll Container */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {itineraries.map((trip) => {
                const images = trip.images || [];
                const placeholderColors = ['from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-violet-400 to-purple-500', 'from-rose-400 to-pink-500'];
                const colorIndex = trip.id ? trip.id.charCodeAt(0) % placeholderColors.length : 0;
                const placesCount = trip.itemCount || trip.placesCount || 0;

                return (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="flex-shrink-0 w-[300px] snap-start group"
                  >
                    {/* Image Collage */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
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
                        <div className={`w-full h-full bg-gradient-to-br ${placeholderColors[colorIndex]} flex items-center justify-center`}>
                          <MapPin className="w-16 h-16 text-white/30" />
                        </div>
                      )}

                      {/* Top left badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {placesCount > 0 && (
                          <div className="px-2.5 py-1 bg-gray-900/70 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                            {placesCount} places
                          </div>
                        )}
                        {trip.cloneCount > 0 && (
                          <div className="px-2.5 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center gap-1">
                            <Copy className="w-3 h-3" />
                            {trip.cloneCount}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          onClick={(e) => { e.preventDefault(); }}
                          className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-rose-500 hover:bg-white transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleClone(trip.id);
                          }}
                          disabled={cloning === trip.id}
                          className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-emerald-500 hover:bg-white transition-colors disabled:opacity-50"
                          title="Clone this itinerary"
                        >
                          <Copy className={`w-4 h-4 ${cloning === trip.id ? 'animate-pulse' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Trip Info */}
                    <div className="mt-4">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {trip.title}
                      </h3>
                      {trip.destinationCity && (
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {trip.destinationCity}, {trip.destinationCountry}
                        </p>
                      )}
                      <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5">
                        {profile.user.avatarUrl ? (
                          <img src={profile.user.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs text-emerald-700">
                            {(profile.user.fullName || 'A')[0].toUpperCase()}
                          </span>
                        )}
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

      {/* About Section */}
      {profile.user.bio && (
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-emerald-600 tracking-wide">ABOUT ME</p>
            <p className="text-lg md:text-xl text-gray-600 leading-[1.8] mt-4 font-normal">
              {profile.user.bio}
            </p>

            {/* Gamified Badge Grid */}
            {(badgeLevels.length > 0 || profile.badges.filter(b => BADGE_DEFINITIONS[b.badgeType as keyof typeof BADGE_DEFINITIONS]).length > 0) && (
              <div className="flex justify-center mt-8">
                <BadgeGrid
                  badges={badgeLevels}
                  specialBadges={profile.badges
                    .filter((badge) => BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS])
                    .map(b => ({ type: b.badgeType, metadata: b.metadata }))}
                  size="lg"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Support Section */}
      {profile.paymentLinks.length > 0 && (
        <section className="py-16 px-6 bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              Support My Travels
            </h2>
            <p className="text-gray-600 mt-3 mb-8">
              If my guides helped you plan your adventure, consider buying me a coffee!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {profile.paymentLinks.map((link) => {
                const platform = PAYMENT_PLATFORMS[link.platform as PaymentPlatform];
                return (
                  <a
                    key={link.id}
                    href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                      link.isPrimary
                        ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg hover:shadow-xl'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span className="text-lg">{platform?.icon}</span>
                    <span>{platform?.label}</span>
                    <ExternalLink className="w-4 h-4 opacity-50" />
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
