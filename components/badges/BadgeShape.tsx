'use client';

import { BadgeLevel, BadgeTrack } from '@/lib/badges';
import { Globe, Compass, Map, Mountain, Sparkles, PenTool, Lightbulb, Rocket, Flame, TrendingUp, Crown, Star, Zap } from 'lucide-react';

interface BadgeShapeProps {
  level: BadgeLevel;
  icon: string;
  name: string;
  track?: BadgeTrack;
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
}

// Map track + level to appropriate Lucide icon
const TRACK_ICONS: Record<BadgeTrack, Record<BadgeLevel, React.ComponentType<{ className?: string }>>> = {
  explorer: {
    1: Compass,
    2: Map,
    3: Mountain,
    4: Globe,
    5: Crown,
  },
  creator: {
    1: Lightbulb,
    2: PenTool,
    3: Sparkles,
    4: Rocket,
    5: Star,
  },
  influence: {
    1: Zap,
    2: TrendingUp,
    3: Flame,
    4: Flame,
    5: Crown,
  },
};

// Shape determined by level
// 1-2: Square (starter badges)
// 3-4: Hexagon (intermediate badges)
// 5: Circle (master badges)
function getShapeForLevel(level: BadgeLevel): 'square' | 'hexagon' | 'circle' {
  if (level <= 2) return 'square';
  if (level <= 4) return 'hexagon';
  return 'circle';
}

// Color schemes for each level
const LEVEL_STYLES: Record<BadgeLevel, {
  outer: string;
  inner: string;
  border: string;
  iconColor: string;
  labelBg: string;
  labelText: string;
}> = {
  1: {
    outer: 'bg-gradient-to-br from-stone-300 to-stone-400',
    inner: 'bg-gradient-to-br from-stone-100 to-stone-200',
    border: 'border-stone-500',
    iconColor: 'text-stone-600',
    labelBg: 'bg-stone-600',
    labelText: 'text-stone-100',
  },
  2: {
    outer: 'bg-gradient-to-br from-amber-600 to-amber-800',
    inner: 'bg-gradient-to-br from-amber-100 to-amber-200',
    border: 'border-amber-900',
    iconColor: 'text-amber-700',
    labelBg: 'bg-amber-800',
    labelText: 'text-amber-100',
  },
  3: {
    outer: 'bg-gradient-to-br from-slate-300 to-slate-500',
    inner: 'bg-gradient-to-br from-slate-50 to-slate-100',
    border: 'border-slate-600',
    iconColor: 'text-slate-600',
    labelBg: 'bg-slate-600',
    labelText: 'text-slate-100',
  },
  4: {
    outer: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    inner: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    border: 'border-emerald-700',
    iconColor: 'text-emerald-600',
    labelBg: 'bg-emerald-700',
    labelText: 'text-emerald-100',
  },
  5: {
    outer: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500',
    inner: 'bg-gradient-to-br from-yellow-50 to-amber-100',
    border: 'border-yellow-600',
    iconColor: 'text-yellow-600',
    labelBg: 'bg-gradient-to-r from-yellow-600 to-amber-600',
    labelText: 'text-yellow-50',
  },
};

// Size configurations - all shapes use same base dimensions
const SIZE_CONFIG = {
  sm: { container: 40, iconSize: 14, label: 'text-[6px]', padding: 2 },
  md: { container: 48, iconSize: 18, label: 'text-[7px]', padding: 3 },
  lg: { container: 64, iconSize: 24, label: 'text-[9px]', padding: 4 },
};

