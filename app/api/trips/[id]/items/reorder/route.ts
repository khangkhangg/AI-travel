import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, newDayNumber, newOrderIndex } = await request.json();

    if (!itemId || newDayNumber === undefined || newOrderIndex === undefined) {
      return NextResponse.json(
        { error: 'Item ID, day number, and order index are required' },
        { status: 400 }
      );
    }

    // Get current item details
    const currentItem = await query(
      'SELECT day_number, order_index FROM itinerary_items WHERE id = $1 AND trip_id = $2',
      [itemId, tripId]
    );

    if (currentItem.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const { day_number: oldDayNumber, order_index: oldOrderIndex } = currentItem.rows[0];

    // Start transaction-like operations
    if (oldDayNumber === newDayNumber) {
      // Moving within same day
      if (oldOrderIndex < newOrderIndex) {
        // Moving down: shift items between old and new position up
        await query(
          `UPDATE itinerary_items
           SET order_index = order_index - 1
           WHERE trip_id = $1 AND day_number = $2
           AND order_index > $3 AND order_index <= $4`,
          [tripId, newDayNumber, oldOrderIndex, newOrderIndex]
        );
      } else if (oldOrderIndex > newOrderIndex) {
        // Moving up: shift items between new and old position down
        await query(
          `UPDATE itinerary_items
           SET order_index = order_index + 1
           WHERE trip_id = $1 AND day_number = $2
           AND order_index >= $3 AND order_index < $4`,
          [tripId, newDayNumber, newOrderIndex, oldOrderIndex]
        );
      }
    } else {
      // Moving to different day
      // Remove from old day: shift all items after down
      await query(
        `UPDATE itinerary_items
         SET order_index = order_index - 1
         WHERE trip_id = $1 AND day_number = $2 AND order_index > $3`,
        [tripId, oldDayNumber, oldOrderIndex]
      );

      // Insert into new day: shift all items at and after new position up
      await query(
        `UPDATE itinerary_items
         SET order_index = order_index + 1
         WHERE trip_id = $1 AND day_number = $2 AND order_index >= $3`,
        [tripId, newDayNumber, newOrderIndex]
      );
    }

    // Update the moved item
    await query(
      `UPDATE itinerary_items
       SET day_number = $1, order_index = $2, updated_at = NOW()
       WHERE id = $3`,
      [newDayNumber, newOrderIndex, itemId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder item:', error);
    return NextResponse.json(
      { error: 'Failed to reorder item' },
      { status: 500 }
    );
  }
}
