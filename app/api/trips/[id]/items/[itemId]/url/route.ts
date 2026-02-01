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

    const { url } = await request.json();

    // Validate URL format if provided
    if (url && url.trim()) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

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

    // Update the URL
    const result = await query(
      'UPDATE itinerary_items SET source_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [url?.trim() || null, itemId]
    );

    return NextResponse.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Failed to update item URL:', error);
    return NextResponse.json(
      { error: 'Failed to update item URL' },
      { status: 500 }
    );
  }
}
