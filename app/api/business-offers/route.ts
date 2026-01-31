import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - List offers (for traveler or business)
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 'traveler' or 'business'
    const status = searchParams.get('status');
    const itineraryId = searchParams.get('itineraryId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT
        bo.*,
        i.title as itinerary_title,
        i.destination_city,
        i.destination_country,
        i.start_date,
        i.end_date,
        t.full_name as traveler_name,
        t.avatar_url as traveler_avatar,
        t.email as traveler_email,
        CASE
          WHEN bo.business_type = 'hotel' THEN h.name
          WHEN bo.business_type = 'guide' THEN tg.name
        END as business_name,
        CASE
          WHEN bo.business_type = 'hotel' THEN h.city
          WHEN bo.business_type = 'guide' THEN tg.city
        END as business_city
      FROM business_offers bo
      JOIN itineraries i ON bo.itinerary_id = i.id
      JOIN users t ON bo.traveler_id = t.id
      LEFT JOIN hotels h ON bo.business_type = 'hotel' AND bo.business_id = h.id
      LEFT JOIN tour_guides tg ON bo.business_type = 'guide' AND bo.business_id = tg.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Filter based on role
    if (role === 'traveler') {
      sql += ` AND bo.traveler_id = $${paramIndex++}`;
      params.push(user.id);
    } else if (role === 'business') {
      // Find businesses owned by user
      sql += ` AND (
        (bo.business_type = 'hotel' AND bo.business_id IN (SELECT id FROM hotels WHERE user_id = $${paramIndex}))
        OR
        (bo.business_type = 'guide' AND bo.business_id IN (SELECT id FROM tour_guides WHERE user_id = $${paramIndex}))
      )`;
      params.push(user.id);
      paramIndex++;
    } else {
      // Default: show both traveler and business offers for this user
      sql += ` AND (
        bo.traveler_id = $${paramIndex}
        OR (bo.business_type = 'hotel' AND bo.business_id IN (SELECT id FROM hotels WHERE user_id = $${paramIndex}))
        OR (bo.business_type = 'guide' AND bo.business_id IN (SELECT id FROM tour_guides WHERE user_id = $${paramIndex}))
      )`;
      params.push(user.id);
      paramIndex++;
    }

    if (status) {
      sql += ` AND bo.status = $${paramIndex++}`;
      params.push(status);
    }

    if (itineraryId) {
      sql += ` AND bo.itinerary_id = $${paramIndex++}`;
      params.push(itineraryId);
    }

    sql += ` ORDER BY bo.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    const offers = result.rows.map(row => ({
      id: row.id,
      businessType: row.business_type,
      businessId: row.business_id,
      businessName: row.business_name,
      businessCity: row.business_city,
      itineraryId: row.itinerary_id,
      travelerId: row.traveler_id,
      offerDetails: row.offer_details,
      status: row.status,
      message: row.message,
      responseMessage: row.response_message,
      createdAt: row.created_at,
      respondedAt: row.responded_at,
      itinerary: {
        title: row.itinerary_title,
        destinationCity: row.destination_city,
        destinationCountry: row.destination_country,
        startDate: row.start_date,
        endDate: row.end_date,
      },
      traveler: {
        fullName: row.traveler_name,
        avatarUrl: row.traveler_avatar,
        email: row.traveler_email,
      },
    }));

    return NextResponse.json({ offers });
  } catch (error: any) {
    console.error('Failed to fetch offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

// POST - Send an offer to a traveler
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessType, businessId, itineraryId, offerDetails, message } = body;

    if (!businessType || !businessId || !itineraryId || !offerDetails) {
      return NextResponse.json(
        { error: 'businessType, businessId, itineraryId, and offerDetails are required' },
        { status: 400 }
      );
    }

    if (!['guide', 'hotel'].includes(businessType)) {
      return NextResponse.json({ error: 'Invalid businessType' }, { status: 400 });
    }

    // Verify business ownership
    if (businessType === 'hotel') {
      const hotelCheck = await query(
        `SELECT user_id FROM hotels WHERE id = $1`,
        [businessId]
      );
      if (hotelCheck.rows.length === 0 || hotelCheck.rows[0].user_id !== user.id) {
        return NextResponse.json({ error: 'Hotel not found or access denied' }, { status: 403 });
      }
    } else {
      const guideCheck = await query(
        `SELECT user_id FROM tour_guides WHERE id = $1`,
        [businessId]
      );
      if (guideCheck.rows.length === 0 || guideCheck.rows[0].user_id !== user.id) {
        return NextResponse.json({ error: 'Tour guide profile not found or access denied' }, { status: 403 });
      }
    }

    // Verify itinerary is marketplace and open to offers
    const itineraryCheck = await query(
      `SELECT user_id, visibility, open_to_offers FROM itineraries WHERE id = $1`,
      [itineraryId]
    );

    if (itineraryCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const itinerary = itineraryCheck.rows[0];
    if (itinerary.visibility !== 'marketplace' || !itinerary.open_to_offers) {
      return NextResponse.json(
        { error: 'This itinerary is not open to offers' },
        { status: 400 }
      );
    }

    // Check if already sent an offer for this itinerary
    const existingCheck = await query(
      `SELECT id FROM business_offers
       WHERE business_type = $1 AND business_id = $2 AND itinerary_id = $3 AND status = 'pending'`,
      [businessType, businessId, itineraryId]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending offer for this itinerary' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO business_offers (business_type, business_id, itinerary_id, traveler_id, offer_details, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [businessType, businessId, itineraryId, itinerary.user_id, offerDetails, message || null]
    );

    const row = result.rows[0];

    return NextResponse.json({
      offer: {
        id: row.id,
        businessType: row.business_type,
        businessId: row.business_id,
        itineraryId: row.itinerary_id,
        travelerId: row.traveler_id,
        offerDetails: row.offer_details,
        status: row.status,
        message: row.message,
        createdAt: row.created_at,
      },
      message: 'Offer sent successfully',
    });
  } catch (error: any) {
    console.error('Failed to send offer:', error);
    return NextResponse.json(
      { error: 'Failed to send offer' },
      { status: 500 }
    );
  }
}

// PUT - Respond to an offer (traveler only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { offerId, status, responseMessage } = body;

    if (!offerId || !status) {
      return NextResponse.json(
        { error: 'offerId and status are required' },
        { status: 400 }
      );
    }

    if (!['accepted', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify traveler ownership
    const offerCheck = await query(
      `SELECT traveler_id, status FROM business_offers WHERE id = $1`,
      [offerId]
    );

    if (offerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (offerCheck.rows[0].traveler_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (offerCheck.rows[0].status !== 'pending') {
      return NextResponse.json(
        { error: 'This offer has already been responded to' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE business_offers
       SET status = $1, response_message = $2, responded_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, responseMessage || null, offerId]
    );

    const row = result.rows[0];

    return NextResponse.json({
      offer: {
        id: row.id,
        businessType: row.business_type,
        businessId: row.business_id,
        itineraryId: row.itinerary_id,
        travelerId: row.traveler_id,
        offerDetails: row.offer_details,
        status: row.status,
        message: row.message,
        responseMessage: row.response_message,
        createdAt: row.created_at,
        respondedAt: row.responded_at,
      },
      message: `Offer ${status}`,
    });
  } catch (error: any) {
    console.error('Failed to respond to offer:', error);
    return NextResponse.json(
      { error: 'Failed to respond to offer' },
      { status: 500 }
    );
  }
}
