'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  LogOut,
  ExternalLink,
  Shield,
  ChevronUp,
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';

interface ProfileUserMenuProps {
  user: {
    id: string;
    fullName?: string;
    username?: string;
    avatarUrl?: string;
    email: string;
    role?: string;
  };
  isExpanded: boolean;
  variant?: 'light' | 'dark';
}

export default function ProfileUserMenu({ user, isExpanded, variant = 'light' }: ProfileUserMenuProps) {
  const isDark = variant === 'dark';
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isAdmin = user.role === 'admin';

  return (
    <div ref={menuRef} className="relative">
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
          isDark
            ? `hover:bg-zinc-800 ${isOpen ? 'bg-zinc-800' : ''}`
            : `hover:bg-gray-50 ${isOpen ? 'bg-gray-50' : ''}`
        }`}
        title={!isExpanded ? user.fullName || user.email : undefined}
      >
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ${isDark ? 'bg-zinc-700' : 'bg-emerald-100'}`}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-emerald-600'}`} />
            </div>
          )}
        </div>

        {isExpanded && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className={`text-xs font-medium truncate ${isDark ? 'text-zinc-200' : 'text-gray-900'}`}>
                {user.fullName || 'Anonymous'}
              </p>
            </div>
            <ChevronUp
              className={`w-3 h-3 transition-transform ${isDark ? 'text-zinc-500' : 'text-gray-400'} ${
                isOpen ? '' : 'rotate-180'
              }`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute ${isExpanded ? 'left-0 right-0' : 'left-full ml-2'} bottom-full mb-2 rounded-lg shadow-xl py-1 min-w-[160px] z-50 ${
          isDark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-gray-100'
        }`}>
          {/* View Public Profile */}
          {user.username && (
            <Link
              href={`/profile/${user.username}`}
              className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <ExternalLink className={`w-3 h-3 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
              View Profile
            </Link>
          )}

          {/* Admin Dashboard - only for admins */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Shield className={`w-3 h-3 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
              Admin
            </Link>
          )}

          {/* Divider */}
          <div className={`my-1 border-t ${isDark ? 'border-zinc-700' : 'border-gray-100'}`} />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
              isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
