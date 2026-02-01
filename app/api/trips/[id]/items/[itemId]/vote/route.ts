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

    const { vote } = await request.json();

    if (!vote || !['up', 'down'].includes(vote)) {
      return NextResponse.json(
        { error: 'Valid vote (up or down) is required' },
        { status: 400 }
      );
    }

    // Check if item exists and belongs to trip
    const itemCheck = await query(
      'SELECT id, is_final FROM itinerary_items WHERE id = $1 AND trip_id = $2',
      [itemId, tripId]
    );

    if (itemCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (itemCheck.rows[0].is_final) {
      return NextResponse.json(
        { error: 'Cannot vote on finalized activities' },
        { status: 400 }
      );
    }

    // Upsert vote (insert or update)
    await query(
      `INSERT INTO activity_votes (itinerary_item_id, user_id, vote)
       VALUES ($1, $2, $3)
       ON CONFLICT (itinerary_item_id, user_id)
       DO UPDATE SET vote = $3`,
      [itemId, user.id, vote]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to vote:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
}
