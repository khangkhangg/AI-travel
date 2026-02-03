'use client';

import { useState, useEffect, ReactNode } from 'react';
import ProfileSidebar, { SectionId, SubItemId } from './ProfileSidebar';

interface ProfileLayoutProps {
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
  children: (activeSection: SectionId, activeSubItem: SubItemId | null) => ReactNode;
  defaultSection?: SectionId;
  defaultSubItem?: SubItemId;
  onSectionChange?: (section: SectionId, subItem?: SubItemId) => void;
}

const STORAGE_KEY = 'profile-active-section';

export default function ProfileLayout({
  user,
  isGuide,
  pendingBookings = 0,
  children,
  defaultSection = 'dashboard',
  defaultSubItem,
  onSectionChange: onSectionChangeCallback,
}: ProfileLayoutProps) {
  const [activeSection, setActiveSection] = useState<SectionId>(defaultSection);
  const [activeSubItem, setActiveSubItem] = useState<SubItemId | null>(defaultSubItem || null);

  // Restore last active section from localStorage (runs once on mount)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { section, subItem } = JSON.parse(stored);
        if (section) {
          setActiveSection(section);
          setActiveSubItem(subItem || null);
        }
      } catch {
        // Invalid stored data, use defaults
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save active section to localStorage and notify parent
  const handleSectionChange = (section: SectionId, subItem?: SubItemId) => {
    setActiveSection(section);
    setActiveSubItem(subItem || null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ section, subItem }));
    onSectionChangeCallback?.(section, subItem);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ProfileSidebar
        user={user}
        isGuide={isGuide}
        pendingBookings={pendingBookings}
        activeSection={activeSection}
        activeSubItem={activeSubItem}
        onSectionChange={handleSectionChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-0">
        <div className="h-full bg-white lg:rounded-l-2xl lg:border-l border-gray-200 shadow-sm">
          {children(activeSection, activeSubItem)}
        </div>
      </main>
    </div>
  );
}
