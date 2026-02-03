import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - get business by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user is logged in
    const user = await getUser();

    const result = await query(
      `SELECT b.*, bd.details as business_details,
        u.full_name as owner_name, u.avatar_url as owner_avatar, u.username as owner_username
       FROM businesses b
       LEFT JOIN business_details bd ON bd.business_id = b.id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get services
    const servicesResult = await query(
      'SELECT * FROM business_services WHERE business_id = $1 AND is_active = true',
      [id]
    );

    // Get recent proposals count
    const proposalsResult = await query(
      `SELECT COUNT(*) as count FROM marketplace_proposals
       WHERE business_id = $1 AND status IN ('pending', 'accepted')`,
      [id]
    );

    const business = {
      ...result.rows[0],
      services: servicesResult.rows,
      active_proposals_count: parseInt(proposalsResult.rows[0].count)
    };

    // Check if current user is the owner
    const isOwner = user ? user.id === business.user_id : false;

    return NextResponse.json({ business, isOwner });
  } catch (error: any) {
    console.error('Failed to fetch business:', error);
    return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
  }
}

// PATCH - update business
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const businessCheck = await query(
      'SELECT user_id FROM businesses WHERE id = $1',
      [id]
    );

    if (businessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (businessCheck.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      business_name,
      description,
      logo_url,
      coverage_areas,
      contact_info,
      social_links,
      details,
      is_active
    } = body;

    // Update business
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (business_name !== undefined) {
      updates.push(`business_name = $${paramIndex}`);
      values.push(business_name);
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    if (logo_url !== undefined) {
      updates.push(`logo_url = $${paramIndex}`);
      values.push(logo_url);
      paramIndex++;
    }
    if (coverage_areas !== undefined) {
      updates.push(`coverage_areas = $${paramIndex}`);
      values.push(JSON.stringify(coverage_areas));
      paramIndex++;
    }
    if (contact_info !== undefined) {
      updates.push(`contact_info = $${paramIndex}`);
      values.push(JSON.stringify(contact_info));
      paramIndex++;
    }
    if (social_links !== undefined) {
      updates.push(`social_links = $${paramIndex}`);
      values.push(JSON.stringify(social_links));
      paramIndex++;
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Update business details if provided
    if (details) {
      await query(
        `INSERT INTO business_details (business_id, details, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (business_id) DO UPDATE SET details = $2, updated_at = NOW()`,
        [id, JSON.stringify(details)]
      );
    }

    return NextResponse.json({ business: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to update business:', error);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}

// DELETE - deactivate business
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const result = await query(
      'UPDATE businesses SET is_active = false, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete business:', error);
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
  }
}
