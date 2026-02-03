'use client';

import { LucideIcon, ChevronDown } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SubItem {
  id: string;
  label: string;
}

interface ProfileSidebarItemProps {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isExpanded: boolean;
  subItems?: SubItem[];
  activeSubItem?: string | null;
  badge?: number;
  onClick: () => void;
  onSubItemClick?: (subItemId: string) => void;
  variant?: 'light' | 'dark';
}

const HOVER_DELAY = 200; // ms before showing flyout
const GRACE_PERIOD = 150; // ms before hiding flyout

export default function ProfileSidebarItem({
  id,
  label,
  icon: Icon,
  isActive,
  isExpanded,
  subItems,
  activeSubItem,
  badge,
  onClick,
  onSubItemClick,
  variant = 'light',
}: ProfileSidebarItemProps) {
  const isDark = variant === 'dark';
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(isActive && !!subItems);
  const [showFlyout, setShowFlyout] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyoutPosition, setFlyoutPosition] = useState({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);

  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Ensure portal only renders on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update flyout position when showing
  const updateFlyoutPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setFlyoutPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8, // 8px gap
      });
    }
  }, []);

  const clearTimeouts = useCallback(() => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
  }, []);

  const handleIconMouseEnter = useCallback(() => {
    if (isExpanded || !subItems || subItems.length === 0) return;

    clearTimeouts();
    updateFlyoutPosition();
    enterTimeoutRef.current = setTimeout(() => {
      updateFlyoutPosition();
      setIsAnimating(true);
      setShowFlyout(true);
    }, HOVER_DELAY);
  }, [isExpanded, subItems, clearTimeouts, updateFlyoutPosition]);

  const handleIconMouseLeave = useCallback(() => {
    if (isExpanded || !subItems || subItems.length === 0) return;

    clearTimeouts();
    exitTimeoutRef.current = setTimeout(() => {
      setShowFlyout(false);
      setTimeout(() => setIsAnimating(false), 100);
    }, GRACE_PERIOD);
  }, [isExpanded, subItems, clearTimeouts]);

  const handleFlyoutMouseEnter = useCallback(() => {
    clearTimeouts();
  }, [clearTimeouts]);

  const handleFlyoutMouseLeave = useCallback(() => {
    clearTimeouts();
    exitTimeoutRef.current = setTimeout(() => {
      setShowFlyout(false);
      setTimeout(() => setIsAnimating(false), 100);
    }, GRACE_PERIOD);
  }, [clearTimeouts]);

  const handleClick = () => {
    if (subItems && subItems.length > 0 && isExpanded) {
      setIsSubMenuOpen(!isSubMenuOpen);
    }
    onClick();
  };

  const handleSubItemClickFromFlyout = (subItemId: string) => {
    onSubItemClick?.(subItemId);
    setShowFlyout(false);
    setIsAnimating(false);
  };

  const hasSubItems = subItems && subItems.length > 0;

  // Style classes based on variant
  const buttonClasses = isActive
    ? isDark
      ? 'bg-emerald-500/10 text-emerald-400'
      : 'bg-emerald-50 text-emerald-700'
    : isDark
      ? 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';

  const iconClasses = isActive
    ? isDark
      ? 'text-emerald-400'
      : 'text-emerald-600'
    : isDark
      ? 'text-zinc-500'
      : 'text-gray-400';

  return (
    <div className="relative">
      {/* Main Item */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={handleIconMouseEnter}
        onMouseLeave={handleIconMouseLeave}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${buttonClasses}`}
        title={!isExpanded ? label : undefined}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${iconClasses}`} />

        {isExpanded && (
          <>
            <span className={`flex-1 text-left text-xs ${isActive ? 'font-medium' : ''}`}>
              {label}
            </span>

            {badge && badge > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                {badge}
              </span>
            )}

            {hasSubItems && (
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  isDark ? 'text-zinc-500' : 'text-gray-400'
                } ${isSubMenuOpen ? 'rotate-180' : ''}`}
              />
            )}
          </>
        )}
      </button>

      {/* Expanded Sub Items (inline) */}
      {isExpanded && hasSubItems && isSubMenuOpen && (
        <div className="ml-6 mt-1 space-y-0.5">
          {subItems.map((subItem) => (
            <button
              key={subItem.id}
              onClick={() => onSubItemClick?.(subItem.id)}
              className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                activeSubItem === subItem.id
                  ? isDark
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                    : 'bg-emerald-50 text-emerald-700 font-medium'
                  : isDark
                    ? 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {subItem.label}
            </button>
          ))}
        </div>
      )}

      {/* Collapsed Flyout Card - rendered via Portal to escape stacking context */}
      {!isExpanded && hasSubItems && isAnimating && isMounted && createPortal(
        <>
          {/* Invisible bridge to maintain hover when crossing gap */}
          <div
            className="fixed w-4 h-12"
            style={{
              top: flyoutPosition.top - 24,
              left: flyoutPosition.left - 16,
              zIndex: 99998,
            }}
            onMouseEnter={handleFlyoutMouseEnter}
            onMouseLeave={handleFlyoutMouseLeave}
          />

          {/* Flyout Card */}
          <div
            onMouseEnter={handleFlyoutMouseEnter}
            onMouseLeave={handleFlyoutMouseLeave}
            className={`fixed min-w-[140px] rounded-lg shadow-xl p-1.5 transition-all duration-150 ${
              isDark
                ? 'bg-zinc-900 border border-zinc-700'
                : 'bg-white border border-gray-200'
            } ${
              showFlyout
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-2 pointer-events-none'
            }`}
            style={{
              top: flyoutPosition.top,
              left: flyoutPosition.left,
              transform: `translateY(-50%) ${showFlyout ? 'translateX(0)' : 'translateX(-8px)'}`,
              zIndex: 99999,
            }}
          >
            {/* Header */}
            <div className={`px-2 py-1.5 border-b mb-1 ${isDark ? 'border-zinc-700' : 'border-gray-100'}`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{label}</span>
            </div>

            {/* Sub Items */}
            <div className="space-y-0.5">
              {subItems.map((subItem) => (
                <button
                  key={subItem.id}
                  onClick={() => handleSubItemClickFromFlyout(subItem.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                    activeSubItem === subItem.id
                      ? isDark
                        ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                        : 'bg-emerald-50 text-emerald-700 font-medium'
                      : isDark
                        ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {subItem.label}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
