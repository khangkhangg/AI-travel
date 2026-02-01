'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Menu, X, Map, Heart, User, Sparkles, LogOut, Settings, BookMarked, FileText, ChevronDown } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [tripCount, setTripCount] = useState(0);
  const signInButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

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

  // Fetch trip count when user is logged in
  useEffect(() => {
    const fetchTripCount = async () => {
      if (!user) {
        setTripCount(0);
        return;
      }
      try {
        const response = await fetch('/api/trips');
        if (response.ok) {
          const data = await response.json();
          setTripCount(data.trips?.length || 0);
        }
      } catch (error) {
        console.error('Failed to fetch trip count:', error);
      }
    };

    fetchTripCount();
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:shadow-emerald-300 transition-shadow">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
            </div>
            <span className="text-xl font-bold text-emerald-900">
              Wanderlust<span className="text-amber-500">.</span>
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
            <button
              onClick={() => router.push('/guide/register')}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Become Creator</span>
            </button>

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
                        <button
                          onClick={() => handleMenuItemClick('/profile')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Edit Profile</p>
                            <p className="text-xs text-gray-500">Manage your account</p>
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
                { label: 'Become Creator', icon: Sparkles, path: '/guide/register' },
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
