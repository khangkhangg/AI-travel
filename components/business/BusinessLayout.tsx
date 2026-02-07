'use client';

import { useState, useEffect, ReactNode } from 'react';
import BusinessSidebar, { BusinessSectionId, BusinessSubItemId } from './BusinessSidebar';
import Footer from '@/components/Footer';

interface BusinessLayoutProps {
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
  children: (activeSection: BusinessSectionId, activeSubItem: BusinessSubItemId | null) => ReactNode;
  defaultSection?: BusinessSectionId;
  defaultSubItem?: BusinessSubItemId;
  onSectionChange?: (section: BusinessSectionId, subItem?: BusinessSubItemId) => void;
}

const STORAGE_KEY = 'business-active-section';

export default function BusinessLayout({
  user,
  business,
  pendingProposals = 0,
  pendingReviews = 0,
  children,
  defaultSection = 'dashboard',
  defaultSubItem,
  onSectionChange: onSectionChangeCallback,
}: BusinessLayoutProps) {
  const [activeSection, setActiveSection] = useState<BusinessSectionId>(defaultSection);
  const [activeSubItem, setActiveSubItem] = useState<BusinessSubItemId | null>(defaultSubItem || null);

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
  const handleSectionChange = (section: BusinessSectionId, subItem?: BusinessSubItemId) => {
    setActiveSection(section);
    setActiveSubItem(subItem || null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ section, subItem }));
    onSectionChangeCallback?.(section, subItem);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <BusinessSidebar
        user={user}
        business={business}
        pendingProposals={pendingProposals}
        pendingReviews={pendingReviews}
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
