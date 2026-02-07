'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Copy,
  Check,
  Heart,
} from 'lucide-react';
import { UserProfile, SOCIAL_PLATFORMS, PAYMENT_PLATFORMS, SocialPlatform, PaymentPlatform } from '@/lib/types/user';
import dynamic from 'next/dynamic';
import AuthModal from '@/components/auth/AuthModal';

const TravelMapWithWishlist = dynamic(() => import('../TravelMapWithWishlist'), {
  ssr: false,
  loading: () => <div className="h-[350px] bg-[#f5f0e6] rounded-lg animate-pulse" />,
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

export default function DrifterDesign({
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCloneId, setPendingCloneId] = useState<string | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  const socialLinks = profile.socialLinks || [];
  const paymentLinks = profile.paymentLinks || [];
  const publicTrips = itineraries.filter(t => t.visibility === 'public' || t.visibility === 'curated');

  const handleCopyLink = () => {
    const url = `${window.location.origin}/profile/${profile.user.username || profile.user.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClone = async (tripId: string) => {
    setCloning(tripId);
    try {
      const res = await fetch(`/api/trips/${tripId}/clone`, { method: 'POST' });
      if (res.status === 401) {
        setPendingCloneId(tripId);
        setShowAuthModal(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        router.push(`/trips/${data.tripId}`);
      }
    } finally {
      setCloning(null);
    }
  };

  const visitedCount = profile.travelHistory?.filter(p => !p.isWishlist).length || 0;
  const countriesCount = new Set(profile.travelHistory?.filter(p => !p.isWishlist).map(p => p.country)).size;

  // Truncate bio to 150 words
  const truncateBio = (bio: string, wordLimit: number) => {
    const words = bio.split(/\s+/);
    if (words.length <= wordLimit) return { text: bio, isTruncated: false };
    return { text: words.slice(0, wordLimit).join(' ') + '...', isTruncated: true };
  };

  const bioInfo = profile.user.bio ? truncateBio(profile.user.bio, 72) : null;

  // Random casual notes for trips
  const casualNotes = [
    'was cool, ate a lot',
    'got lost, 10/10',
    'would go back maybe',
    'good vibes only',
    'found a nice cafe',
    'too hot tbh',
    'the locals were nice',
    'forgot my charger',
    'best noodles ever',
    'met cool people',
  ];

  return (
    <div className="min-h-screen bg-[#f5f0e6] text-[#3d3d3d] relative overflow-hidden" style={{ fontFamily: "'Comic Sans MS', 'Marker Felt', cursive" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');

        .font-handwritten {
          font-family: 'Caveat', cursive;
        }
        .drifter-paper {
          background: #f5f0e6;
          background-image:
            repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.02) 20px, rgba(0,0,0,0.02) 21px),
            repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.02) 20px, rgba(0,0,0,0.02) 21px);
        }
        .drifter-polaroid {
          background: white;
          padding: 12px 12px 40px;
          box-shadow: 2px 3px 8px rgba(0,0,0,0.15);
        }
        .drifter-postcard {
          background: white;
          box-shadow: 2px 3px 6px rgba(0,0,0,0.1);
        }
        .drifter-sticky {
          background: #fff59d;
          box-shadow: 2px 3px 6px rgba(0,0,0,0.15);
        }
        .drifter-tape {
          background: rgba(255,235,180,0.8);
          box-shadow: 1px 1px 3px rgba(0,0,0,0.1);
        }
        .drifter-coffee {
          background: radial-gradient(ellipse, rgba(139,90,43,0.15) 0%, transparent 70%);
        }
        .drifter-scribble {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='20'%3E%3Cpath d='M0,10 Q25,5 50,10 T100,10 T150,10 T200,10' stroke='%23999' stroke-width='2' fill='none'/%3E%3C/svg%3E");
          background-repeat: repeat-x;
          background-position: center;
        }
      `}</style>

      {/* Background decorations */}
      <div className="fixed inset-0 drifter-paper pointer-events-none" />

      {/* Coffee stain */}
      <div className="fixed w-32 h-32 rounded-full drifter-coffee top-10 right-16 pointer-events-none" />
      <div className="fixed w-24 h-24 rounded-full drifter-coffee bottom-40 left-20 pointer-events-none" />

      {/* Tape decorations */}
      <div className="fixed w-20 h-8 drifter-tape top-5 left-8 transform -rotate-12 pointer-events-none" />
      <div className="fixed w-16 h-6 drifter-tape top-20 right-24 transform rotate-6 pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f5f0e6]/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[#666] hover:text-[#333] transition-colors flex items-center gap-2 font-handwritten text-xl">
            <ArrowLeft className="w-4 h-4" />
            <span>back home</span>
          </Link>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#666] hover:text-[#333] font-handwritten text-lg"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'copied!' : 'share'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-16 px-4 md:px-8 max-w-4xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          {/* Polaroid avatar */}
          <div className="drifter-polaroid transform -rotate-3 flex-shrink-0">
            <img
              src={profile.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user.fullName || 'user'}`}
              alt={profile.user.fullName || 'Profile'}
              className="w-36 h-36 object-cover"
              style={{ filter: 'sepia(20%) contrast(90%)' }}
            />
            <p className="font-handwritten text-lg text-center text-[#666] mt-2">me, somewhere</p>
          </div>

          {/* User info */}
          <div className="flex-1 pt-4">
            <p className="text-sm text-[#999] line-through mb-1">Professional Bio:</p>
            <h1 className="font-handwritten text-4xl md:text-5xl text-[#2d2d2d] transform -rotate-1 mb-2">
              {profile.user.fullName ? `just ${profile.user.fullName.split(' ')[0].toLowerCase()}, tbh` : 'just me, tbh'}
            </h1>
            <p className="text-lg text-[#888] italic">
              idk, I travel sometimes? ¯\_(ツ)_/¯
            </p>

            {profile.user.location && (
              <p className="text-sm text-[#999] mt-3 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.user.location} (or wherever)
              </p>
            )}

            {/* Follow button */}
            {!isOwner && (
              <div className="mt-4">
                {isFollowing ? (
                  <button
                    onClick={onUnfollow}
                    className="px-4 py-2 text-[#888] font-handwritten text-xl hover:text-[#666]"
                  >
                    following (click to unfollow I guess)
                  </button>
                ) : (
                  <button
                    onClick={onFollow}
                    className="px-4 py-2 bg-[#5d4e37] text-white font-handwritten text-xl hover:bg-[#4a3f2c] rounded-sm transform rotate-1"
                  >
                    follow or whatever
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scribble divider */}
        <div className="h-8 drifter-scribble opacity-50 my-8" />

        {/* Stats and Social Links - Same Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
          {/* Stats */}
          <div className="flex gap-12">
            <div className="text-center">
              <div className="font-handwritten text-5xl text-[#5d4e37]">{countriesCount}ish</div>
              <div className="text-sm text-[#888]">countries (lost count)</div>
            </div>
            <div className="text-center">
              <div className="font-handwritten text-5xl text-[#5d4e37]">
                {followersCount > 100 ? 'some' : followersCount}
              </div>
              <div className="text-sm text-[#888]">followers I guess</div>
            </div>
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div>
              <p className="text-sm text-[#999] mb-2">find me maybe:</p>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link) => {
                  const platform = SOCIAL_PLATFORMS[link.platform as SocialPlatform];
                  if (!platform) return null;
                  return (
                    <a
                      key={link.id}
                      href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-sm shadow-sm hover:-translate-y-0.5 transition-transform font-handwritten text-lg text-[#666]"
                  >
                    <span>{platform.icon}</span>
                    <span>{platform.label.toLowerCase()}</span>
                  </a>
                );
              })}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="mb-12">
          <p className="font-handwritten text-2xl text-[#5d4e37] mb-4 flex items-center gap-2">
            <span className="text-2xl">🗺️</span> places I&apos;ve been to (I think)
          </p>
          <div className="bg-white p-4 shadow-md rounded-sm">
            <TravelMapWithWishlist
              travelHistory={profile.travelHistory || []}
              height="350px"
            />
          </div>
        </div>

        {/* Trips and Bio - Side by side layout */}
        {(publicTrips.length > 0 || (profile.user.bio && bioInfo)) && (
          <div className="mb-12 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
            {/* Trips as postcards (Left) */}
            {publicTrips.length > 0 && (
              <div>
                <p className="font-handwritten text-2xl text-[#5d4e37] mb-6">trip memories or something:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {publicTrips.slice(0, 6).map((trip, i) => (
                <div
                  key={trip.id}
                  className="drifter-postcard p-4"
                  style={{ transform: `rotate(${(i % 3 - 1) * 2}deg)` }}
                >
                  {trip.images && trip.images.length > 0 ? (
                    <img
                      src={trip.images[0]}
                      alt={trip.title}
                      className="w-full h-32 object-cover mb-3"
                      style={{ filter: 'sepia(10%) contrast(95%)' }}
                    />
                  ) : (
                    <div className="w-full h-32 bg-[#e8e0d4] flex items-center justify-center mb-3 rounded-sm">
                      <MapPin className="w-8 h-8 text-[#5d4e37]/30" />
                    </div>
                  )}
                  <h3 className="font-handwritten text-xl text-[#3d3d3d] mb-1">{trip.title}</h3>
                  <p className="text-xs text-[#999] mb-2">{trip.destinationCity}</p>
                  <p className="font-handwritten text-sm text-[#888] italic">
                    {casualNotes[i % casualNotes.length]}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-[#aaa]">
                      {new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    <Link
                      href={`/trips/${trip.shareCode || trip.id}`}
                      className="font-handwritten text-sm text-[#5d4e37] hover:underline"
                    >
                      see more →
                    </Link>
                  </div>
                </div>
              ))}
                </div>
              </div>
            )}

            {/* Bio as sticky note (Right) */}
            {profile.user.bio && bioInfo && (
              <div className="lg:sticky lg:top-20">
                <div className="drifter-sticky p-4 transform rotate-2">
                  <p className="font-handwritten text-lg text-[#5d4e37] leading-relaxed">
                    {bioExpanded ? profile.user.bio : bioInfo.text}
                  </p>
                  {bioInfo.isTruncated && (
                    <button
                      type="button"
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="font-handwritten text-sm text-[#5d4e37] underline mt-2 hover:text-[#3d2d1d] transition-colors"
                    >
                      {bioExpanded ? 'ok thats enough' : 'see more...'}
                    </button>
                  )}
                  <p className="font-handwritten text-sm text-[#999] mt-2">- me</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Support Section */}
        {paymentLinks.length > 0 && (
          <div className="drifter-sticky p-6 max-w-sm mx-auto transform -rotate-1 mb-12">
            <p className="font-handwritten text-2xl text-[#5d4e37] mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5" /> buy me a coffee?
            </p>
            <p className="text-sm text-[#888] mb-4">if you feel like it, no pressure</p>
            <div className="flex flex-wrap gap-2">
              {paymentLinks.map((link) => {
                const platform = PAYMENT_PLATFORMS[link.platform as PaymentPlatform];
                if (!platform) return null;
                return (
                  <a
                    key={link.id}
                    href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#5d4e37] text-white font-handwritten text-lg hover:bg-[#4a3f2c] rounded-sm"
                  >
                    <span>{platform.icon}</span>
                    <span>{platform.label.toLowerCase()}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center mt-16">
          <p className="font-handwritten text-lg text-[#aaa] italic">
            remind me to update this page eventually...
          </p>
        </div>

        {/* Random sticky note */}
        <div className="fixed bottom-8 right-8 drifter-sticky p-3 w-40 transform rotate-6 hidden md:block">
          <p className="font-handwritten text-sm text-[#5d4e37]">
            note to self: go outside more
          </p>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setPendingCloneId(null);
          }}
          onSuccess={() => {
            setShowAuthModal(false);
            if (pendingCloneId) {
              handleClone(pendingCloneId);
            }
          }}
        />
      )}
    </div>
  );
}
