import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

// Use a large negative offset to avoid UNIQUE constraint violations
// The constraint is on (trip_id, day_number, order_index), so we need
// a day_number that won't collide with any existing order_index values
const TEMP_DAY_OFFSET = -1000000;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayNumber: string }> }
) {
  const client = await getClient();

  try {
    const { id: tripId, dayNumber } = await params;
    const oldDayNumber = parseInt(dayNumber);
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newDayNumber } = body;

    if (!newDayNumber || newDayNumber < 1) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 });
    }

    // Verify user has access
    const tripCheck = await client.query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get max day number
    const maxResult = await client.query(
      `SELECT COALESCE(MAX(day_number), 0) as max_day FROM itinerary_items WHERE trip_id = $1`,
      [tripId]
    );
    const maxDay = maxResult.rows[0]?.max_day || 1;

    if (newDayNumber > maxDay) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 });
    }

    if (oldDayNumber === newDayNumber) {
      return NextResponse.json({ success: true, message: 'No change needed' });
    }

    // Use a transaction to ensure atomic updates
    await client.query('BEGIN');

    try {
      // Move target day to temporary position (large negative to avoid UNIQUE constraint)
      await client.query(
        `UPDATE itinerary_items SET day_number = $1 WHERE trip_id = $2 AND day_number = $3`,
        [TEMP_DAY_OFFSET, tripId, oldDayNumber]
      );

      // Shift days between old and new positions
      if (newDayNumber < oldDayNumber) {
        // Moving earlier: shift days between newDay and oldDay forward by 1
        await client.query(
          `UPDATE itinerary_items
           SET day_number = day_number + 1
           WHERE trip_id = $1 AND day_number >= $2 AND day_number < $3`,
          [tripId, newDayNumber, oldDayNumber]
        );
      } else {
        // Moving later: shift days between oldDay and newDay backward by 1
        await client.query(
          `UPDATE itinerary_items
           SET day_number = day_number - 1
           WHERE trip_id = $1 AND day_number > $2 AND day_number <= $3`,
          [tripId, oldDayNumber, newDayNumber]
        );
      }

      // Move the target day to its new position
      await client.query(
        `UPDATE itinerary_items SET day_number = $1 WHERE trip_id = $2 AND day_number = $3`,
        [newDayNumber, tripId, TEMP_DAY_OFFSET]
      );

      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Failed to update day number:', error);
    return NextResponse.json({ error: 'Failed to update day' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayNumber: string }> }
) {
  const client = await getClient();

  try {
    const { id: tripId, dayNumber } = await params;
    const dayNum = parseInt(dayNumber);
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access
    const tripCheck = await client.query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check if this would leave 0 days
    const dayCountResult = await client.query(
      `SELECT COUNT(DISTINCT day_number) as count FROM itinerary_items WHERE trip_id = $1`,
      [tripId]
    );
    const dayCount = parseInt(dayCountResult.rows[0]?.count || '1');

    if (dayCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last day' }, { status: 400 });
    }

    // Use transaction for atomic delete + renumber
    await client.query('BEGIN');

    try {
      // Delete all items for this day
      await client.query(
        `DELETE FROM itinerary_items WHERE trip_id = $1 AND day_number = $2`,
        [tripId, dayNum]
      );

      // Renumber remaining days (shift days after deleted one down by 1)
      await client.query(
        `UPDATE itinerary_items
         SET day_number = day_number - 1
         WHERE trip_id = $1 AND day_number > $2`,
        [tripId, dayNum]
      );

      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete day:', error);
    return NextResponse.json({ error: 'Failed to delete day' }, { status: 500 });
  } finally {
    client.release();
  }
}