export default function BadgeShape({ level, icon, name, track, size = 'md', isActive = true }: BadgeShapeProps) {
  const shape = getShapeForLevel(level);
  const styles = LEVEL_STYLES[level];
  const sizeConfig = SIZE_CONFIG[size];

  const containerSize = sizeConfig.container;
  const innerSize = containerSize - (sizeConfig.padding * 2);

  // Get the appropriate Lucide icon
  const IconComponent = track ? TRACK_ICONS[track]?.[level] || Globe : Globe;

  // Truncate name for label
  const shortName = name.length > 8 ? name.slice(0, 7) + '…' : name;

  if (shape === 'square') {
    const labelHeight = size === 'sm' ? 10 : size === 'md' ? 12 : 16;
    return (
      <div
        className={`relative flex-shrink-0 transition-transform hover:scale-110 ${!isActive ? 'opacity-40 grayscale' : ''}`}
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Outer square with rounded corners */}
        <div
          className={`absolute inset-0 rounded-md ${styles.outer} border ${styles.border} shadow-md`}
        />

        {/* Decorative corner lines */}
        <div className="absolute top-1 left-1 w-2 h-[1px] bg-white/30" />
        <div className="absolute top-1 left-1 w-[1px] h-2 bg-white/30" />
        <div className="absolute top-1 right-1 w-2 h-[1px] bg-white/30" />
        <div className="absolute top-1 right-1 w-[1px] h-2 bg-white/30" />

        {/* Inner area with pattern */}
        <div
          className={`absolute rounded-sm ${styles.inner} flex items-center justify-center overflow-hidden`}
          style={{
            top: sizeConfig.padding + 1,
            left: sizeConfig.padding + 1,
            right: sizeConfig.padding + 1,
            bottom: labelHeight + sizeConfig.padding,
          }}
        >
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
              backgroundSize: '4px 4px',
            }}
          />
          {/* Icon */}
          <IconComponent
            className={`${styles.iconColor} relative z-10`}
            style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}
          />
        </div>

        {/* Label bar at bottom */}
        <div
          className={`absolute left-[3px] right-[3px] ${styles.labelBg} rounded-b-sm flex items-center justify-center`}
          style={{ bottom: 3, height: labelHeight }}
        >
          <span className={`${sizeConfig.label} font-bold uppercase tracking-tight ${styles.labelText}`}>
            {shortName}
          </span>
        </div>
      </div>
    );
  }

  if (shape === 'hexagon') {
    return (
      <div
        className={`relative flex-shrink-0 transition-transform hover:scale-110 ${!isActive ? 'opacity-40 grayscale' : ''}`}
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Hexagon outer with shadow */}
        <div
          className={`absolute inset-0 ${styles.outer} shadow-lg`}
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        />

        {/* Hexagon highlight rim */}
        <div
          className="absolute bg-gradient-to-b from-white/40 to-transparent"
          style={{
            top: 2,
            left: 2,
            right: 2,
            bottom: '50%',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        />

        {/* Hexagon inner */}
        <div
          className={`absolute ${styles.inner} flex flex-col items-center justify-center overflow-hidden`}
          style={{
            top: 3,
            left: 3,
            right: 3,
            bottom: 3,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        >
          {/* Radial pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.1) 70%)`,
            }}
          />
          {/* Decorative lines from center */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-current" />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-current" />
          </div>
          {/* Icon */}
          <IconComponent
            className={`${styles.iconColor} relative z-10 -mt-1`}
            style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}
          />
        </div>

        {/* Label banner at bottom */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${styles.labelBg} px-1.5 py-0.5 rounded-sm shadow-sm`}
          style={{ bottom: size === 'sm' ? 1 : size === 'md' ? 2 : 4 }}
        >
          <span className={`${sizeConfig.label} font-bold uppercase tracking-tight ${styles.labelText}`}>
            {shortName}
          </span>
        </div>
      </div>
    );
  }

  // Circle (level 5 - master badge)
  return (
    <div
      className={`relative flex-shrink-0 transition-transform hover:scale-110 ${!isActive ? 'opacity-40 grayscale' : ''}`}
      style={{ width: containerSize, height: containerSize + 6 }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          top: 0,
          left: -2,
          right: -2,
          bottom: 6,
          background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 60%)',
        }}
      />

      {/* Outer circle with gradient */}
      <div
        className={`absolute rounded-full ${styles.outer} shadow-lg border ${styles.border}`}
        style={{ top: 0, left: 0, right: 0, bottom: 6 }}
      />

      {/* Medal rim highlight */}
      <div
        className="absolute rounded-full bg-gradient-to-b from-white/50 to-transparent"
        style={{ top: 1, left: 1, right: 1, height: '45%' }}
      />

      {/* Inner circle with complex pattern */}
      <div
        className={`absolute rounded-full ${styles.inner} flex flex-col items-center justify-center shadow-inner overflow-hidden`}
        style={{
          top: sizeConfig.padding + 1,
          left: sizeConfig.padding + 1,
          right: sizeConfig.padding + 1,
          bottom: sizeConfig.padding + 7,
        }}
      >
        {/* Sunburst pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, rgba(0,0,0,0.1) 15deg, transparent 30deg, rgba(0,0,0,0.1) 45deg, transparent 60deg, rgba(0,0,0,0.1) 75deg, transparent 90deg, rgba(0,0,0,0.1) 105deg, transparent 120deg, rgba(0,0,0,0.1) 135deg, transparent 150deg, rgba(0,0,0,0.1) 165deg, transparent 180deg, rgba(0,0,0,0.1) 195deg, transparent 210deg, rgba(0,0,0,0.1) 225deg, transparent 240deg, rgba(0,0,0,0.1) 255deg, transparent 270deg, rgba(0,0,0,0.1) 285deg, transparent 300deg, rgba(0,0,0,0.1) 315deg, transparent 330deg, rgba(0,0,0,0.1) 345deg, transparent 360deg)`,
          }}
        />
        {/* Icon */}
        <IconComponent
          className={`${styles.iconColor} relative z-10`}
          style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}
        />
      </div>

      {/* Small star decorations */}
      <div className="absolute text-yellow-400 opacity-80" style={{ top: -1, left: '50%', transform: 'translateX(-50%)', fontSize: size === 'sm' ? 6 : size === 'md' ? 8 : 10 }}>
        ★
      </div>

      {/* Bottom ribbon/banner */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${styles.labelBg} px-1.5 rounded-full shadow-md`}
        style={{
          bottom: 0,
          paddingTop: 1,
          paddingBottom: 1,
        }}
      >
        <span className={`${sizeConfig.label} font-bold uppercase tracking-tight ${styles.labelText}`}>
          {shortName}
        </span>
      </div>
    </div>
  );
}
