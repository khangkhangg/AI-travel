'use client';

import { Compass } from 'lucide-react';
import { useBranding } from '@/lib/hooks/useBranding';

export default function Footer() {
  const { branding } = useBranding();

  return (
    <footer className="px-4 sm:px-6 lg:px-8 py-12 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg">
                <img src={branding.logoUrl} alt={branding.appName} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg">
                <Compass className="w-6 h-6 text-white" />
              </div>
            )}
            <span className="font-bold text-gray-900 text-xl">
              {branding.appName}<span className="text-amber-500">.</span>
            </span>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">About</a>
            <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Privacy</a>
            <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Terms</a>
            <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Contact</a>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 {branding.appName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
