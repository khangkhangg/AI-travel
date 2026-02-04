import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

/**
 * GET /api/admin/businesses
 * List all businesses with owner info, verification status, and stats
 */
export async function GET(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // active, inactive, verified, pending
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT
        b.id,
        b.business_name,
        b.business_type,
        b.description,
        b.logo_url,
        b.handle,
        b.is_active,
        b.verified,
        b.ekyc_verified,
        b.ekyc_verified_at,
        b.rating,
        b.review_count,
        b.coverage_areas,
        b.contact_info,
        b.created_at,
        b.updated_at,
        u.id as owner_id,
        u.email as owner_email,
        u.full_name as owner_name,
        u.avatar_url as owner_avatar,
        (SELECT COUNT(*) FROM business_verification_documents WHERE business_id = b.id AND status = 'pending') as pending_docs,
        (SELECT COUNT(*) FROM business_verification_documents WHERE business_id = b.id AND status = 'approved') as approved_docs,
        (SELECT COUNT(*) FROM marketplace_proposals WHERE business_id = b.id) as proposal_count
      FROM businesses b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      sql += ` AND (
        b.business_name ILIKE $${paramIndex}
        OR b.handle ILIKE $${paramIndex}
        OR u.email ILIKE $${paramIndex}
        OR u.full_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Status filter
    if (status === 'active') {
      sql += ` AND b.is_active = true`;
    } else if (status === 'inactive') {
      sql += ` AND b.is_active = false`;
    } else if (status === 'verified') {
      sql += ` AND b.ekyc_verified = true`;
    } else if (status === 'pending') {
      sql += ` AND b.ekyc_verified = false AND EXISTS (
        SELECT 1 FROM business_verification_documents WHERE business_id = b.id AND status = 'pending'
      )`;
    }

    // Type filter
    if (type) {
      sql += ` AND b.business_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    sql += ` ORDER BY b.created_at DESC`;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) FROM businesses b LEFT JOIN users u ON u.id = b.user_id WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countSql += ` AND (
        b.business_name ILIKE $${countParamIndex}
        OR b.handle ILIKE $${countParamIndex}
        OR u.email ILIKE $${countParamIndex}
        OR u.full_name ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (status === 'active') {
      countSql += ` AND b.is_active = true`;
    } else if (status === 'inactive') {
      countSql += ` AND b.is_active = false`;
    } else if (status === 'verified') {
      countSql += ` AND b.ekyc_verified = true`;
    } else if (status === 'pending') {
      countSql += ` AND b.ekyc_verified = false AND EXISTS (
        SELECT 1 FROM business_verification_documents WHERE business_id = b.id AND status = 'pending'
      )`;
    }

    if (type) {
      countSql += ` AND b.business_type = $${countParamIndex}`;
      countParams.push(type);
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get stats
    const statsResult = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_active = false) as inactive,
        COUNT(*) FILTER (WHERE ekyc_verified = true) as verified,
        COUNT(*) FILTER (WHERE ekyc_verified = false AND EXISTS (
          SELECT 1 FROM business_verification_documents WHERE business_id = businesses.id AND status = 'pending'
        )) as pending_verification,
        COUNT(*) FILTER (WHERE business_type = 'guide') as guides,
        COUNT(*) FILTER (WHERE business_type = 'hotel') as hotels,
        COUNT(*) FILTER (WHERE business_type = 'transport') as transport,
        COUNT(*) FILTER (WHERE business_type = 'experience') as experiences
      FROM businesses
    `);

    // Transform to camelCase for frontend
    const transformedBusinesses = result.rows.map((row: any) => ({
      id: row.id,
      name: row.business_name,
      businessType: row.business_type,
      description: row.description,
      logoUrl: row.logo_url,
      handle: row.handle,
      isActive: row.is_active,
      verified: row.verified,
      ekycVerified: row.ekyc_verified,
      ekycVerifiedAt: row.ekyc_verified_at,
      rating: row.rating,
      reviewCount: row.review_count,
      coverageAreas: row.coverage_areas,
      contactInfo: row.contact_info,
      location: row.coverage_areas?.[0]?.city
        ? `${row.coverage_areas[0].city}${row.coverage_areas[0].country ? ', ' + row.coverage_areas[0].country : ''}`
        : (row.contact_info?.address || null),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ownerId: row.owner_id,
      ownerEmail: row.owner_email,
      ownerName: row.owner_name,
      ownerAvatar: row.owner_avatar,
      pendingDocs: parseInt(row.pending_docs) || 0,
      approvedDocs: parseInt(row.approved_docs) || 0,
      hasDocuments: (parseInt(row.pending_docs) || 0) + (parseInt(row.approved_docs) || 0) > 0,
      proposalCount: parseInt(row.proposal_count) || 0,
    }));

    const stats = statsResult.rows[0];

    return NextResponse.json({
      businesses: transformedBusinesses,
      total,
      stats: {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        inactive: parseInt(stats.inactive) || 0,
        verified: parseInt(stats.verified) || 0,
        pendingVerification: parseInt(stats.pending_verification) || 0,
        guides: parseInt(stats.guides) || 0,
        hotels: parseInt(stats.hotels) || 0,
        transport: parseInt(stats.transport) || 0,
        experiences: parseInt(stats.experiences) || 0,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses', details: error.message },
      { status: 500 }
    );
  }
}
