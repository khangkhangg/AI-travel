import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - Get single booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT tb.*, u.full_name as guide_name, u.avatar_url as guide_avatar
       FROM tour_bookings tb
       JOIN users u ON tb.guide_id = u.id
       WHERE tb.id = $1 AND tb.guide_id = $2`,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ booking: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to fetch booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PATCH - Update booking status (confirm/reject/cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, confirmed, rejected, cancelled' },
        { status: 400 }
      );
    }

    // Update booking (only if user is the guide)
    const result = await query(
      `UPDATE tour_bookings
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND guide_id = $3
       RETURNING *`,
      [status, id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to update booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE - Delete booking (only guide can delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `DELETE FROM tour_bookings WHERE id = $1 AND guide_id = $2 RETURNING id`,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
