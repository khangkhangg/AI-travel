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

    const { payerId, isSplit } = await request.json();

    // Check if item exists and belongs to trip
    const itemCheck = await query(
      'SELECT id FROM itinerary_items WHERE id = $1 AND trip_id = $2',
      [itemId, tripId]
    );

    if (itemCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Update payer
    await query(
      `UPDATE itinerary_items
       SET payer_id = $1, is_split = $2, updated_at = NOW()
       WHERE id = $3`,
      [isSplit ? null : payerId, isSplit, itemId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to assign payer:', error);
    return NextResponse.json(
      { error: 'Failed to assign payer' },
      { status: 500 }
    );
  }
}
