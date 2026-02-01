import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

// POST restore a deleted activity from a system message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  try {
    const { id: tripId, discussionId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the discussion message with activity data
    const discussionResult = await query(
      `SELECT * FROM discussions
       WHERE id = $1 AND trip_id = $2 AND message_type = 'deleted_activity'`,
      [discussionId, tripId]
    );

    if (discussionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Deleted activity message not found' },
        { status: 404 }
      );
    }

    const discussion = discussionResult.rows[0];
    const metadata = discussion.metadata;

    // Check if already restored
    if (metadata?.restored_at) {
      return NextResponse.json(
        { error: 'Activity has already been restored' },
        { status: 400 }
      );
    }

    const activity = metadata?.activity;
    if (!activity) {
      return NextResponse.json(
        { error: 'Activity data not found in message' },
        { status: 400 }
      );
    }

    // Get the max order_index for the day to place activity at end
    const orderResult = await query(
      `SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
       FROM itinerary_items
       WHERE trip_id = $1 AND day_number = $2`,
      [tripId, activity.day_number]
    );
    const nextOrder = orderResult.rows[0]?.next_order || 0;

    // Get user name for the restored message
    const userResult = await query(
      'SELECT full_name, email FROM users WHERE id = $1',
      [user.id]
    );
    const userName = userResult.rows[0]?.full_name || userResult.rows[0]?.email || 'Someone';

    // Re-insert the activity (with new id and order)
    const insertResult = await query(
      `INSERT INTO itinerary_items (
        trip_id, day_number, order_index, time_slot, title, description,
        location_name, location_address, location, location_lat, location_lng,
        google_place_id, category, item_type, estimated_cost,
        estimated_duration_minutes, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        tripId,
        activity.day_number,
        nextOrder,
        activity.time_slot,
        activity.title,
        activity.description,
        activity.location_name,
        activity.location_address,
        activity.location,
        activity.location_lat,
        activity.location_lng,
        activity.google_place_id,
        activity.category,
        activity.item_type || 'activity',
        activity.estimated_cost,
        activity.estimated_duration_minutes,
        activity.notes,
      ]
    );

    // Update the discussion message to mark as restored
    const updatedMetadata = {
      ...metadata,
      restored_at: new Date().toISOString(),
      restored_by: user.id,
      restored_by_name: userName,
      restored_item_id: insertResult.rows[0].id,
    };

    await query(
      `UPDATE discussions
       SET metadata = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(updatedMetadata), discussionId]
    );

    return NextResponse.json({
      success: true,
      activity: insertResult.rows[0],
      message: `Activity restored to Day ${activity.day_number}`,
    });

  } catch (error: any) {
    console.error('Failed to restore activity:', error);
    return NextResponse.json(
      { error: 'Failed to restore activity', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
