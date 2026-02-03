import { Metadata } from 'next';
import { query } from '@/lib/db';
import BusinessProfileClient from './BusinessProfileClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Fetch business data for metadata generation
async function getBusinessData(id: string) {
  try {
    const result = await query(
      `SELECT b.*, bd.details as business_details,
        u.full_name as owner_name, u.avatar_url as owner_avatar
       FROM businesses b
       LEFT JOIN business_details bd ON bd.business_id = b.id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.id = $1 AND b.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      coverage_areas: result.rows[0].coverage_areas || [],
      rating: parseFloat(result.rows[0].rating) || 0,
      review_count: result.rows[0].review_count || 0,
    };
  } catch (error) {
    console.error('Failed to fetch business for metadata:', error);
    return null;
  }
}

// Dynamic SEO metadata generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const business = await getBusinessData(id);

  if (!business) {
    return {
      title: 'Business Not Found',
      description: 'The business you are looking for does not exist or is no longer available.',
    };
  }

  const title = `${business.business_name} | ${business.business_type.replace('_', ' ')} Travel Service`;
  const description = business.description
    ? business.description.slice(0, 155) + (business.description.length > 155 ? '...' : '')
    : `${business.business_name} is a ${business.business_type.replace('_', ' ')} providing travel services.`;

  const coverageText = business.coverage_areas.length > 0
    ? business.coverage_areas.map((a: { city: string; country: string }) => `${a.city}, ${a.country}`).join(' • ')
    : '';

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-travel.com';
  const pageUrl = `${baseUrl}/business/${id}`;

  return {
    title,
    description,
    keywords: [
      business.business_name,
      business.business_type.replace('_', ' '),
      'travel service',
      'local guide',
      'tour operator',
      ...business.coverage_areas.map((a: { city: string; country: string }) => a.city),
      ...business.coverage_areas.map((a: { city: string; country: string }) => a.country),
    ].filter(Boolean),
    authors: [{ name: business.owner_name || business.business_name }],
    openGraph: {
      title: business.business_name,
      description,
      url: pageUrl,
      siteName: 'AI Travel',
      type: 'profile',
      images: business.logo_url
        ? [
            {
              url: business.logo_url,
              width: 400,
              height: 400,
              alt: `${business.business_name} logo`,
            },
          ]
        : [],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary',
      title: business.business_name,
      description,
      images: business.logo_url ? [business.logo_url] : [],
    },
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'business:contact_data:locality': coverageText,
    },
  };
}

// Generate JSON-LD structured data for rich snippets
// Safe to use with dangerouslySetInnerHTML as JSON.stringify escapes all special chars
function generateJsonLd(business: any, baseUrl: string): string {
  const pageUrl = `${baseUrl}/business/${business.id}`;

  // LocalBusiness schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': pageUrl,
    name: business.business_name,
    description: business.description,
    url: pageUrl,
    image: business.logo_url,
    priceRange: '$$',
    aggregateRating: business.review_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: business.rating.toFixed(1),
          reviewCount: business.review_count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    address: business.coverage_areas.length > 0
      ? {
          '@type': 'PostalAddress',
          addressLocality: business.coverage_areas[0].city,
          addressCountry: business.coverage_areas[0].country,
        }
      : undefined,
    contactPoint: business.contact_info?.email || business.contact_info?.phone
      ? {
          '@type': 'ContactPoint',
          email: business.contact_info.email,
          telephone: business.contact_info.phone,
          contactType: 'customer service',
        }
      : undefined,
    sameAs: [
      business.social_links?.website,
      business.social_links?.instagram
        ? `https://instagram.com/${business.social_links.instagram.replace('@', '')}`
        : null,
    ].filter(Boolean),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Businesses',
        item: `${baseUrl}/businesses`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: business.business_name,
        item: pageUrl,
      },
    ],
  };

  // JSON.stringify safely escapes all special characters preventing XSS
  return JSON.stringify([localBusinessSchema, breadcrumbSchema]);
}

// Component for rendering JSON-LD script tag
function JsonLdScript({ jsonLd }: { jsonLd: string }) {
  return (
    <script
      type="application/ld+json"
      // Safe: jsonLd is created via JSON.stringify which escapes special chars
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}

export default async function PublicBusinessProfilePage({ params }: PageProps) {
  const { id } = await params;
  const business = await getBusinessData(id);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-travel.com';

  return (
    <>
      {/* JSON-LD Structured Data for SEO rich snippets */}
      {business && <JsonLdScript jsonLd={generateJsonLd(business, baseUrl)} />}

      {/* Client Component for Interactive UI */}
      <BusinessProfileClient businessId={id} />
    </>
  );
}
