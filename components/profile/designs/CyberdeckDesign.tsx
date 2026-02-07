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
  loading: () => <div className="h-[400px] bg-black border border-[#00ff41] animate-pulse" />,
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

// Typing animation component
function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span className="cyber-typing" style={{ animationDelay: `${delay}s` }}>
      {text}
    </span>
  );
}

export default function CyberdeckDesign({
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
    <div className="min-h-screen bg-[#0d0d0d] text-[#00ff41] font-mono relative overflow-hidden">
      <style jsx global>{`
        @keyframes cyber-scan {
          0% { top: -100%; opacity: 0; }
          50% { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes cyber-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes cyber-typing {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cyber-glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
        .cyber-scanline {
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, transparent, #00ff41, transparent);
          animation: cyber-scan 4s linear infinite;
          pointer-events: none;
          z-index: 100;
        }
        .cyber-cursor::after {
          content: '_';
          animation: cyber-blink 1s infinite;
        }
        .cyber-typing {
          animation: cyber-typing 0.5s forwards;
          opacity: 0;
        }
        .cyber-crt::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 65, 0.03) 2px,
            rgba(0, 255, 65, 0.03) 4px
          );
          pointer-events: none;
          z-index: 50;
        }
        .cyber-glitch:hover {
          animation: cyber-glitch 0.3s ease-in-out;
        }
      `}</style>

      {/* Scanline effect */}
      <div className="cyber-scanline" />

      {/* CRT overlay */}
      <div className="cyber-crt fixed inset-0 pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 border-b border-[#00ff41]/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-[#00ff41] hover:text-[#00ff41]/80 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">&lt;-- BACK</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff41]/50 hover:bg-[#00ff41]/10 transition-colors text-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'COPIED' : 'SHARE'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-16 px-4 max-w-4xl mx-auto relative z-10">
        {/* Boot sequence */}
        <div className="mb-8 text-sm text-[#00aa2a]">
          <p className="mb-1">&gt; LOADING USER PROFILE...</p>
          <p className="mb-1">&gt; DECRYPTING DATA...</p>
          <p className="text-[#00ff41] cyber-cursor">&gt; ACCESS GRANTED</p>
        </div>

        {/* User Card */}
        <div className="border border-[#00ff41] p-6 bg-[#00ff41]/5 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* ASCII Avatar or Image */}
            <div className="flex-shrink-0">
              {profile.user.avatarUrl ? (
                <img
                  src={profile.user.avatarUrl}
                  alt={profile.user.fullName || 'User'}
                  className="w-32 h-32 object-cover border-2 border-[#00ff41] grayscale contrast-125"
                />
              ) : (
                <pre className="text-[10px] leading-tight text-[#00ff41]">
{`╔══════════════╗
║   ╭─────╮    ║
║   │ ◉ ◉ │    ║
║   │  ▽  │    ║
║   ╰─────╯    ║
║   ╭─────╮    ║
║   │     │    ║
╚══════════════╝`}
                </pre>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-wider mb-2 cyber-glitch">
                {(profile.user.fullName || 'ANONYMOUS').toUpperCase()}
              </h1>
              <p className="text-[#00aa2a] mb-4">
                @{profile.user.username || 'unknown'} • {profile.user.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {profile.user.location}
                  </span>
                ) : 'LOCATION: UNDISCLOSED'}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="border border-dashed border-[#00aa2a] p-3 text-center">
                  <div className="text-2xl font-bold">{countriesCount}</div>
                  <div className="text-[10px] tracking-widest text-[#00aa2a]">COUNTRIES</div>
                </div>
                <div className="border border-dashed border-[#00aa2a] p-3 text-center">
                  <div className="text-2xl font-bold">{followersCount.toLocaleString()}</div>
                  <div className="text-[10px] tracking-widest text-[#00aa2a]">FOLLOWERS</div>
                </div>
                <div className="border border-dashed border-[#00aa2a] p-3 text-center">
                  <div className="text-2xl font-bold">{publicTrips.length}</div>
                  <div className="text-[10px] tracking-widest text-[#00aa2a]">MISSIONS</div>
                </div>
              </div>

              {/* Follow button */}
              {!isOwner && (
                <div className="mt-4">
                  {isFollowing ? (
                    <button
                      onClick={onUnfollow}
                      className="px-4 py-2 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/10 transition-colors text-sm tracking-wider"
                    >
                      [UNFOLLOW]
                    </button>
                  ) : (
                    <button
                      onClick={onFollow}
                      className="px-4 py-2 bg-[#00ff41] text-[#0d0d0d] hover:bg-[#00ff41]/80 transition-colors text-sm tracking-wider font-bold"
                    >
                      [FOLLOW]
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.user.bio && (
            <div className="mt-6 pt-4 border-t border-[#00aa2a]/50">
              <p className="text-sm leading-relaxed text-[#00aa2a]">
                &gt; BIO: {profile.user.bio}
              </p>
            </div>
          )}
        </div>

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="border border-[#00aa2a]/50 p-4 mb-8">
            <p className="text-xs text-[#00aa2a] mb-3">// EXTERNAL LINKS</p>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((link) => {
                const platform = SOCIAL_PLATFORMS[link.platform as SocialPlatform];
                if (!platform) return null;
                return (
                  <a
                    key={link.id}
                    href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 border border-[#00ff41]/50 hover:bg-[#00ff41]/10 transition-colors text-sm"
                  >
                    <span>{platform.icon}</span>
                    <span>{platform.label.toUpperCase()}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Map Section */}
        <div className="mb-8">
          <p className="text-xs text-[#00aa2a] mb-3">// TERRITORY MAP</p>
          <div className="border border-[#00ff41]">
            <TravelMapWithWishlist
              travelHistory={profile.travelHistory || []}
              height="400px"
              darkMode={true}
            />
          </div>
        </div>

        {/* Mission Log (Trips) */}
        {publicTrips.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-[#00aa2a] mb-3">// MISSION LOG</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicTrips.slice(0, 6).map((trip) => (
                <div
                  key={trip.id}
                  className="border border-[#00aa2a]/50 hover:border-[#00ff41] transition-colors group"
                >
                  {/* Trip Image */}
                  <div className="aspect-video relative overflow-hidden">
                    {trip.images && trip.images.length > 0 ? (
                      <img
                        src={trip.images[0]}
                        alt={trip.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        style={{ filter: 'sepia(100%) hue-rotate(70deg) saturate(200%)' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#00ff41]/10 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-[#00ff41]/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-[10px] text-[#00aa2a]">
                        [{new Date(trip.createdAt).toISOString().split('T')[0]}]
                      </p>
                    </div>
                  </div>
                  {/* Trip Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-bold mb-1 truncate">MISSION: {(trip.title || 'UNTITLED').toUpperCase()}</h3>
                    <p className="text-xs text-[#00aa2a] mb-3">
                      Location: {trip.destinationCity || 'CLASSIFIED'}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/trips/${trip.shareCode || trip.id}`}
                        className="px-3 py-1 border border-[#00ff41]/50 hover:bg-[#00ff41]/10 text-xs flex-1 text-center"
                      >
                        [VIEW]
                      </Link>
                      {!isOwner && (
                        <button
                          onClick={() => handleClone(trip.id)}
                          disabled={cloning === trip.id}
                          className="px-3 py-1 border border-[#00ff41] bg-[#00ff41]/10 hover:bg-[#00ff41]/20 text-xs disabled:opacity-50"
                        >
                          {cloning === trip.id ? '[...]' : '[CLONE]'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Links (Support) */}
        {paymentLinks.length > 0 && (
          <div className="border border-[#00ff41] p-6 bg-[#00ff41]/5">
            <p className="text-xs text-[#00aa2a] mb-2">// SUPPORT OPERATIVE</p>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5" /> FUND THIS MISSION
            </h3>
            <div className="flex flex-wrap gap-3">
              {paymentLinks.map((link) => {
                const platform = PAYMENT_PLATFORMS[link.platform as PaymentPlatform];
                if (!platform) return null;
                return (
                  <a
                    key={link.id}
                    href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#00ff41] text-[#0d0d0d] font-bold hover:bg-[#00ff41]/80 transition-colors text-sm"
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
        <div className="mt-12 text-center text-[#00aa2a] text-xs">
          <p>&gt; END OF TRANSMISSION_</p>
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
