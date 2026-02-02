import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - get service needs for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT tsn.*, ii.title as activity_title, ii.day_number
       FROM trip_service_needs tsn
       LEFT JOIN itinerary_items ii ON ii.id = tsn.activity_id
       WHERE tsn.trip_id = $1
       ORDER BY tsn.created_at DESC`,
      [id]
    );

    return NextResponse.json({ service_needs: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch service needs:', error);
    return NextResponse.json({ error: 'Failed to fetch service needs' }, { status: 500 });
  }
}

// POST - add service need
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

    const body = await request.json();
    const { activity_id, service_type, notes, budget_min, budget_max } = body;

    if (!service_type) {
      return NextResponse.json({ error: 'Service type is required' }, { status: 400 });
    }

    // Check if this service need already exists
    const existing = await query(
      `SELECT id FROM trip_service_needs
       WHERE trip_id = $1 AND service_type = $2 AND (activity_id = $3 OR (activity_id IS NULL AND $3 IS NULL))`,
      [id, service_type, activity_id || null]
    );

    if (existing.rows.length > 0) {
      // Update existing
      const result = await query(
        `UPDATE trip_service_needs SET notes = $1, budget_min = $2, budget_max = $3
         WHERE id = $4 RETURNING *`,
        [notes || null, budget_min || null, budget_max || null, existing.rows[0].id]
      );
      return NextResponse.json({ service_need: result.rows[0] });
    }

    // Create new
    const result = await query(
      `INSERT INTO trip_service_needs (
        trip_id, activity_id, service_type, notes, budget_min, budget_max, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [id, activity_id || null, service_type, notes || null, budget_min || null, budget_max || null]
    );

    // Update trip's marketplace_needs array
    await query(
      `UPDATE trips SET marketplace_needs = (
        SELECT jsonb_agg(DISTINCT service_type) FROM trip_service_needs WHERE trip_id = $1
      ) WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ service_need: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to add service need:', error);
    return NextResponse.json({ error: 'Failed to add service need' }, { status: 500 });
  }
}

// DELETE - remove service need
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const needId = searchParams.get('needId');

    if (!needId) {
      return NextResponse.json({ error: 'Need ID is required' }, { status: 400 });
    }

    // Verify ownership through trip
    const result = await query(
      `DELETE FROM trip_service_needs
       WHERE id = $1 AND trip_id IN (SELECT id FROM trips WHERE user_id = $2)
       RETURNING trip_id`,
      [needId, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Service need not found or not authorized' }, { status: 404 });
    }

    // Update trip's marketplace_needs array
    await query(
      `UPDATE trips SET marketplace_needs = (
        SELECT COALESCE(jsonb_agg(DISTINCT service_type), '[]'::jsonb) FROM trip_service_needs WHERE trip_id = $1
      ) WHERE id = $1`,
      [result.rows[0].trip_id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete service need:', error);
    return NextResponse.json({ error: 'Failed to delete service need' }, { status: 500 });
  }
}
