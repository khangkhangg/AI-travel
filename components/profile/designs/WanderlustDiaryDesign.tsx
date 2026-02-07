'use client';

import { useState, useEffect, useMemo } from 'react';
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
  loading: () => <div className="h-[450px] bg-gradient-to-br from-[#FFDAB9] to-[#FFFEF7] animate-pulse" />,
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

// Animated letter component for the name reveal
function AnimatedName({ name }: { name?: string }) {
  const displayName = name || 'Anonymous';
  const letters = displayName.toUpperCase().split('');
  return (
    <>
      {letters.map((letter, i) => (
        <span
          key={i}
          className="inline-block diary-letter-reveal"
          style={{ animationDelay: `${0.3 + i * 0.05}s` }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </>
  );
}

export default function WanderlustDiaryDesign({
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
  const visitedPlaces = profile.travelHistory?.filter(t => !t.isWishlist) || [];
  const countriesCount = visitedPlaces.reduce((acc, t) => {
    if (!acc.includes(t.country)) acc.push(t.country);
    return acc;
  }, [] as string[]).length;

  const publicTrips = itineraries.filter(t => t.visibility === 'public' || t.visibility === 'curated');

  // Build marquee destinations from visited places
  const marqueeDestinations = useMemo(() => {
    const cities = visitedPlaces.map(p => p.city?.toUpperCase()).filter(Boolean);
    const uniqueCities = [...new Set(cities)].slice(0, 12);
    return uniqueCities.length > 0 ? uniqueCities : ['EXPLORE', 'DISCOVER', 'WANDER', 'DREAM'];
  }, [visitedPlaces]);

  // Grid span patterns for asymmetric layout
  const gridSpans = [
    { col: 'col-span-12 md:col-span-5', row: 'row-span-2' },
    { col: 'col-span-12 md:col-span-4', row: 'row-span-1' },
    { col: 'col-span-12 md:col-span-3', row: 'row-span-2' },
    { col: 'col-span-12 md:col-span-4', row: 'row-span-1' },
    { col: 'col-span-12 md:col-span-6', row: 'row-span-1' },
    { col: 'col-span-12 md:col-span-6', row: 'row-span-1' },
  ];

  return (
    <>
      {/* CSS Animations */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Work+Sans:wght@400;500;600;700&display=swap');

        @keyframes diary-letter-reveal {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes diary-fade-slide {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes diary-stamp-float {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }

        @keyframes diary-marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes diary-stat-slide {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes diary-pin-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes diary-heart-pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .diary-letter-reveal { animation: diary-letter-reveal 0.5s ease-out both; }
        .diary-fade-slide { animation: diary-fade-slide 0.6s ease-out both; }
        .diary-stamp-float { animation: diary-stamp-float 4s ease-in-out infinite; }
        .diary-marquee-scroll { animation: diary-marquee-scroll 30s linear infinite; }
        .diary-stat-slide { animation: diary-stat-slide 0.6s ease-out both; }
        .diary-pin-bounce { animation: diary-pin-bounce 1s ease-out infinite; }
        .diary-heart-pop { animation: diary-heart-pop 0.8s ease-out infinite; }

        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-work-sans { font-family: 'Work Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen bg-[#FFFEF7] font-work-sans relative overflow-x-hidden">
        {/* Confetti dots overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-[1] opacity-[0.06]"
          style={{
            backgroundImage: `
              radial-gradient(circle, #FF1493 1px, transparent 1px),
              radial-gradient(circle, #FF6B6B 1px, transparent 1px),
              radial-gradient(circle, #D4AF37 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px, 60px 60px, 100px 100px',
            backgroundPosition: '0 0, 30px 30px, 15px 45px',
          }}
        />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFEF7]/95 backdrop-blur-md border-b-2 border-[#1A1A2E] px-4 md:px-8 py-3 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="font-bebas text-sm tracking-widest px-4 py-2 border-2 border-[#1A1A2E] hover:bg-[#1A1A2E] hover:text-white transition-colors"
          >
            ← BACK
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleCopyLink}
              className="font-bebas text-sm tracking-widest px-4 py-2 border-2 border-[#1A1A2E] hover:bg-[#1A1A2E] hover:text-white transition-colors"
            >
              {copied ? 'COPIED!' : 'SHARE'}
            </button>
            {!isOwner && (
              <button
                onClick={isFollowing ? onUnfollow : onFollow}
                className="font-bebas text-sm tracking-widest px-5 py-2 bg-[#FF1493] text-white shadow-[4px_4px_0_#1A1A2E] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A2E] transition-all"
              >
                {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
              </button>
            )}
          </div>
        </header>

        <main className="relative z-[2] pt-16">
          {/* Hero - Split Screen */}
          <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
            {/* Image side */}
            <div className="relative h-[50vh] lg:h-auto overflow-hidden">
              <img
                src={profile.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.user.fullName || 'Anonymous'}`}
                alt={profile.user.fullName || 'Profile'}
                className="w-full h-full object-cover"
              />
              {/* Decorative stamps */}
              <span className="absolute top-[10%] right-[-20px] text-5xl diary-stamp-float" style={{ animationDelay: '0s' }}>✈️</span>
              <span className="absolute bottom-[20%] right-[10%] text-5xl diary-stamp-float" style={{ animationDelay: '1s' }}>📸</span>
              <span className="absolute top-[40%] left-[-10px] text-5xl diary-stamp-float" style={{ animationDelay: '0.5s' }}>🌸</span>
            </div>

            {/* Text side */}
            <div className="flex flex-col justify-center p-8 lg:p-16 bg-[#FFFEF7] relative">
              <p className="font-cormorant italic text-xl text-[#FF1493] mb-3 diary-fade-slide" style={{ animationDelay: '0.2s' }}>
                Travel Diary of
              </p>
              <h1 className="font-bebas text-6xl md:text-7xl lg:text-8xl leading-[0.9] text-[#1A1A2E] tracking-tight overflow-hidden">
                <AnimatedName name={profile.user.fullName} />
              </h1>
              <div className="mt-6 text-gray-500 diary-fade-slide flex flex-wrap gap-4" style={{ animationDelay: '1s' }}>
                {profile.user.username && <span>@{profile.user.username}</span>}
                {profile.user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {profile.user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-pink-500" /> {followersCount.toLocaleString()} followers
                </span>
              </div>

              {/* Social links */}
              {socialLinks.length > 0 && (
                <div className="flex gap-3 mt-6 diary-fade-slide" style={{ animationDelay: '1.2s' }}>
                  {socialLinks.map((link) => {
                    const platform = SOCIAL_PLATFORMS[link.platform as SocialPlatform];
                    if (!platform) return null;
                    return (
                      <a
                        key={link.id}
                        href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 border-2 border-[#1A1A2E] flex items-center justify-center text-xl hover:bg-[#FF1493] hover:border-[#FF1493] hover:-rotate-[5deg] transition-all"
                      >
                        {platform.icon}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Marquee Ticker */}
          <section className="bg-[#1A1A2E] py-4 overflow-hidden border-y-[3px] border-[#FF1493]">
            <div className="flex diary-marquee-scroll">
              {[0, 1].map((_, groupIdx) => (
                <div key={groupIdx} className="flex flex-shrink-0 gap-12 pr-12">
                  {marqueeDestinations.map((dest, i) => (
                    <span key={`${groupIdx}-${i}`} className="font-bebas text-xl text-white tracking-[0.2em] whitespace-nowrap flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FF1493] rounded-full" />
                      {dest}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Stats - Editorial */}
          <section className="py-16 md:py-24 px-4 md:px-8 bg-[#FFDAB9]">
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { num: countriesCount, label: 'Countries Explored' },
                { num: publicTrips.length, label: 'Trips Created' },
                { num: visitedPlaces.length, label: 'Places Visited' },
                { num: profile.stats?.totalClones || 0, label: 'Itinerary Clones' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="text-center p-6 relative diary-stat-slide"
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  <div className="font-bebas text-6xl md:text-7xl leading-none bg-gradient-to-br from-[#FF1493] to-[#FF6B6B] bg-clip-text text-transparent">
                    {stat.num}
                  </div>
                  <div className="font-cormorant italic text-lg text-[#1A1A2E] mt-2">{stat.label}</div>
                  {i < 3 && (
                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-3/5 bg-[#1A1A2E]/20" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Map Section */}
          <section className="py-16 md:py-24 px-4 md:px-8 bg-[#FFFEF7]">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-0.5 bg-[#1A1A2E]" />
                <h2 className="font-bebas text-3xl md:text-4xl tracking-widest text-[#1A1A2E]">WHERE I&apos;VE BEEN</h2>
                <div className="flex-1 h-0.5 bg-[#1A1A2E]" />
              </div>
              <div className="border-[3px] border-[#1A1A2E] shadow-[8px_8px_0_#FF1493]">
                <TravelMapWithWishlist
                  travelHistory={profile.travelHistory || []}
                  height="450px"
                />
              </div>
            </div>
          </section>

          {/* Trips - Asymmetric Grid */}
          {publicTrips.length > 0 && (
            <section className="py-16 md:py-24 px-4 md:px-8 bg-[#1A1A2E]">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                  <div className="flex-1 h-0.5 bg-white" />
                  <h2 className="font-bebas text-3xl md:text-4xl tracking-widest text-white">MY ADVENTURES</h2>
                  <div className="flex-1 h-0.5 bg-white" />
                </div>
                <div className="grid grid-cols-12 auto-rows-[200px] gap-4 md:gap-6">
                  {publicTrips.slice(0, 6).map((trip, i) => {
                    const span = gridSpans[i % gridSpans.length];
                    const placeCount = trip.activities?.length || trip.places?.length || 0;
                    return (
                      <div
                        key={trip.id}
                        className={`${span.col} ${span.row} relative overflow-hidden cursor-pointer border-[3px] border-transparent hover:border-[#FF1493] transition-all duration-300 hover:-rotate-1 hover:scale-[1.02] group`}
                        onClick={() => router.push(`/trips/${trip.id}`)}
                      >
                        {placeCount > 0 && (
                          <span className="absolute top-3 left-3 z-10 bg-[#FF1493] text-white px-3 py-1 font-bebas text-sm tracking-widest">
                            {placeCount} PLACES
                          </span>
                        )}
                        {trip.images && trip.images.length > 0 ? (
                          <img
                            src={trip.images[0]}
                            alt={trip.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#FF1493]/30 to-[#1A1A2E] flex items-center justify-center">
                            <MapPin className="w-12 h-12 text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E]/90 via-transparent to-transparent flex flex-col justify-end p-4 md:p-6">
                          <h3 className="font-bebas text-xl md:text-2xl text-white tracking-wide">{trip.title?.toUpperCase()}</h3>
                          <p className="font-cormorant italic text-[#FFDAB9]">{trip.destination}</p>
                        </div>
                        {/* Clone button on hover */}
                        {!isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClone(trip.id);
                            }}
                            disabled={cloning === trip.id}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-6 py-3 font-bebas tracking-widest text-[#1A1A2E] shadow-[4px_4px_0_#FF1493] hover:-translate-x-[calc(50%+2px)] hover:-translate-y-[calc(50%+2px)] hover:shadow-[6px_6px_0_#FF1493]"
                          >
                            {cloning === trip.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              'CLONE TRIP'
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* About - Pull Quote */}
          {profile.user.bio && (
            <section className="py-20 md:py-32 px-6 bg-[#FFFEF7] text-center">
              <div className="max-w-3xl mx-auto relative">
                <span className="font-cormorant text-[10rem] text-[#FF1493]/20 leading-none absolute -top-8 -left-8">&ldquo;</span>
                <p className="font-cormorant italic text-2xl md:text-3xl leading-relaxed text-[#1A1A2E]">
                  {profile.user.bio}
                </p>
              </div>
            </section>
          )}

          {/* Support */}
          {paymentLinks.length > 0 && (
            <section className="py-16 md:py-24 px-6 bg-gradient-to-br from-[#FF1493] to-[#FF6B6B] text-center">
              <div className="text-6xl mb-4 diary-heart-pop">💝</div>
              <h2 className="font-bebas text-4xl md:text-5xl text-white tracking-widest mb-3">SUPPORT MY ADVENTURES</h2>
              <p className="text-white/90 text-lg mb-8">If my guides helped you plan your trip, consider buying me a coffee!</p>
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
                      className="font-bebas text-lg tracking-widest px-6 py-3 bg-white text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A2E] transition-all flex items-center gap-2"
                    >
                      <span>{platform.icon}</span> {platform.label.toUpperCase()}
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
