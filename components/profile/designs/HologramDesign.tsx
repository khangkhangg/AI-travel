'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Heart,
} from 'lucide-react';
import { UserProfile, SOCIAL_PLATFORMS, PAYMENT_PLATFORMS, SocialPlatform, PaymentPlatform } from '@/lib/types/user';
import dynamic from 'next/dynamic';
import AuthModal from '@/components/auth/AuthModal';

const TravelMapWithWishlist = dynamic(() => import('../TravelMapWithWishlist'), {
  ssr: false,
  loading: () => <div className="h-[450px] bg-gradient-to-br from-[#0a0a1a] to-[#1a0a2e] animate-pulse" />,
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

export default function HologramDesign({
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] to-[#1a0a2e] text-white relative overflow-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap');

        @keyframes holo-scan {
          0% { top: 0; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes holo-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes holo-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes holo-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .holo-scanline {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, cyan, transparent);
          animation: holo-scan 3s linear infinite;
          pointer-events: none;
        }
        .holo-ring {
          animation: holo-rotate 10s linear infinite;
        }
        .holo-pulse {
          animation: holo-pulse 2s ease-in-out infinite;
        }
        .holo-float {
          animation: holo-float 4s ease-in-out infinite;
        }
        .holo-gradient-text {
          background: linear-gradient(90deg, #00ffff, #ff00ff, #00ffff);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .holo-hex-grid {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300ffff' fill-opacity='0.08'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .holo-clip {
          clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);
        }
        .font-orbitron {
          font-family: 'Orbitron', sans-serif;
        }
      `}</style>

      {/* Scanline */}
      <div className="holo-scanline" />

      {/* Hex grid background */}
      <div className="fixed inset-0 holo-hex-grid opacity-30" />

      {/* Grid lines */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(0,255,255,0.03) 100px, rgba(0,255,255,0.03) 101px),
          repeating-linear-gradient(0deg, transparent, transparent 100px, rgba(255,0,255,0.03) 100px, rgba(255,0,255,0.03) 101px)
        `
      }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a1a]/90 border-b border-cyan-500/30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 font-orbitron text-sm tracking-wider">
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-cyan-400/50 font-orbitron tracking-widest">
            <span>TRAVELER.PROFILE.v2.4</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 border border-cyan-500/50 hover:bg-cyan-500/10 transition-colors text-sm font-orbitron tracking-wider"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'COPIED' : 'SHARE'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-16 px-4 max-w-5xl mx-auto relative z-10">
        {/* Avatar Section */}
        <div className="text-center mb-12">
          <div className="relative w-44 h-44 mx-auto mb-8">
            {/* Rotating ring */}
            <div className="absolute inset-[-12px] rounded-full border-2 border-cyan-400 holo-ring">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_20px_cyan]" />
            </div>
            {/* Avatar */}
            <img
              src={profile.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.user.fullName || 'User'}`}
              alt={profile.user.fullName || 'Profile'}
              className="w-full h-full rounded-full object-cover border-4 border-fuchsia-500/50 saturate-125"
            />
          </div>

          {/* Name */}
          <h1 className="font-orbitron text-4xl md:text-5xl lg:text-6xl font-light tracking-[0.2em] holo-gradient-text mb-4">
            {(profile.user.fullName || 'ANONYMOUS').toUpperCase()}
          </h1>
          <p className="text-white/50 text-sm tracking-[0.2em] font-orbitron">
            @{profile.user.username || 'unknown'} • digital nomad
          </p>

          {/* Location */}
          {profile.user.location && (
            <p className="text-cyan-400/60 text-sm mt-2 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              {profile.user.location}
            </p>
          )}
        </div>

        {/* Stats Panel */}
        <div className="holo-clip bg-cyan-500/5 border border-cyan-500/20 p-8 mb-12">
          <div className="flex justify-center gap-12 md:gap-20">
            <div className="text-center">
              <div className="text-5xl font-light text-cyan-400 font-orbitron" style={{ textShadow: '0 0 30px rgba(0,255,255,0.5)' }}>
                {countriesCount}
              </div>
              <div className="text-xs tracking-[0.3em] text-white/40 mt-2 font-orbitron">COUNTRIES</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-light text-cyan-400 font-orbitron" style={{ textShadow: '0 0 30px rgba(0,255,255,0.5)' }}>
                {followersCount >= 1000 ? `${(followersCount/1000).toFixed(1)}K` : followersCount}
              </div>
              <div className="text-xs tracking-[0.3em] text-white/40 mt-2 font-orbitron">FOLLOWERS</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-light text-cyan-400 font-orbitron" style={{ textShadow: '0 0 30px rgba(0,255,255,0.5)' }}>
                {publicTrips.length}
              </div>
              <div className="text-xs tracking-[0.3em] text-white/40 mt-2 font-orbitron">EXPEDITIONS</div>
            </div>
          </div>

          {/* Follow button */}
          {!isOwner && (
            <div className="flex justify-center mt-8">
              {isFollowing ? (
                <button
                  onClick={onUnfollow}
                  className="px-8 py-3 border border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500/10 transition-colors font-orbitron tracking-wider"
                >
                  FOLLOWING
                </button>
              ) : (
                <button
                  onClick={onFollow}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white hover:opacity-90 transition-opacity font-orbitron tracking-wider font-bold"
                >
                  FOLLOW
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.user.bio && (
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-white/70 text-lg leading-relaxed italic">
              &ldquo;{profile.user.bio}&rdquo;
            </p>
          </div>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 mb-12">
            {socialLinks.map((link) => {
              const platform = SOCIAL_PLATFORMS[link.platform as SocialPlatform];
              if (!platform) return null;
              return (
                <a
                  key={link.id}
                  href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center border border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all text-xl holo-float"
                  style={{ animationDelay: `${Math.random() * 2}s` }}
                >
                  {platform.icon}
                </a>
              );
            })}
          </div>
        )}

        {/* Map Section */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-cyan-500/50" />
            <h2 className="font-orbitron text-xl tracking-[0.3em] text-white/80">TERRITORY MAP</h2>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-cyan-500/50" />
          </div>
          <div className="border border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
            <TravelMapWithWishlist
              travelHistory={profile.travelHistory || []}
              height="450px"
              darkMode={true}
            />
          </div>
        </div>

        {/* Trips Grid */}
        {publicTrips.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-fuchsia-500/50" />
              <h2 className="font-orbitron text-xl tracking-[0.3em] text-white/80">EXPEDITIONS</h2>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-fuchsia-500/50" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicTrips.slice(0, 6).map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.shareCode || trip.id}`}
                  className="relative bg-fuchsia-500/10 border border-fuchsia-500/30 group hover:border-fuchsia-400/50 transition-all overflow-hidden"
                >
                  {/* Trip Image */}
                  <div className="aspect-video relative overflow-hidden">
                    {trip.images && trip.images.length > 0 ? (
                      <img
                        src={trip.images[0]}
                        alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-fuchsia-400/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent" />
                    {/* Holographic overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-fuchsia-500/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {/* Trip Info */}
                  <div className="p-4 relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent" />
                    <h3 className="font-semibold text-white mb-1 truncate">{trip.title}</h3>
                    <p className="text-xs text-white/40 mb-2">{trip.destinationCity}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-fuchsia-400/60">
                        {new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-cyan-400 group-hover:text-cyan-300">
                        VIEW →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Support Section */}
        {paymentLinks.length > 0 && (
          <div className="text-center py-12 px-6 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-cyan-500/10 border border-white/10">
            <h3 className="font-orbitron text-2xl tracking-wider mb-4 flex items-center justify-center gap-3">
              <Heart className="w-6 h-6 text-fuchsia-400" />
              <span className="holo-gradient-text">SUPPORT TRAVELER</span>
            </h3>
            <p className="text-white/50 text-sm mb-6">Fund this explorer&apos;s next expedition</p>
            <div className="flex flex-wrap justify-center gap-4">
              {paymentLinks.map((link) => {
                const platform = PAYMENT_PLATFORMS[link.platform as PaymentPlatform];
                if (!platform) return null;
                return (
                  <a
                    key={link.id}
                    href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-[#0a0a1a] font-orbitron font-bold tracking-wider hover:bg-white/90 transition-colors"
                  >
                    <span>{platform.icon}</span>
                    <span>{platform.label.toUpperCase()}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-white/20 text-xs font-orbitron tracking-[0.3em]">SYS.ONLINE</p>
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
