import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - get proposals for a trip (trip owner) or proposals by business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forBusiness = searchParams.get('forBusiness') === 'true';

    if (forBusiness) {
      // Get proposals submitted by the current user's business
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const result = await query(
        `SELECT mp.*, t.title as trip_title, t.city as trip_city
         FROM marketplace_proposals mp
         JOIN trips t ON t.id = mp.trip_id
         JOIN businesses b ON b.id = mp.business_id
         WHERE mp.trip_id = $1 AND b.user_id = $2
         ORDER BY mp.created_at DESC`,
        [id, user.id]
      );

      return NextResponse.json({ proposals: result.rows });
    }

    // Get all proposals for trip (trip owner only)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify trip ownership
    const tripCheck = await query(
      'SELECT user_id FROM trips WHERE id = $1',
      [id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (tripCheck.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await query(
      `SELECT mp.*,
        b.business_name, b.business_type, b.logo_url, b.rating, b.review_count,
        u.full_name as owner_name, u.avatar_url as owner_avatar
       FROM marketplace_proposals mp
       JOIN businesses b ON b.id = mp.business_id
       JOIN users u ON u.id = b.user_id
       WHERE mp.trip_id = $1
       ORDER BY mp.created_at DESC`,
      [id]
    );

    return NextResponse.json({ proposals: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

// POST - submit a proposal (business only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get user's business
    const businessResult = await query(
      'SELECT id FROM businesses WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'You need to register as a business to submit proposals' },
        { status: 400 }
      );
    }

    const businessId = businessResult.rows[0].id;

    // Check if trip exists and is marketplace
    const tripCheck = await query(
      "SELECT id, user_id FROM trips WHERE id = $1 AND visibility = 'marketplace'",
      [id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or not in marketplace' }, { status: 404 });
    }

    // Can't bid on own trip
    if (tripCheck.rows[0].user_id === user.id) {
      return NextResponse.json({ error: 'Cannot submit proposal for your own trip' }, { status: 400 });
    }

    // Check if already submitted a proposal
    const existingProposal = await query(
      "SELECT id FROM marketplace_proposals WHERE trip_id = $1 AND business_id = $2 AND status NOT IN ('declined', 'expired')",
      [id, businessId]
    );

    if (existingProposal.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already have an active proposal for this trip' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      service_needs_ids,
      services_offered,
      pricing_breakdown,
      total_price,
      currency,
      message,
      terms,
      attachments,
      expires_at
    } = body;

    if (!services_offered || !pricing_breakdown || !total_price) {
      return NextResponse.json(
        { error: 'Services offered, pricing breakdown, and total price are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO marketplace_proposals (
        trip_id, business_id, service_needs_ids, services_offered, pricing_breakdown,
        total_price, currency, message, terms, attachments, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        id,
        businessId,
        service_needs_ids || [],
        JSON.stringify(services_offered),
        JSON.stringify(pricing_breakdown),
        total_price,
        currency || 'USD',
        message || '',
        terms ? JSON.stringify(terms) : null,
        JSON.stringify(attachments || []),
        expires_at || null
      ]
    );

    // Update service needs status to has_offers
    if (service_needs_ids && service_needs_ids.length > 0) {
      await query(
        "UPDATE trip_service_needs SET status = 'has_offers' WHERE id = ANY($1)",
        [service_needs_ids]
      );
    }

    return NextResponse.json({ proposal: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to submit proposal:', error);
    return NextResponse.json({ error: 'Failed to submit proposal' }, { status: 500 });
  }
}
