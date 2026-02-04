import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - list businesses with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const location = searchParams.get('location');
    const self = searchParams.get('self');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // If self=true, return current user's business
    if (self === 'true') {
      const user = await getUser();
      if (!user) {
        // Not logged in - distinguish from "logged in but no business"
        return NextResponse.json({ isBusiness: false, isLoggedIn: false });
      }

      const result = await query(
        `SELECT b.*, bd.details as business_details
         FROM businesses b
         LEFT JOIN business_details bd ON bd.business_id = b.id
         WHERE b.user_id = $1 AND b.is_active = true`,
        [user.id]
      );

      if (result.rows.length > 0) {
        return NextResponse.json({ isBusiness: true, isLoggedIn: true, business: result.rows[0] });
      }
      return NextResponse.json({ isBusiness: false, isLoggedIn: true });
    }

    // Build query for listing businesses
    let sql = `
      SELECT b.*, bd.details as business_details,
        u.full_name as owner_name, u.avatar_url as owner_avatar
      FROM businesses b
      LEFT JOIN business_details bd ON bd.business_id = b.id
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.is_active = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      sql += ` AND b.business_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (location) {
      sql += ` AND b.coverage_areas @> $${paramIndex}::jsonb`;
      params.push(JSON.stringify([{ city: location }]));
      paramIndex++;
    }

    sql += ` ORDER BY b.rating DESC, b.review_count DESC`;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get services for each business
    const businessIds = result.rows.map(b => b.id);
    let services: any[] = [];
    if (businessIds.length > 0) {
      const servicesResult = await query(
        `SELECT * FROM business_services WHERE business_id = ANY($1) AND is_active = true`,
        [businessIds]
      );
      services = servicesResult.rows;
    }

    // Attach services to businesses
    const businesses = result.rows.map(b => ({
      ...b,
      services: services.filter(s => s.business_id === b.id)
    }));

    return NextResponse.json({ businesses });
  } catch (error: any) {
    console.error('Failed to fetch businesses:', error);
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
  }
}

// POST - register new business
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      business_type,
      business_name,
      description,
      logo_url,
      coverage_areas,
      contact_info,
      social_links,
      details,
      services
    } = body;

    // Validate required fields
    if (!business_type || !business_name) {
      return NextResponse.json(
        { error: 'Business type and name are required' },
        { status: 400 }
      );
    }

    // Check if user already has a business of this type
    const existing = await query(
      'SELECT id FROM businesses WHERE user_id = $1 AND business_type = $2',
      [user.id, business_type]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already have a business of this type registered' },
        { status: 400 }
      );
    }

    // Create business
    const businessResult = await query(
      `INSERT INTO businesses (
        user_id, business_type, business_name, description, logo_url,
        coverage_areas, contact_info, social_links, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [
        user.id,
        business_type,
        business_name,
        description || '',
        logo_url || null,
        JSON.stringify(coverage_areas || []),
        JSON.stringify(contact_info || {}),
        JSON.stringify(social_links || {})
      ]
    );

    const business = businessResult.rows[0];

    // Add business details (type-specific)
    if (details) {
      await query(
        `INSERT INTO business_details (business_id, details, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [business.id, JSON.stringify(details)]
      );
    }

    // Add services
    if (services && services.length > 0) {
      for (const service of services) {
        await query(
          `INSERT INTO business_services (
            business_id, service_name, description, price_type, base_price, currency, add_ons, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            business.id,
            service.service_name,
            service.description || '',
            service.price_type || 'fixed',
            service.base_price || 0,
            service.currency || 'USD',
            JSON.stringify(service.add_ons || [])
          ]
        );
      }
    }

    return NextResponse.json({ business });
  } catch (error: any) {
    console.error('Failed to register business:', error);
    return NextResponse.json({ error: 'Failed to register business' }, { status: 500 });
  }
}
