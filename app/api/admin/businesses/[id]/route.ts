import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/businesses/[id]
 * Get detailed business info including verification documents
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get business details
    const businessResult = await query(
      `SELECT
        b.*,
        u.id as owner_id,
        u.email as owner_email,
        u.full_name as owner_name,
        u.avatar_url as owner_avatar,
        u.created_at as owner_joined
      FROM businesses b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.id = $1`,
      [id]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const business = businessResult.rows[0];

    // Get verification documents
    const docsResult = await query(
      `SELECT * FROM business_verification_documents
       WHERE business_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // Get services
    const servicesResult = await query(
      `SELECT * FROM business_services
       WHERE business_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // Get recent reviews
    const reviewsResult = await query(
      `SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM business_reviews r
       LEFT JOIN users u ON u.id = r.reviewer_id
       WHERE r.business_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Get proposal stats
    const proposalStats = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE status = 'pending') as pending
       FROM marketplace_proposals
       WHERE business_id = $1`,
      [id]
    );

    // Transform to camelCase for frontend
    const transformedBusiness = {
      id: business.id,
      name: business.business_name,
      description: business.description,
      businessType: business.business_type,
      handle: business.handle,
      location: business.coverage_areas?.[0]?.city
        ? `${business.coverage_areas[0].city}${business.coverage_areas[0].country ? ', ' + business.coverage_areas[0].country : ''}`
        : (business.contact_info?.address || null),
      phone: business.contact_info?.phone || null,
      website: business.contact_info?.website || null,
      logoUrl: business.logo_url,
      isActive: business.is_active,
      verified: business.verified,
      ekycVerified: business.ekyc_verified,
      ekycVerifiedAt: business.ekyc_verified_at,
      rating: business.rating,
      reviewCount: business.review_count,
      coverageAreas: business.coverage_areas,
      contactInfo: business.contact_info,
      createdAt: business.created_at,
      updatedAt: business.updated_at,
      ownerId: business.owner_id,
      ownerEmail: business.owner_email,
      ownerName: business.owner_name,
      ownerAvatar: business.owner_avatar,
      ownerJoined: business.owner_joined,
    };

    const transformedDocs = docsResult.rows.map((doc: any) => ({
      id: doc.id,
      businessId: doc.business_id,
      documentType: doc.document_type,
      documentUrl: doc.document_url,
      status: doc.status,
      rejectionReason: doc.rejection_reason,
      aiAnalysis: doc.ai_analysis,
      reviewedAt: doc.reviewed_at,
      uploadedAt: doc.created_at,
      createdAt: doc.created_at,
    }));

    return NextResponse.json({
      business: transformedBusiness,
      documents: transformedDocs,
      services: servicesResult.rows,
      reviews: reviewsResult.rows,
      proposalStats: proposalStats.rows[0],
    });
  } catch (error: any) {
    console.error('Failed to fetch business:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/businesses/[id]
 * Update business status (activate/deactivate, verify/unverify)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    // Support both camelCase (frontend) and snake_case field names
    const isActive = body.isActive ?? body.is_active;
    const verified = body.verified;
    const ekycVerified = body.ekycVerified ?? body.ekyc_verified;
    const businessName = body.businessName ?? body.business_name;
    const description = body.description;
    const businessType = body.businessType ?? body.business_type;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (businessName !== undefined) {
      updates.push(`business_name = $${paramIndex}`);
      values.push(businessName);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (businessType !== undefined) {
      updates.push(`business_type = $${paramIndex}`);
      values.push(businessType);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    if (verified !== undefined) {
      updates.push(`verified = $${paramIndex}`);
      values.push(verified);
      paramIndex++;
    }

    if (ekycVerified !== undefined) {
      updates.push(`ekyc_verified = $${paramIndex}`);
      values.push(ekycVerified);
      paramIndex++;
      if (ekycVerified) {
        updates.push(`ekyc_verified_at = NOW()`);
      } else {
        updates.push(`ekyc_verified_at = NULL`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ business: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to update business:', error);
    return NextResponse.json(
      { error: 'Failed to update business', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/businesses/[id]
 * Permanently delete a business (use with caution)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const result = await query(
      'DELETE FROM businesses WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Business deleted' });
  } catch (error: any) {
    console.error('Failed to delete business:', error);
    return NextResponse.json(
      { error: 'Failed to delete business', details: error.message },
      { status: 500 }
    );
  }
}
