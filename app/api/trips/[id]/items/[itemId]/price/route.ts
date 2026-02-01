import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: tripId, itemId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { price } = await request.json();

    // Check if item exists and belongs to trip
    const itemCheck = await query(
      'SELECT id, is_final FROM itinerary_items WHERE id = $1 AND trip_id = $2',
      [itemId, tripId]
    );

    if (itemCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Don't allow updating finalized items
    if (itemCheck.rows[0].is_final) {
      return NextResponse.json(
        { error: 'Cannot update finalized items' },
        { status: 400 }
      );
    }

    // Update price
    await query(
      `UPDATE itinerary_items
       SET estimated_cost = $1, updated_at = NOW()
       WHERE id = $2`,
      [price, itemId]
    );

    return NextResponse.json({ success: true, price });
  } catch (error) {
    console.error('Failed to update price:', error);
    return NextResponse.json(
      { error: 'Failed to update price' },
      { status: 500 }
    );
  }
}
