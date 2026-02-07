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
import { UserProfile, SOCIAL_PLATFORMS, PAYMENT_PLATFORMS, SocialPlatform, PaymentPlatform } from '@/lib/types/user';
import dynamic from 'next/dynamic';
import AuthModal from '@/components/auth/AuthModal';

const TravelMapWithWishlist = dynamic(() => import('../TravelMapWithWishlist'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gradient-to-br from-[#A8E6CF] via-[#E8D5F2] to-[#FFE4EC] rounded-2xl animate-pulse" />,
});

interface GuideDetails {
  experience_level?: 'beginner' | 'intermediate' | 'expert';
  specialties?: string[];
  coverage_areas?: string[];
  hourly_rate?: number;
  bio?: string;
  google_calendar_embed?: string;
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

// Floating stickers data
const STICKERS = ['✈️', '🌸', '🗺️', '💝', '🌺', '⭐'];
const STICKER_POSITIONS = [
  { top: '10%', left: '5%', delay: '0s' },
  { top: '20%', right: '8%', delay: '1s' },
  { top: '45%', left: '3%', delay: '2s' },
  { top: '70%', right: '5%', delay: '0.5s' },
  { top: '85%', left: '10%', delay: '1.5s' },
  { top: '30%', right: '3%', delay: '2.5s' },
];

const SPARKLE_POSITIONS = [
  { top: '15%', left: '20%', delay: '0s' },
  { top: '35%', right: '15%', delay: '0.3s' },
  { top: '60%', left: '8%', delay: '0.6s' },
  { top: '80%', right: '20%', delay: '0.9s' },
];

export default function DreamyPassportDesign({
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCloneId, setPendingCloneId] = useState<string | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClone = async (tripId: string) => {
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        setPendingCloneId(tripId);
        setShowAuthModal(true);
        return;
      }

      setCloning(tripId);
      const response = await fetch(`/api/trips/${tripId}/clone`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        router.push(`/trips/${data.tripId}/collaborate`);
      }
    } catch (error) {
      console.error('Failed to clone:', error);
    } finally {
      setCloning(null);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingCloneId) {
      handleClone(pendingCloneId);
      setPendingCloneId(null);
    }
  };

  const socialLinks = profile.socialLinks || [];
  const paymentLinks = profile.paymentLinks || [];

  // Calculate stats
  const countriesCount = profile.travelHistory?.filter(t => !t.isWishlist).reduce((acc, t) => {
    if (!acc.includes(t.country)) acc.push(t.country);
    return acc;
  }, [] as string[]).length || 0;

  const publicTrips = itineraries.filter(t => t.visibility === 'public' || t.visibility === 'curated');

  return (
    <>
      {/* CSS Animations */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@400;600;700;800&display=swap');

        @keyframes dreamy-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(5deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-20px) rotate(3deg); }
        }

        @keyframes dreamy-sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
        }

        @keyframes dreamy-stamp-bounce {
          0% { transform: rotate(-15deg) scale(0); }
          60% { transform: rotate(-15deg) scale(1.2); }
          100% { transform: rotate(-15deg) scale(1); }
        }

        @keyframes dreamy-stamp-in {
          0% { opacity: 0; transform: scale(1.5); }
          100% { opacity: 1; }
        }

        @keyframes dreamy-slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes dreamy-heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1); }
          75% { transform: scale(1.15); }
        }

        @keyframes dreamy-marker-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .dreamy-float { animation: dreamy-float 6s ease-in-out infinite; }
        .dreamy-sparkle { animation: dreamy-sparkle 2s ease-in-out infinite; }
        .dreamy-stamp-bounce { animation: dreamy-stamp-bounce 0.5s ease-out 0.5s both; }
        .dreamy-stamp-in { animation: dreamy-stamp-in 0.4s ease-out both; }
        .dreamy-slide-up { animation: dreamy-slide-up 0.8s ease-out; }
        .dreamy-heartbeat { animation: dreamy-heartbeat 1.5s ease-in-out infinite; }
        .dreamy-marker-pulse { animation: dreamy-marker-pulse 2s ease-in-out infinite; }

        .font-caveat { font-family: 'Caveat', cursive; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-dm-sans { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen bg-[#FFF9F5] font-dm-sans relative overflow-x-hidden">
        {/* Paper texture overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Floating decorations */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {STICKERS.map((sticker, i) => (
            <span
              key={`sticker-${i}`}
              className="absolute text-3xl dreamy-float opacity-60"
              style={{
                ...STICKER_POSITIONS[i],
                animationDelay: STICKER_POSITIONS[i].delay,
              }}
            >
              {sticker}
            </span>
          ))}
          {SPARKLE_POSITIONS.map((pos, i) => (
            <span
              key={`sparkle-${i}`}
              className="absolute w-2.5 h-2.5 bg-[#FFD700] dreamy-sparkle"
              style={{
                ...pos,
                animationDelay: pos.delay,
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              }}
            />
          ))}
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#FFF9F5]/90 backdrop-blur-md border-b border-[#E8D5F2]/50 px-4 md:px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="text-2xl text-[#4A3728] hover:opacity-70 transition-opacity"
          >
            ←
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-full bg-white border border-[#E8D5F2] font-semibold text-[#4A3728] hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            {!isOwner && (
              <button
                onClick={isFollowing ? onUnfollow : onFollow}
                className="px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-[#FF7F7F] to-[#FF9A9A] shadow-lg shadow-[#FF7F7F]/30 hover:-translate-y-0.5 hover:shadow-xl transition-all"
              >
                {isFollowing ? 'Following ✨' : 'Follow ✨'}
              </button>
            )}
          </div>
        </header>

        <main className="relative z-10 pt-20">
          {/* Hero - Passport Card */}
          <section className="max-w-[900px] mx-auto my-12 px-4 md:px-6 dreamy-slide-up">
            <div className="bg-gradient-to-br from-[#E8D5F2] to-[#FFE4EC] rounded-3xl p-6 md:p-12 relative shadow-xl shadow-[#E8D5F2]/40 overflow-hidden">
              {/* Stripe pattern overlay */}
              <div
                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] pointer-events-none"
                style={{
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
                }}
              />

              <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start relative">
                {/* Avatar with stamp */}
                <div className="relative flex-shrink-0">
                  <img
                    src={profile.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.user.fullName || 'Anonymous'}`}
                    alt={profile.user.fullName || 'Profile'}
                    className="w-36 h-36 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-white shadow-xl"
                  />
                  {profile.user.emailVerified && (
                    <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-[#FF7F7F] rounded-full flex items-center justify-center text-white font-caveat text-sm font-bold -rotate-[15deg] border-[3px] border-dashed border-white dreamy-stamp-bounce">
                      Verified ✓
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <span className="font-caveat text-lg text-[#FF7F7F]">Traveler&apos;s Passport</span>
                  <h1 className="font-playfair text-3xl md:text-4xl font-extrabold text-[#4A3728] leading-tight mb-2">
                    {profile.user.fullName || 'Anonymous'}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3 text-sm text-[#6B5B4F]">
                    {profile.user.username && <span>@{profile.user.username}</span>}
                    {profile.user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {profile.user.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Globe className="w-4 h-4" /> Public Profile
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-pink-400" /> {followersCount.toLocaleString()} followers
                    </span>
                  </div>

                  {/* Social links */}
                  {socialLinks.length > 0 && (
                    <div className="flex gap-2 mt-4 justify-center md:justify-start">
                      {socialLinks.map((link) => {
                        const platform = SOCIAL_PLATFORMS[link.platform as SocialPlatform];
                        if (!platform) return null;
                        return (
                          <a
                            key={link.id}
                            href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-xl shadow-md hover:-translate-y-1 hover:rotate-[5deg] transition-all"
                          >
                            {platform.icon}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Visa stamps - Stats */}
              <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 pt-8 border-t-2 border-dashed border-[#4A3728]/15">
                <div className="text-center px-4 py-3 border-[3px] border-[#FF7F7F] rounded-lg -rotate-[3deg] dreamy-stamp-in" style={{ animationDelay: '0.7s' }}>
                  <div className="font-playfair text-3xl md:text-4xl font-extrabold text-[#4A3728]">{countriesCount}</div>
                  <div className="font-caveat text-sm text-[#8B7355]">Countries</div>
                </div>
                <div className="text-center px-4 py-3 border-[3px] border-[#A8E6CF] rounded-lg rotate-[2deg] dreamy-stamp-in" style={{ animationDelay: '0.9s' }}>
                  <div className="font-playfair text-3xl md:text-4xl font-extrabold text-[#4A3728]">{publicTrips.length}</div>
                  <div className="font-caveat text-sm text-[#8B7355]">Trips</div>
                </div>
                <div className="text-center px-4 py-3 border-[3px] border-[#E8D5F2] rounded-lg -rotate-[2deg] dreamy-stamp-in" style={{ animationDelay: '1.1s' }}>
                  <div className="font-playfair text-3xl md:text-4xl font-extrabold text-[#4A3728]">{profile.travelHistory?.filter(t => !t.isWishlist).length || 0}</div>
                  <div className="font-caveat text-sm text-[#8B7355]">Places</div>
                </div>
                <div className="text-center px-4 py-3 border-[3px] border-[#FFD700] rounded-lg rotate-[3deg] dreamy-stamp-in" style={{ animationDelay: '1.3s' }}>
                  <div className="font-playfair text-3xl md:text-4xl font-extrabold text-[#4A3728]">{profile.stats?.totalClones || 0}</div>
                  <div className="font-caveat text-sm text-[#8B7355]">Clones</div>
                </div>
              </div>
            </div>
          </section>

          {/* Polaroid Trips */}
          {publicTrips.length > 0 && (
            <section className="max-w-[1200px] mx-auto my-16 px-4 md:px-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📸</span>
                <h2 className="font-playfair text-2xl md:text-3xl text-[#4A3728]">My Adventures</h2>
              </div>
              <div className="flex gap-6 md:gap-8 overflow-x-auto pb-8 px-2 snap-x snap-mandatory scrollbar-hide">
                {publicTrips.map((trip, i) => {
                  const rotations = [-3, 2, -2, 4, -1, 3];
                  const rotation = rotations[i % rotations.length];
                  return (
                    <div
                      key={trip.id}
                      className="flex-shrink-0 w-64 md:w-72 bg-white p-3 pb-14 rounded shadow-xl cursor-pointer snap-start relative group transition-all duration-300 hover:rotate-0 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:z-10"
                      style={{ transform: `rotate(${rotation}deg)` }}
                      onClick={() => router.push(`/trips/${trip.id}`)}
                    >
                      {/* Tape */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-6 bg-[#FFD700]/60 rounded-sm" />
                      {trip.images && trip.images.length > 0 ? (
                        <img
                          src={trip.images[0]}
                          alt={trip.title}
                          className="w-full aspect-square object-cover rounded-sm"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gradient-to-br from-[#E8D5F2] to-[#FFE4EC] flex items-center justify-center rounded-sm">
                          <MapPin className="w-12 h-12 text-[#FF7F7F]/40" />
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 right-3 text-center font-caveat text-xl text-[#4A3728]">
                        {trip.title} ✨
                      </div>
                      {/* Clone button on hover */}
                      {!isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClone(trip.id);
                          }}
                          disabled={cloning === trip.id}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full font-semibold text-[#FF7F7F] shadow-lg hover:scale-105"
                        >
                          {cloning === trip.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            'Clone Trip'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Map */}
          <section className="max-w-[1000px] mx-auto my-16 px-4 md:px-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🗺️</span>
              <h2 className="font-playfair text-2xl md:text-3xl text-[#4A3728]">Where I&apos;ve Been</h2>
            </div>
            <div className="bg-gradient-to-br from-[#FFF5EE] to-[#FFE4EC] rounded-3xl p-4 md:p-8 shadow-xl shadow-[#E8D5F2]/30">
              <TravelMapWithWishlist
                travelHistory={profile.travelHistory || []}
                height="400px"
              />
            </div>
          </section>

          {/* About */}
          {profile.user.bio && (
            <section className="max-w-[700px] mx-auto my-16 px-6 text-center">
              <p className="text-lg md:text-xl leading-relaxed text-[#6B5B4F] italic">
                <span className="font-playfair text-4xl text-[#FF7F7F]/50 leading-none align-[-0.5rem]">&ldquo;</span>
                {profile.user.bio}
                <span className="font-playfair text-4xl text-[#FF7F7F]/50 leading-none align-[-0.5rem]">&rdquo;</span>
              </p>
            </section>
          )}

          {/* Support */}
          {paymentLinks.length > 0 && (
            <section className="bg-gradient-to-br from-[#FFE4EC] to-[#E8D5F2] py-16 px-6 text-center mt-16">
              <div className="text-5xl mb-4 dreamy-heartbeat">💝</div>
              <h2 className="font-playfair text-2xl md:text-3xl text-[#4A3728] mb-3">Support My Adventures</h2>
              <p className="text-[#6B5B4F] mb-6">If my guides helped you plan your trip, consider showing some love!</p>
              <div className="flex flex-wrap justify-center gap-3">
                {paymentLinks.map((link) => {
                  const platform = PAYMENT_PLATFORMS[link.platform as PaymentPlatform];
                  if (!platform) return null;
                  return (
                    <a
                      key={link.id}
                      href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 bg-white rounded-full font-semibold text-[#4A3728] shadow-md hover:-translate-y-1 hover:shadow-lg transition-all"
                    >
                      <span>{platform.icon}</span> {platform.label}
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingCloneId(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
