import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: tripId, itemId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if item exists and belongs to trip
    const itemCheck = await query(
      'SELECT id, is_final FROM itinerary_items WHERE id = $1 AND trip_id = $2',
      [itemId, tripId]
    );

    if (itemCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Toggle finalize status
    const newStatus = !itemCheck.rows[0].is_final;

    await query(
      `UPDATE itinerary_items
       SET is_final = $1, updated_at = NOW()
       WHERE id = $2`,
      [newStatus, itemId]
    );

    return NextResponse.json({
      success: true,
      is_final: newStatus,
    });
  } catch (error) {
    console.error('Failed to finalize:', error);
    return NextResponse.json(
      { error: 'Failed to finalize' },
      { status: 500 }
    );
  }
}
