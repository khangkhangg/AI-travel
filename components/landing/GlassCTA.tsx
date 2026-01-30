'use client';

import { Sparkles, ArrowRight } from 'lucide-react';

interface GlassCTAProps {
  onGetStarted: () => void;
}

export default function GlassCTA({ onGetStarted }: GlassCTAProps) {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Background card with gradient */}
        <div className="relative bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-3xl p-10 sm:p-14 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-violet-200/30 to-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-teal-100/30 to-emerald-100/30 rounded-full blur-3xl" />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Ready to plan your
              <br />
              <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                dream adventure?
              </span>
            </h2>
            <p className="text-gray-600 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Join thousands of travelers who plan smarter trips with AI-powered recommendations.
            </p>

            {/* Glassmorphism button */}
            <button
              onClick={onGetStarted}
              className="group relative inline-flex items-center gap-4 px-8 py-5 bg-white/80 backdrop-blur-xl rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-white/50"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,240,255,0.9) 100%)',
              }}
            >
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6 text-violet-600" />
              </div>
              <span className="text-lg font-bold text-gray-800">Start Planning</span>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-sm text-gray-400 mt-8">
              ✨ Trusted by 50,000+ travelers worldwide
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
