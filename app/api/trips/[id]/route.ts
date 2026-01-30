import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();

    // Get trip details
    const tripResult = await query(
      `SELECT
        t.*,
        u.email as owner_email,
        u.full_name as owner_name,
        u.avatar_url as owner_avatar,
        m.display_name as ai_model_name,
        (SELECT COUNT(*) FROM trip_likes WHERE trip_id = t.id) as likes_count,
        ${user ? `(SELECT COUNT(*) > 0 FROM trip_likes WHERE trip_id = t.id AND user_id = '${user.id}') as is_liked,` : 'false as is_liked,'}
        ${user ? `(SELECT role FROM trip_collaborators WHERE trip_id = t.id AND user_id = '${user.id}') as user_role` : 'null as user_role'}
       FROM trips t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN ai_models m ON t.ai_model_id = m.id
       WHERE t.id = $1`,
      [id]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const trip = tripResult.rows[0];

    // Check access permissions
    const isOwner = user && trip.user_id === user.id;
    const isCollaborator = trip.user_role !== null;
    const isPublic = trip.visibility === 'public';

    if (!isPublic && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Increment view count
    await query(
      'UPDATE trips SET views_count = views_count + 1 WHERE id = $1',
      [id]
    );

    // Get itinerary items
    const itemsResult = await query(
      `SELECT * FROM itinerary_items
       WHERE trip_id = $1
       ORDER BY day_number, order_index`,
      [id]
    );

    // Get collaborators
    const collaboratorsResult = await query(
      `SELECT tc.*, u.email, u.full_name, u.avatar_url
       FROM trip_collaborators tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.trip_id = $1`,
      [id]
    );

    return NextResponse.json({
      trip: {
        ...trip,
        itinerary_items: itemsResult.rows,
        collaborators: collaboratorsResult.rows
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}

// PATCH update trip
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
    const { title, visibility } = body;

    // Check if user has edit permissions
    const permissionCheck = await query(
      `SELECT tc.role FROM trip_collaborators tc
       WHERE tc.trip_id = $1 AND tc.user_id = $2 AND tc.role IN ('owner', 'editor')`,
      [id, user.id]
    );

    if (permissionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }

    if (visibility !== undefined) {
      updates.push(`visibility = $${paramIndex++}`);
      values.push(visibility);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE trips SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return NextResponse.json({ trip: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to update trip:', error);
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    );
  }
}

// DELETE trip
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

    // Only owner can delete
    const result = await query(
      `DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
