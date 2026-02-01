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

    const { startDate } = await request.json();

    // Update trip start date
    await query(
      `UPDATE trips
       SET start_date = $1, updated_at = NOW()
       WHERE id = $2`,
      [startDate || null, tripId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update dates:', error);
    return NextResponse.json(
      { error: 'Failed to update dates' },
      { status: 500 }
    );
  }
}
