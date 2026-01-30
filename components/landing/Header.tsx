'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Menu, X, Map, Heart, User, Sparkles } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

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
              { label: 'Discover', icon: Map },
              { label: 'My Trips', icon: Heart },
              { label: 'Creators', icon: User },
            ].map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-all font-medium"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors">
              <Sparkles className="w-4 h-4" />
              <span>Become Creator</span>
            </button>

            <button className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-200 hover:shadow-lg">
              Sign In
            </button>

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
                { label: 'Discover', icon: Map },
                { label: 'My Trips', icon: Heart },
                { label: 'Creators', icon: User },
                { label: 'Become Creator', icon: Sparkles },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-left rounded-xl hover:bg-emerald-50 transition-colors font-medium text-emerald-800"
                >
                  <item.icon className="w-5 h-5 text-emerald-600" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
