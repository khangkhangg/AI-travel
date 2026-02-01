import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { settlementId } = await request.json();

    if (!settlementId) {
      return NextResponse.json(
        { error: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    // Parse settlement ID (format: fromUserId-toUserId)
    const [fromUserId, toUserId] = settlementId.split('-');

    if (!fromUserId || !toUserId) {
      return NextResponse.json(
        { error: 'Invalid settlement ID format' },
        { status: 400 }
      );
    }

    // Check if settlement exists
    const existing = await query(
      `SELECT id FROM cost_settlements
       WHERE trip_id = $1 AND from_user_id = $2 AND to_user_id = $3`,
      [tripId, fromUserId, toUserId]
    );

    if (existing.rows.length > 0) {
      // Update existing settlement
      await query(
        `UPDATE cost_settlements
         SET is_settled = true, settled_at = NOW()
         WHERE id = $1`,
        [existing.rows[0].id]
      );
    } else {
      // Create new settlement record
      // First, calculate the amount from current costs
      // For simplicity, we'll store it as settled without the amount
      // The amount is calculated dynamically in the costs endpoint
      await query(
        `INSERT INTO cost_settlements (trip_id, from_user_id, to_user_id, amount, is_settled, settled_at)
         VALUES ($1, $2, $3, 0, true, NOW())`,
        [tripId, fromUserId, toUserId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to settle:', error);
    return NextResponse.json(
      { error: 'Failed to settle' },
      { status: 500 }
    );
  }
}
