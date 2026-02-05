'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Instagram,
  MessageCircle,
  Send,
  ShieldCheck,
  Package,
  DollarSign,
  User,
  CheckCircle,
  Loader2,
  Share2,
} from 'lucide-react';
import BusinessSidebar, { BusinessSectionId, BusinessSubItemId } from '@/components/business/BusinessSidebar';
import BusinessReviewForm from '@/components/business/BusinessReviewForm';

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

interface Service {
  id: string;
  service_name: string;
  description: string;
  price_type: string;
  base_price: number;
  currency: string;
  add_ons: { name: string; price: number }[];
}

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  rating: number;
  review_text: string;
  verified_contact: boolean;
  verified_location: boolean;
  verified_services: boolean;
  verified_pricing: boolean;
  created_at: string;
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
  owner_name?: string;
  owner_avatar?: string;
}

interface VerificationCounts {
  verified_contact_count: number;
  verified_location_count: number;
  verified_services_count: number;
  verified_pricing_count: number;
}

interface CurrentUser {
  id: string;
  fullName?: string;
  username?: string;
  avatarUrl?: string;
  email: string;
  role?: string;
}

interface BusinessProfileClientProps {
  businessId: string;
}

export default function BusinessProfileClient({ businessId }: BusinessProfileClientProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verificationCounts, setVerificationCounts] = useState<VerificationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // User/owner state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Sidebar state for owner view
  const [activeSection, setActiveSection] = useState<BusinessSectionId>('dashboard');
  const [activeSubItem, setActiveSubItem] = useState<BusinessSubItemId | null>(null);

  useEffect(() => {
    fetchBusinessData();
    fetchCurrentUser();
  }, [businessId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser({
          id: data.user.id,
          fullName: data.user.fullName,
          username: data.user.username,
          avatarUrl: data.user.avatarUrl,
          email: data.user.email,
          role: data.user.role,
        });
      }
    } catch (e) {
      // User not logged in
    }
  };

  const fetchBusinessData = async () => {
    try {
      const businessResponse = await fetch(`/api/businesses/${businessId}`);
      if (!businessResponse.ok) {
        if (businessResponse.status === 404) {
          setError('Business not found');
        } else {
          setError('Failed to load business');
        }
        setLoading(false);
        return;
      }

      const businessData = await businessResponse.json();
      const businessInfo = {
        ...businessData.business,
        coverage_areas: businessData.business.coverage_areas || [],
        contact_info: businessData.business.contact_info || {},
        social_links: businessData.business.social_links || {},
        rating: parseFloat(businessData.business.rating) || 0,
        review_count: businessData.business.review_count || 0,
      };
      setBusiness(businessInfo);
      setIsOwner(businessData.isOwner || false);

      // Fetch services
      try {
        const servicesResponse = await fetch(`/api/businesses/${businessId}/services`);
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServices(servicesData.services || []);
        }
      } catch (e) {
        // Services API might not exist
      }

      // Fetch reviews
      try {
        const reviewsResponse = await fetch(`/api/businesses/${businessId}/reviews?limit=5`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews || []);
          setVerificationCounts(reviewsData.verificationCounts);
        }
      } catch (e) {
        // Reviews API might fail
      }
    } catch (err) {
      console.error('Failed to fetch business data:', err);
      setError('Failed to load business');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (section: BusinessSectionId, subItem?: BusinessSubItemId) => {
    const sectionPath = section === 'dashboard' ? '' : `?section=${section}${subItem ? `&sub=${subItem}` : ''}`;
    window.location.href = `/business${sectionPath}`;
  };

  const handleShare = async (platform: 'copy' | 'twitter' | 'facebook' | 'linkedin') => {
    const url = window.location.href;
    const title = business?.business_name || 'Check out this business';
    const description = business?.description?.slice(0, 100) || '';

    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
    }
    setShowShareMenu(false);
  };

  const refreshReviews = async () => {
    try {
      const reviewsResponse = await fetch(`/api/businesses/${businessId}/reviews?limit=5`);
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.reviews || []);
        setVerificationCounts(reviewsData.verificationCounts);
        // Update business review count
        if (business) {
          setBusiness({ ...business, review_count: reviewsData.total });
        }
      }
    } catch (e) {
      // Silently fail
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    refreshReviews();
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number, size = 'w-5 h-5') => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
            }`}
          />
        ))}
      </div>
    );
  };

  const priceTypeLabels: Record<string, string> = {
    fixed: '',
    hourly: '/hr',
    daily: '/day',
    custom: '',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">{error || 'Business not found'}</h1>
          <p className="text-zinc-500 mb-6">This business doesn't exist or is no longer available.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Main content component (used in both layouts)
  const ProfileContent = () => (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <header className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={`${business.business_name} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="w-10 h-10 md:w-14 md:h-14 text-zinc-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                      {business.business_name}
                    </h1>
                    {business.ekyc_status === 'verified' && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                        <ShieldCheck className="w-4 h-4" />
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="text-zinc-400 text-lg capitalize mb-4">
                    {business.business_type.replace('_', ' ')}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Write a Review Button - only show for non-owners */}
                  {!isOwner && currentUser && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium"
                    >
                      <Star className="w-4 h-4" />
                      <span className="hidden sm:inline">Write a Review</span>
                    </button>
                  )}

                  {/* Share Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
                      aria-label="Share this business"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </button>

                  {showShareMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl py-2 min-w-[160px] z-50">
                        <button
                          onClick={() => handleShare('copy')}
                          className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-800 text-sm"
                        >
                          {copied ? '✓ Copied!' : 'Copy link'}
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-800 text-sm"
                        >
                          Share on X
                        </button>
                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-800 text-sm"
                        >
                          Share on Facebook
                        </button>
                        <button
                          onClick={() => handleShare('linkedin')}
                          className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-800 text-sm"
                        >
                          Share on LinkedIn
                        </button>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              </div>

              {/* Rating & Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  {renderStars(business.rating)}
                  <span className="text-white font-bold">
                    {business.rating > 0 ? business.rating.toFixed(1) : '—'}
                  </span>
                  <span className="text-zinc-500">
                    ({business.review_count} {business.review_count === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>

              {/* Coverage Areas */}
              {business.coverage_areas.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  {business.coverage_areas.map((area, index) => (
                    <span key={index} className="text-zinc-400 text-sm">
                      {area.city}, {area.country}
                      {index < business.coverage_areas.length - 1 && ' •'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10" aria-label="Business profile tabs">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1" role="tablist">
            {(['overview', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`${tab}-panel`}
                className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'reviews' && business.review_count > 0 && (
                  <span className="ml-1 text-zinc-600">({business.review_count})</span>
                )}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div
          id="overview-panel"
          role="tabpanel"
          aria-labelledby="overview-tab"
          hidden={activeTab !== 'overview'}
        >
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Main Content - About + Services Combined */}
              <article className="md:col-span-2 space-y-8">
                {/* Description */}
                {business.description && (
                  <section>
                    <h2 className="text-xl font-bold text-white mb-4">About</h2>
                    <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed">
                      {business.description}
                    </p>
                  </section>
                )}

                {/* Services Section */}
                {services.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-white mb-4">Services</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {services.map((service) => (
                        <article
                          key={service.id}
                          className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                          <h3 className="text-lg font-bold text-white mb-2">{service.service_name}</h3>
                          {service.description && (
                            <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{service.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-emerald-400">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-lg font-bold">
                                {formatPrice(service.base_price, service.currency)}
                              </span>
                              <span className="text-zinc-500 text-sm">
                                {priceTypeLabels[service.price_type]}
                              </span>
                            </div>
                            {service.add_ons && service.add_ons.length > 0 && (
                              <span className="text-zinc-500 text-xs">
                                +{service.add_ons.length} add-ons
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {/* User Verifications */}
                {verificationCounts && business.review_count > 0 && (
                  <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
                    <h3 className="text-lg font-bold text-white mb-4">User Verifications</h3>
                    <p className="text-zinc-500 text-sm mb-4">
                      Verified by customers who've used this business
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{verificationCounts.verified_contact_count}</p>
                          <p className="text-zinc-500 text-sm">Contact Verified</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{verificationCounts.verified_location_count}</p>
                          <p className="text-zinc-500 text-sm">Location Verified</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{verificationCounts.verified_services_count}</p>
                          <p className="text-zinc-500 text-sm">Services Verified</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{verificationCounts.verified_pricing_count}</p>
                          <p className="text-zinc-500 text-sm">Pricing Verified</p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </article>

              {/* Right Sidebar - Contact Info */}
              <aside className="space-y-6">
                <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
                  <h3 className="text-lg font-bold text-white mb-4">Contact</h3>
                  <address className="space-y-4 not-italic">
                    {business.contact_info.email && (
                      <a
                        href={`mailto:${business.contact_info.email}`}
                        className="flex items-center gap-3 text-zinc-400 hover:text-emerald-400 transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                        <span className="text-sm">{business.contact_info.email}</span>
                      </a>
                    )}
                    {business.contact_info.phone && (
                      <a
                        href={`tel:${business.contact_info.phone}`}
                        className="flex items-center gap-3 text-zinc-400 hover:text-emerald-400 transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                        <span className="text-sm">{business.contact_info.phone}</span>
                      </a>
                    )}
                    {business.contact_info.whatsapp && (
                      <a
                        href={`https://wa.me/${business.contact_info.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-zinc-400 hover:text-emerald-400 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">WhatsApp</span>
                      </a>
                    )}
                  </address>

                  {/* Social Links */}
                  {(business.social_links.website || business.social_links.instagram || business.social_links.telegram) && (
                    <div className="mt-6 pt-6 border-t border-zinc-800">
                      <h4 className="text-sm font-medium text-zinc-500 mb-3">Social</h4>
                      <div className="flex items-center gap-3">
                        {business.social_links.website && (
                          <a
                            href={business.social_links.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Website"
                            className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                          >
                            <Globe className="w-5 h-5" />
                          </a>
                        )}
                        {business.social_links.instagram && (
                          <a
                            href={`https://instagram.com/${business.social_links.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Instagram"
                            className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {business.social_links.telegram && (
                          <a
                            href={`https://t.me/${business.social_links.telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Telegram"
                            className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                          >
                            <Send className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>

        <div
          id="reviews-panel"
          role="tabpanel"
          aria-labelledby="reviews-tab"
          hidden={activeTab !== 'reviews'}
        >
          {activeTab === 'reviews' && (
            <section>
              {/* Reviews Header with Write Review Button */}
              {!isOwner && currentUser && (
                <div className="flex justify-end mb-6">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium"
                  >
                    <Star className="w-4 h-4" />
                    Write a Review
                  </button>
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-4">No reviews yet</p>
                  {!isOwner && currentUser && (
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium"
                    >
                      <Star className="w-4 h-4" />
                      Be the first to review
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800"
                      itemScope
                      itemType="https://schema.org/Review"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                          {review.reviewer_avatar ? (
                            <img
                              src={review.reviewer_avatar}
                              alt={review.reviewer_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-6 h-6 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white" itemProp="author">{review.reviewer_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                                  <meta itemProp="ratingValue" content={String(review.rating)} />
                                  {renderStars(review.rating, 'w-4 h-4')}
                                </div>
                                <time className="text-zinc-500 text-sm" itemProp="datePublished" dateTime={review.created_at}>
                                  {formatDate(review.created_at)}
                                </time>
                              </div>
                            </div>
                          </div>

                          {review.review_text && (
                            <p className="text-zinc-400 mt-3" itemProp="reviewBody">{review.review_text}</p>
                          )}

                          {/* Verification badges */}
                          {(review.verified_contact || review.verified_location || review.verified_services || review.verified_pricing) && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {review.verified_contact && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                  Contact
                                </span>
                              )}
                              {review.verified_location && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                  Location
                                </span>
                              )}
                              {review.verified_services && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                  Services
                                </span>
                              )}
                              {review.verified_pricing && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                  Pricing
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}

                  {business.review_count > reviews.length && (
                    <button className="w-full py-3 text-emerald-400 hover:bg-zinc-900 rounded-xl transition-colors font-medium">
                      View all {business.review_count} reviews
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50"
            onClick={() => setShowReviewModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <BusinessReviewForm
                  businessId={business.id}
                  businessName={business.business_name}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setShowReviewModal(false)}
                  variant="dark"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // If owner is viewing their own public business profile, show sidebar
  if (isOwner && currentUser) {
    return (
      <div className="flex h-screen bg-zinc-950">
        <BusinessSidebar
          user={{
            id: currentUser.id,
            fullName: currentUser.fullName,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl,
            email: currentUser.email,
            role: currentUser.role,
          }}
          business={{
            id: business.id,
            businessName: business.business_name,
            businessType: business.business_type,
            logoUrl: business.logo_url,
          }}
          activeSection={activeSection}
          activeSubItem={activeSubItem}
          onSectionChange={handleSectionChange}
          variant="dark"
        />
        <div className="flex-1 overflow-auto relative z-0">
          <ProfileContent />
        </div>
      </div>
    );
  }

  return <ProfileContent />;
}
