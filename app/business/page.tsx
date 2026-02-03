'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Loader2 } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';

import BusinessLayout from '@/components/business/BusinessLayout';
import { BusinessSectionId, BusinessSubItemId } from '@/components/business/BusinessSidebar';
import {
  BusinessDashboardPanel,
  BusinessProfilePanel,
  BusinessVerificationPanel,
  BusinessNotificationsPanel,
  BusinessReviewsPanel,
  BusinessServicesPanel,
  BusinessProposalsPanel,
  BusinessMarketplacePanel,
} from '@/components/business/panels';

interface CoverageArea {
  city: string;
  country: string;
}

interface ContactInfo {
  email?: string;
  phone?: string;
  whatsapp?: string;
}

interface SocialLinks {
  website?: string;
  instagram?: string;
  telegram?: string;
}

interface Business {
  id: string;
  user_id: string;
  business_type: string;
  business_name: string;
  description: string;
  logo_url?: string;
  coverage_areas: CoverageArea[];
  contact_info: ContactInfo;
  social_links: SocialLinks;
  rating: number;
  review_count: number;
  ekyc_status: 'pending' | 'verified' | 'rejected' | null;
  is_active: boolean;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  role?: string;
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats (could be fetched from a separate endpoint)
  const [stats, setStats] = useState({
    totalProposals: 0,
    pendingProposals: 0,
    activeServices: 0,
    profileViews: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Check authentication
      const supabase = createBrowserSupabaseClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/');
        return;
      }

      // Fetch user data
      const userResponse = await fetch('/api/users');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser({
          id: userData.user.id,
          email: userData.user.email,
          full_name: userData.user.fullName,
          username: userData.user.username,
          avatar_url: userData.user.avatarUrl,
          role: userData.user.role,
        });
      }

      // Fetch business data
      const businessResponse = await fetch('/api/businesses?self=true');
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();

        if (!businessData.isBusiness) {
          // User doesn't have a business, redirect to registration
          router.push('/business/register');
          return;
        }

        const b = businessData.business;
        setBusiness({
          id: b.id,
          user_id: b.user_id,
          business_type: b.business_type,
          business_name: b.business_name,
          description: b.description || '',
          logo_url: b.logo_url,
          coverage_areas: b.coverage_areas || [],
          contact_info: b.contact_info || {},
          social_links: b.social_links || {},
          rating: parseFloat(b.rating) || 0,
          review_count: b.review_count || 0,
          ekyc_status: b.ekyc_status,
          is_active: b.is_active,
          created_at: b.created_at,
        });

        // Fetch services count
        try {
          const servicesResponse = await fetch(`/api/businesses/${b.id}/services`);
          if (servicesResponse.ok) {
            const servicesData = await servicesResponse.json();
            setStats((prev) => ({
              ...prev,
              activeServices: (servicesData.services || []).filter((s: any) => s.is_active).length,
            }));
          }
        } catch (e) {
          // Services API might not exist yet, that's ok
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load business dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (data: Partial<{
    businessName: string;
    description: string;
    coverageAreas: CoverageArea[];
    contactInfo: ContactInfo;
    socialLinks: SocialLinks;
  }>) => {
    if (!business) return;

    const response = await fetch(`/api/businesses/${business.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: data.businessName,
        description: data.description,
        coverage_areas: data.coverageAreas,
        contact_info: data.contactInfo,
        social_links: data.socialLinks,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update business');
    }

    await fetchData();
  };

  const handleLogoUpload = async (file: File) => {
    if (!business) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/businesses/${business.id}/logo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to upload logo');
    }

    await fetchData();
  };

  // Render panel based on active section
  const renderPanel = (activeSection: BusinessSectionId, activeSubItem: BusinessSubItemId | null) => {
    if (!business) return null;

    switch (activeSection) {
      case 'dashboard':
        return (
          <BusinessDashboardPanel
            business={{
              id: business.id,
              businessName: business.business_name,
              businessType: business.business_type,
              rating: business.rating,
              reviewCount: business.review_count,
              ekycStatus: business.ekyc_status,
            }}
            stats={stats}
          />
        );

      case 'proposals':
        return <BusinessProposalsPanel />;

      case 'marketplace':
        return <BusinessMarketplacePanel />;

      case 'reviews':
        return <BusinessReviewsPanel businessId={business.id} />;

      case 'services':
        return <BusinessServicesPanel businessId={business.id} />;

      case 'profile':
        return (
          <BusinessProfilePanel
            subSection={activeSubItem === 'contact-social' ? 'contact-social' : 'business-info'}
            business={{
              id: business.id,
              businessName: business.business_name,
              businessType: business.business_type,
              description: business.description,
              logoUrl: business.logo_url,
              coverageAreas: business.coverage_areas,
              contactInfo: business.contact_info,
              socialLinks: business.social_links,
            }}
            onSave={handleSaveProfile}
            onLogoUpload={handleLogoUpload}
          />
        );

      case 'verification':
        return (
          <BusinessVerificationPanel
            businessId={business.id}
            ekycStatus={business.ekyc_status}
          />
        );

      case 'settings':
        if (activeSubItem === 'notifications') {
          return <BusinessNotificationsPanel />;
        }
        return <BusinessNotificationsPanel />;

      default:
        return (
          <BusinessDashboardPanel
            business={{
              id: business.id,
              businessName: business.business_name,
              businessType: business.business_type,
              rating: business.rating,
              reviewCount: business.review_count,
              ekycStatus: business.ekyc_status,
            }}
            stats={stats}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading business dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">{error || 'Business not found'}</p>
          <p className="text-gray-500 mb-4">Please register your business to continue</p>
          <Link href="/business/register" className="text-emerald-600 hover:underline">
            Register Business
          </Link>
        </div>
      </div>
    );
  }

  return (
    <BusinessLayout
      user={{
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        avatarUrl: user.avatar_url,
        email: user.email,
        role: user.role,
      }}
      business={{
        id: business.id,
        businessName: business.business_name,
        businessType: business.business_type,
        logoUrl: business.logo_url,
      }}
      pendingProposals={stats.pendingProposals}
      pendingReviews={0}
    >
      {renderPanel}
    </BusinessLayout>
  );
}
