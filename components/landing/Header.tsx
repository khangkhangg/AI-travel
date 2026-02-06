'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Menu, X, Map, Heart, User, Sparkles, LogOut, Settings, BookMarked, FileText, ChevronDown, Activity } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';
import { useBranding } from '@/lib/hooks/useBranding';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [tripCount, setTripCount] = useState(0);
  const [pendingActivityCount, setPendingActivityCount] = useState(0);
  const [showActivityBadge, setShowActivityBadge] = useState(false);
  const [userProfile, setUserProfile] = useState<{ username?: string; fullName?: string } | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const signInButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { branding } = useBranding();

  // Check for existing session on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoadingUser(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch trip count and user profile when user is logged in
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setTripCount(0);
        setPendingActivityCount(0);
        setUserProfile(null);
        setIsBusiness(false);
        return;
      }
      try {
        // Fetch trips
        const tripsResponse = await fetch('/api/trips');
        if (tripsResponse.ok) {
          const tripsData = await tripsResponse.json();
          setTripCount(tripsData.trips?.length || 0);
        }

        // Fetch user profile for username
        const profileResponse = await fetch('/api/users');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserProfile({
            username: profileData.user?.username,
            fullName: profileData.user?.fullName,
          });
        }

        // Fetch pending activity count
        const activityResponse = await fetch('/api/users/me/activity?limit=50');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          const activities = activityData.activities || [];
          const pendingCount = activities.filter(
            (a: any) =>
              (a.type === 'bid_received' || a.type === 'suggestion_received') &&
              (a.status === 'pending' || a.status === 'withdrawal_requested')
          ).length;
          setPendingActivityCount(pendingCount);
        }

        // Fetch guide/creator status
        const guideModeResponse = await fetch('/api/users/guide-mode');
        if (guideModeResponse.ok) {
          const guideModeData = await guideModeResponse.json();
          setIsCreator(guideModeData.is_guide || false);
        }

        // Fetch business status
        const businessResponse = await fetch('/api/businesses?self=true');
        if (businessResponse.ok) {
          const businessData = await businessResponse.json();
          setIsBusiness(businessData.isBusiness || false);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Alternate between avatar and activity badge every 3 seconds
  useEffect(() => {
    if (pendingActivityCount === 0) {
      setShowActivityBadge(false);
      return;
    }

    const interval = setInterval(() => {
      setShowActivityBadge((prev) => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, [pendingActivityCount]);

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  const handleMenuItemClick = (path: string) => {
    setIsUserMenuOpen(false);
    router.push(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-emerald-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative">
              {branding.logoUrl ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                  <img src={branding.logoUrl} alt={branding.appName} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:shadow-emerald-300 transition-shadow">
                  <Compass className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
            </div>
            <span className="text-xl font-bold text-emerald-900">
              {branding.appName}<span className="text-amber-500">.</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Discover', icon: Map, path: '/discover' },
              { label: 'My Trips', icon: Heart, path: '/my-trips', showBadge: true },
              { label: 'Creators', icon: User, path: '/creators' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-all font-medium"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.showBadge && tripCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                    {tripCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isCreator && !isBusiness && (
              <button
                onClick={() => router.push('/guide/register')}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Become Creator</span>
              </button>
            )}

            {/* Auth Section */}
            <div className="relative" ref={userMenuRef}>
              {isLoadingUser ? (
                <div className="w-20 h-10 bg-gray-100 rounded-xl animate-pulse" />
              ) : user ? (
                <>
                  {/* User Avatar Button */}
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors"
                  >
                    {/* Avatar that switches between user image and activity badge */}
                    <div className="relative w-8 h-8">
                      {/* User Avatar */}
                      <div
                        className={`absolute inset-0 transition-all duration-500 ${
                          showActivityBadge && pendingActivityCount > 0
                            ? 'opacity-0 scale-75'
                            : 'opacity-100 scale-100'
                        }`}
                      >
                        {user.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-2 ring-emerald-100">
                            <span className="text-sm font-semibold text-white">
                              {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Activity Badge with Bounce & Glow */}
                      {pendingActivityCount > 0 && (
                        <div
                          className={`absolute inset-0 transition-all duration-500 ${
                            showActivityBadge
                              ? 'opacity-100 scale-110 animate-bounce-glow'
                              : 'opacity-0 scale-75'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center ring-2 ring-emerald-500"
                            style={{
                              boxShadow: showActivityBadge
                                ? '0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.3)'
                                : 'none',
                            }}
                          >
                            <span className="text-xs font-bold text-emerald-600">
                              {pendingActivityCount > 9 ? '9+' : pendingActivityCount}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add custom animation styles */}
                    <style jsx>{`
                      @keyframes bounce-glow {
                        0%, 100% {
                          transform: scale(1.1);
                        }
                        50% {
                          transform: scale(1.15);
                        }
                      }
                      .animate-bounce-glow {
                        animation: bounce-glow 1s ease-in-out infinite;
                      }
                    `}</style>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 truncate">
                          {user.user_metadata?.full_name || 'Traveler'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {/* View Public Profile - only show if user has username */}
                        {userProfile?.username && (
                          <button
                            onClick={() => handleMenuItemClick(`/profile/${userProfile.username}`)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">View Profile</p>
                              <p className="text-xs text-gray-500">@{userProfile.username}</p>
                            </div>
                          </button>
                        )}

                        <button
                          onClick={() => handleMenuItemClick(isBusiness ? '/business' : '/profile')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {isBusiness ? 'Manage Business' : 'My Profile'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {isBusiness ? 'Edit your business profile' : 'Manage your account'}
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => handleMenuItemClick('/profile?section=activity')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center relative">
                            <Activity className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">Activity</p>
                              {pendingActivityCount > 0 && (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border border-emerald-300">
                                  {pendingActivityCount > 9 ? '9+' : pendingActivityCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {pendingActivityCount > 0 ? `${pendingActivityCount} pending action${pendingActivityCount !== 1 ? 's' : ''}` : 'View your activity'}
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => handleMenuItemClick('/my-trips')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <BookMarked className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">My Trips</p>
                            <p className="text-xs text-gray-500">View saved itineraries</p>
                          </div>
                        </button>

                        <button
                          onClick={() => handleMenuItemClick('/my-curated')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">My Curated Itineraries</p>
                            <p className="text-xs text-gray-500">Itineraries you created</p>
                          </div>
                        </button>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                            <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">Sign Out</p>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    ref={signInButtonRef}
                    onClick={() => setIsAuthModalOpen(!isAuthModalOpen)}
                    className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-200 hover:shadow-lg"
                  >
                    Sign In
                  </button>
                  <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    anchorRef={signInButtonRef as React.RefObject<HTMLElement>}
                    onAuthSuccess={async () => {
                      setIsAuthModalOpen(false);
                      // Refresh user state
                      const { data: { user } } = await supabase.auth.getUser();
                      setUser(user);
                    }}
                  />
                </>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-emerald-50 transition-colors text-emerald-700"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-emerald-100 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1">
              {[
                { label: 'Discover', icon: Map, path: '/discover' },
                { label: 'My Trips', icon: Heart, path: '/my-trips', showBadge: true },
                { label: 'Creators', icon: User, path: '/creators' },
                ...(!isCreator && !isBusiness ? [{ label: 'Become Creator', icon: Sparkles, path: '/guide/register' }] : []),
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push(item.path);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-left rounded-xl hover:bg-emerald-50 transition-colors font-medium text-emerald-800"
                >
                  <item.icon className="w-5 h-5 text-emerald-600" />
                  <span className="flex-1">{item.label}</span>
                  {item.showBadge && tripCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                      {tripCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
