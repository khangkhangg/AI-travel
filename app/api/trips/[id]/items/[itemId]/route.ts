import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: tripId, itemId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get full item data before deletion (for system message)
    const itemResult = await query(
      `SELECT * FROM itinerary_items WHERE id = $1 AND trip_id = $2`,
      [itemId, tripId]
    );

    if (itemResult.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found', itemId }, { status: 404 });
    }

    const activity = itemResult.rows[0];

    // Don't allow deleting finalized items
    if (activity.is_final) {
      return NextResponse.json(
        { error: 'Cannot delete finalized items' },
        { status: 400 }
      );
    }

    // Get user name for the system message
    const userResult = await query(
      'SELECT full_name, email FROM users WHERE id = $1',
      [user.id]
    );
    const userName = userResult.rows[0]?.full_name || userResult.rows[0]?.email || 'Someone';

    // Create system message in discussions before deleting
    const messageContent = `removed "${activity.title}" from Day ${activity.day_number}`;
    const metadata = {
      activity: activity,
      deleted_by_name: userName,
      restored_at: null,
    };

    await query(
      `INSERT INTO discussions (trip_id, user_id, content, message_type, metadata)
       VALUES ($1, $2, $3, 'deleted_activity', $4)`,
      [tripId, user.id, messageContent, JSON.stringify(metadata)]
    );

    // Try to delete votes (table may not exist)
    try {
      await query('DELETE FROM item_votes WHERE itinerary_item_id = $1', [itemId]);
    } catch (e) {
      // Table might not exist, continue
      console.log('item_votes delete skipped:', e);
    }

    // Try to delete discussions linked to this item (not system messages)
    try {
      await query(
        `DELETE FROM discussions WHERE itinerary_item_id = $1 AND message_type = 'message'`,
        [itemId]
      );
    } catch (e) {
      // Table might not have this column, continue
      console.log('discussions delete skipped:', e);
    }

    // Delete the item
    await query('DELETE FROM itinerary_items WHERE id = $1', [itemId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
