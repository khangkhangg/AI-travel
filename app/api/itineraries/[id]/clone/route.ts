import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Clone an itinerary
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the original itinerary
    const originalResult = await query(
      `SELECT * FROM itineraries WHERE id = $1`,
      [id]
    );

    if (originalResult.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const original = originalResult.rows[0];

    // Check if itinerary is public/marketplace (clonable)
    if (original.visibility === 'private' && original.user_id !== user.id) {
      // Check if user is a collaborator
      const collabResult = await query(
        `SELECT role FROM itinerary_collaborators WHERE itinerary_id = $1 AND user_id = $2`,
        [id, user.id]
      );
      if (collabResult.rows.length === 0) {
        return NextResponse.json({ error: 'Cannot clone private itinerary' }, { status: 403 });
      }
    }

    // Get optional title override from request body
    let newTitle = `${original.title} (Copy)`;
    try {
      const body = await request.json();
      if (body.title) {
        newTitle = body.title;
      }
    } catch {
      // Body might be empty, that's fine
    }

    // Create the clone (clone_count increment is handled by database trigger)
    const cloneResult = await query(
      `INSERT INTO itineraries (
        user_id, title, description, destination_city, destination_country,
        start_date, end_date, visibility, open_to_offers, group_size, interests, cloned_from_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'private', FALSE, $8, $9, $10)
      RETURNING *`,
      [
        user.id,
        newTitle,
        original.description,
        original.destination_city,
        original.destination_country,
        original.start_date,
        original.end_date,
        original.group_size,
        original.interests,
        id, // cloned_from_id
      ]
    );

    const row = cloneResult.rows[0];

    // Check if this is user's first itinerary and award badge
    const countResult = await query(
      `SELECT COUNT(*) FROM itineraries WHERE user_id = $1`,
      [user.id]
    );

    if (parseInt(countResult.rows[0].count) === 1) {
      await query(
        `INSERT INTO user_badges (user_id, badge_type)
         VALUES ($1, 'first_itinerary')
         ON CONFLICT DO NOTHING`,
        [user.id]
      );
    }

    return NextResponse.json({
      itinerary: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        destinationCity: row.destination_city,
        destinationCountry: row.destination_country,
        startDate: row.start_date,
        endDate: row.end_date,
        visibility: row.visibility,
        openToOffers: row.open_to_offers,
        groupSize: row.group_size,
        interests: row.interests || [],
        cloneCount: row.clone_count,
        viewCount: row.view_count,
        clonedFromId: row.cloned_from_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      message: 'Itinerary cloned successfully',
    });
  } catch (error: any) {
    console.error('Failed to clone itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to clone itinerary' },
      { status: 500 }
    );
  }
}
