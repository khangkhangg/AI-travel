import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { nanoid } from 'nanoid';

// Generate a unique share code
function generateShareCode(): string {
  return nanoid(10);
}

// GET - list user's trips
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT t.*,
        COALESCE(t.clone_count, 0) as clone_count,
        (SELECT COUNT(*) FROM trip_likes WHERE trip_id = t.id) as likes_count,
        (SELECT COUNT(*) FROM itinerary_items WHERE trip_id = t.id) as items_count
       FROM trips t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ trips: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

// POST - create new trip
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { destination, duration, itinerary, travelers, visibility = 'private', curatorInfo, chatHistory } = body;

    // Generate unique share code
    const shareCode = generateShareCode();
    const title = destination ? `Trip to ${destination}` : 'My Trip';

    // Create trip - use city column for destination since schema uses that
    // Include curator info fields if visibility is 'curated'
    const tripResult = await query(
      `INSERT INTO trips (
        user_id, title, city, description,
        visibility, share_code, generated_content, chat_history,
        curator_is_local, curator_years_lived, curator_experience,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        user.id,
        title,
        destination || '',
        duration || '',
        visibility,
        shareCode,
        JSON.stringify({ travelers, itinerary }),
        JSON.stringify(chatHistory || []),
        visibility === 'curated' ? curatorInfo?.isLocal : null,
        visibility === 'curated' ? curatorInfo?.yearsLived : null,
        visibility === 'curated' ? curatorInfo?.experience : null,
      ]
    );

    const trip = tripResult.rows[0];

    // Insert itinerary items
    if (itinerary && itinerary.length > 0) {
      for (const day of itinerary) {
        for (let i = 0; i < day.activities.length; i++) {
          const activity = day.activities[i];
          await query(
            `INSERT INTO itinerary_items (
              trip_id, day_number, order_index, title,
              description, category, time_slot, estimated_cost,
              location_name, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
            [
              trip.id,
              day.day,
              i,
              activity.title,
              activity.description || '',
              activity.type || 'activity',
              activity.time || '',
              activity.cost || 0,
              activity.location || '',
            ]
          );
        }
      }
    }

    // Insert travelers if provided
    if (travelers && travelers.length > 0) {
      for (const traveler of travelers) {
        await query(
          `INSERT INTO trip_travelers (
            trip_id, name, age, is_child, created_at
          ) VALUES ($1, $2, $3, $4, NOW())`,
          [trip.id, traveler.name, traveler.age, traveler.isChild || traveler.age < 12]
        );
      }
    }

    // Add user as owner in collaborators
    await query(
      `INSERT INTO trip_collaborators (trip_id, user_id, role, created_at)
       VALUES ($1, $2, 'owner', NOW())
       ON CONFLICT (trip_id, user_id) DO NOTHING`,
      [trip.id, user.id]
    );

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2000';
    const shareUrl = `${baseUrl}/shared/${shareCode}`;

    return NextResponse.json({
      trip,
      shareUrl,
      shareCode,
    });
  } catch (error: any) {
    console.error('Failed to create trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}
