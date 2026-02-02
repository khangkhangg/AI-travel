import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { nanoid } from 'nanoid';

function generateShareCode(): string {
  return nanoid(10);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();

    // Check authentication
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', requiresAuth: true },
        { status: 401 }
      );
    }

    // Fetch original trip
    const tripResult = await query(
      `SELECT * FROM trips WHERE id = $1`,
      [id]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const original = tripResult.rows[0];

    // Check if trip is public or curated (allow cloning)
    if (original.visibility !== 'public' && original.visibility !== 'curated') {
      return NextResponse.json(
        { error: 'This trip cannot be cloned' },
        { status: 403 }
      );
    }

    // Parse request body for optional custom title
    let customTitle: string | undefined;
    try {
      const body = await request.json();
      customTitle = body.title;
    } catch {
      // Empty body is acceptable
    }

    // Generate new share code
    const shareCode = generateShareCode();
    const clonedTitle = customTitle || `${original.title} (Copy)`;

    // Create cloned trip
    const clonedTripResult = await query(
      `INSERT INTO trips (
        user_id, title, city, description, visibility,
        share_code, generated_content, chat_history,
        cloned_from_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        user.id,
        clonedTitle,
        original.city || '',
        original.description || '',
        'private', // Cloned trips start as private
        shareCode,
        original.generated_content,
        '[]', // Start with empty chat history
        original.id, // Set cloned_from_id - triggers auto-increment
      ]
    );

    const clonedTrip = clonedTripResult.rows[0];

    // Copy itinerary items
    const itemsResult = await query(
      `SELECT * FROM itinerary_items WHERE trip_id = $1 ORDER BY day_number, order_index`,
      [original.id]
    );

    for (const item of itemsResult.rows) {
      await query(
        `INSERT INTO itinerary_items (
          trip_id, day_number, order_index, title,
          description, category, time_slot, estimated_cost,
          location_name, location_lat, location_lng,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [
          clonedTrip.id,
          item.day_number,
          item.order_index,
          item.title,
          item.description || '',
          item.category || 'activity',
          item.time_slot || '',
          item.estimated_cost || 0,
          item.location_name || '',
          item.location_lat,
          item.location_lng,
        ]
      );
    }

    // Copy travelers
    const travelersResult = await query(
      `SELECT * FROM trip_travelers WHERE trip_id = $1`,
      [original.id]
    );

    for (const traveler of travelersResult.rows) {
      await query(
        `INSERT INTO trip_travelers (
          trip_id, name, age, is_child, created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [clonedTrip.id, traveler.name, traveler.age, traveler.is_child]
      );
    }

    // Add user as owner in collaborators
    await query(
      `INSERT INTO trip_collaborators (trip_id, user_id, role, created_at)
       VALUES ($1, $2, 'owner', NOW())
       ON CONFLICT (trip_id, user_id) DO NOTHING`,
      [clonedTrip.id, user.id]
    );

    return NextResponse.json({
      tripId: clonedTrip.id,
      message: 'Trip cloned successfully',
    });
  } catch (error: any) {
    console.error('Failed to clone trip:', error);
    return NextResponse.json(
      { error: 'Failed to clone trip', details: error.message },
      { status: 500 }
    );
  }
}
