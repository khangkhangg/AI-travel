'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  User,
  Settings,
  CalendarDays,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Activity,
} from 'lucide-react';
import ProfileSidebarItem from './ProfileSidebarItem';
import ProfileUserMenu from './ProfileUserMenu';

export type SectionId = 'dashboard' | 'activity' | 'profile' | 'settings' | 'bookings';
export type SubItemId =
  | 'personal-info'
  | 'travel-history'
  | 'badges'
  | 'links'
  | 'privacy'
  | 'appearance'
  | 'guide-mode'
  | 'integrations';

interface ProfileSidebarProps {
  user: {
    id: string;
    fullName?: string;
    username?: string;
    avatarUrl?: string;
    email: string;
    role?: string;
  };
  isGuide: boolean;
  pendingBookings?: number;
  pendingActivity?: number;
  activeSection: SectionId;
  activeSubItem: SubItemId | null;
  onSectionChange: (section: SectionId, subItem?: SubItemId) => void;
  variant?: 'light' | 'dark';
  previewMode?: boolean; // When true, no item is highlighted (viewing public profile)
}

const STORAGE_KEY = 'profile-sidebar-expanded';

export default function ProfileSidebar({
  user,
  isGuide,
  pendingBookings = 0,
  pendingActivity = 0,
  activeSection,
  activeSubItem,
  onSectionChange,
  variant = 'light',
  previewMode = false,
}: ProfileSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isDark = variant === 'dark';

  // Load expanded state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsExpanded(stored === 'true');
    }
  }, []);

  // Save expanded state to localStorage
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(STORAGE_KEY, String(newState));
  };

  const navItems = [
    {
      id: 'dashboard' as SectionId,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'activity' as SectionId,
      label: 'Activity',
      icon: Activity,
      badge: pendingActivity,
    },
    {
      id: 'profile' as SectionId,
      label: 'Profile',
      icon: User,
      subItems: [
        { id: 'personal-info', label: 'Personal Info' },
        { id: 'travel-history', label: 'Travel History' },
        { id: 'badges', label: 'Badges' },
        { id: 'links', label: 'Links' },
      ],
    },
    {
      id: 'settings' as SectionId,
      label: 'Settings',
      icon: Settings,
      subItems: [
        { id: 'privacy', label: 'Privacy' },
        { id: 'appearance', label: 'Appearance' },
        { id: 'guide-mode', label: 'Guide Mode' },
        { id: 'integrations', label: 'Integrations' },
      ],
    },
    ...(isGuide
      ? [
          {
            id: 'bookings' as SectionId,
            label: 'Bookings',
            icon: CalendarDays,
            badge: pendingBookings,
          },
        ]
      : []),
  ];

  const handleSectionClick = (sectionId: SectionId) => {
    const item = navItems.find((i) => i.id === sectionId);
    if (item?.subItems && item.subItems.length > 0) {
      // If clicking a section with sub-items, select the first sub-item
      onSectionChange(sectionId, item.subItems[0].id as SubItemId);
    } else {
      onSectionChange(sectionId);
    }
    setIsMobileOpen(false);
  };

  const handleSubItemClick = (sectionId: SectionId, subItemId: string) => {
    onSectionChange(sectionId, subItemId as SubItemId);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Navigation */}
      <nav className={`flex-1 p-2 space-y-1 ${isExpanded ? 'overflow-y-auto' : 'overflow-visible'}`}>
        {navItems.map((item) => (
          <ProfileSidebarItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            isActive={!previewMode && activeSection === item.id}
            isExpanded={isExpanded}
            subItems={item.subItems}
            activeSubItem={!previewMode && activeSection === item.id ? activeSubItem : null}
            badge={item.badge}
            onClick={() => handleSectionClick(item.id)}
            onSubItemClick={(subId) => handleSubItemClick(item.id, subId)}
            variant={variant}
          />
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className={`p-2 border-t ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
        <button
          onClick={toggleExpanded}
          className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors ${
            isDark
              ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* User Menu */}
      <div className={`p-2 border-t ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
        <ProfileUserMenu user={user} isExpanded={isExpanded} variant={variant} />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-md border ${
          isDark
            ? 'bg-zinc-900 border-zinc-700 text-zinc-400'
            : 'bg-white border-gray-200 text-gray-600'
        }`}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ${
          isDark ? 'bg-zinc-950' : 'bg-white'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className={`absolute top-4 right-4 p-2 ${
            isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col h-full pt-12">{sidebarContent}</div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-full transition-all duration-300 relative z-10 ${
          isDark ? 'bg-zinc-950' : 'bg-white border-r border-gray-200'
        } ${isExpanded ? 'w-52' : 'w-14'}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
