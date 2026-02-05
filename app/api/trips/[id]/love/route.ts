import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

// POST /api/trips/[id]/love - Toggle love on a trip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;

    // Get current user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if trip exists
    const tripResult = await query(
      'SELECT id, love_count FROM trips WHERE id = $1',
      [tripId]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Check if user already loved this trip
    const existingLove = await query(
      'SELECT id FROM trip_loves WHERE trip_id = $1 AND user_id = $2',
      [tripId, user.id]
    );

    let isLoved = false;
    let loveCount = tripResult.rows[0].love_count || 0;

    if (existingLove.rows.length > 0) {
      // User already loved - remove love
      await query(
        'DELETE FROM trip_loves WHERE trip_id = $1 AND user_id = $2',
        [tripId, user.id]
      );

      // Decrement love count
      loveCount = Math.max(0, loveCount - 1);
      await query(
        'UPDATE trips SET love_count = $1 WHERE id = $2',
        [loveCount, tripId]
      );

      isLoved = false;
    } else {
      // Add new love
      await query(
        'INSERT INTO trip_loves (trip_id, user_id) VALUES ($1, $2)',
        [tripId, user.id]
      );

      // Increment love count
      loveCount = loveCount + 1;
      await query(
        'UPDATE trips SET love_count = $1 WHERE id = $2',
        [loveCount, tripId]
      );

      isLoved = true;
    }

    return NextResponse.json({
      success: true,
      isLoved,
      loveCount,
    });
  } catch (error) {
    console.error('Error toggling trip love:', error);
    return NextResponse.json(
      { error: 'Failed to toggle love' },
      { status: 500 }
    );
  }
}

// GET /api/trips/[id]/love - Get love status for current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;

    // Get current user (optional for this endpoint)
    const user = await getUser();

    // Get trip love count
    const tripResult = await query(
      'SELECT love_count FROM trips WHERE id = $1',
      [tripId]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const loveCount = tripResult.rows[0].love_count || 0;
    let isLoved = false;

    // Check if current user loved this trip
    if (user) {
      const userLove = await query(
        'SELECT id FROM trip_loves WHERE trip_id = $1 AND user_id = $2',
        [tripId, user.id]
      );
      isLoved = userLove.rows.length > 0;
    }

    return NextResponse.json({
      loveCount,
      isLoved,
    });
  } catch (error) {
    console.error('Error fetching trip love status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch love status' },
      { status: 500 }
    );
  }
}
