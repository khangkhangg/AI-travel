import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this trip
    const tripCheck = await query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get current max day number
    const maxDayResult = await query(
      `SELECT COALESCE(MAX(day_number), 0) as max_day FROM itinerary_items WHERE trip_id = $1`,
      [tripId]
    );
    const newDayNumber = (maxDayResult.rows[0]?.max_day || 0) + 1;

    // Create a placeholder item for the new day so it appears in the UI
    // Using order_index -1 to put it at the beginning and mark it as a day marker
    await query(
      `INSERT INTO itinerary_items (trip_id, day_number, order_index, title, category)
       VALUES ($1, $2, -1, '', 'day_marker')`,
      [tripId, newDayNumber]
    );

    return NextResponse.json({
      success: true,
      dayNumber: newDayNumber,
    });
  } catch (error) {
    console.error('Failed to add day:', error);
    return NextResponse.json({ error: 'Failed to add day' }, { status: 500 });
  }
}
