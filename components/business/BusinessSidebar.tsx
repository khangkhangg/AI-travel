'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Store,
  Star,
  Package,
  Building2,
  ShieldCheck,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
} from 'lucide-react';
import ProfileSidebarItem from '../profile/ProfileSidebarItem';
import ProfileUserMenu from '../profile/ProfileUserMenu';

export type BusinessSectionId =
  | 'dashboard'
  | 'proposals'
  | 'marketplace'
  | 'reviews'
  | 'services'
  | 'profile'
  | 'verification'
  | 'settings';

export type BusinessSubItemId =
  | 'business-info'
  | 'contact-social'
  | 'notifications';

interface BusinessSidebarProps {
  user: {
    id: string;
    fullName?: string;
    username?: string;
    avatarUrl?: string;
    email: string;
    role?: string;
  };
  business: {
    id: string;
    businessName: string;
    businessType: string;
    logoUrl?: string;
  };
  pendingProposals?: number;
  pendingReviews?: number;
  activeSection: BusinessSectionId;
  activeSubItem: BusinessSubItemId | null;
  onSectionChange: (section: BusinessSectionId, subItem?: BusinessSubItemId) => void;
  variant?: 'light' | 'dark';
}

const STORAGE_KEY = 'business-sidebar-expanded';

export default function BusinessSidebar({
  user,
  business,
  pendingProposals = 0,
  pendingReviews = 0,
  activeSection,
  activeSubItem,
  onSectionChange,
  variant = 'light',
}: BusinessSidebarProps) {
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
      id: 'dashboard' as BusinessSectionId,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'proposals' as BusinessSectionId,
      label: 'Proposals',
      icon: FileText,
      badge: pendingProposals,
    },
    {
      id: 'marketplace' as BusinessSectionId,
      label: 'Marketplace',
      icon: Store,
    },
    {
      id: 'reviews' as BusinessSectionId,
      label: 'Reviews',
      icon: Star,
      badge: pendingReviews,
    },
    {
      id: 'services' as BusinessSectionId,
      label: 'Services',
      icon: Package,
    },
    {
      id: 'profile' as BusinessSectionId,
      label: 'Profile',
      icon: Building2,
      subItems: [
        { id: 'business-info', label: 'Business Info' },
        { id: 'contact-social', label: 'Contact & Social' },
      ],
    },
    {
      id: 'verification' as BusinessSectionId,
      label: 'Verification',
      icon: ShieldCheck,
    },
    {
      id: 'settings' as BusinessSectionId,
      label: 'Settings',
      icon: Settings,
      subItems: [
        { id: 'notifications', label: 'Notifications' },
      ],
    },
  ];

  const handleSectionClick = (sectionId: BusinessSectionId) => {
    const item = navItems.find((i) => i.id === sectionId);
    if (item?.subItems && item.subItems.length > 0) {
      // If clicking a section with sub-items, select the first sub-item
      onSectionChange(sectionId, item.subItems[0].id as BusinessSubItemId);
    } else {
      onSectionChange(sectionId);
    }
    setIsMobileOpen(false);
  };

  const handleSubItemClick = (sectionId: BusinessSectionId, subItemId: string) => {
    onSectionChange(sectionId, subItemId as BusinessSubItemId);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Business Header */}
      <div className={`p-3 border-b ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className={`w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-emerald-100'}`}>
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.businessName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-emerald-600'}`} />
              </div>
            )}
          </div>

          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${isDark ? 'text-zinc-200' : 'text-gray-900'}`}>
                {business.businessName}
              </p>
              <p className={`text-[10px] truncate capitalize ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                {business.businessType.replace('_', ' ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 p-2 space-y-1 ${isExpanded ? 'overflow-y-auto' : 'overflow-visible'}`}>
        {navItems.map((item) => (
          <ProfileSidebarItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            isActive={activeSection === item.id}
            isExpanded={isExpanded}
            subItems={item.subItems}
            activeSubItem={activeSection === item.id ? activeSubItem : null}
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
