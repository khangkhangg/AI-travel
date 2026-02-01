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

    const { arrivalTime, departureTime } = await request.json();

    // Update trip times
    await query(
      `UPDATE trips
       SET arrival_time = $1, departure_time = $2, updated_at = NOW()
       WHERE id = $3`,
      [arrivalTime || null, departureTime || null, tripId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update times:', error);
    return NextResponse.json(
      { error: 'Failed to update times' },
      { status: 500 }
    );
  }
}
