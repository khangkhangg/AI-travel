import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { z } from 'zod';

const DiscussionSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
  itineraryItemId: z.string().uuid().optional(),
});

// GET discussions for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(
      `SELECT
        d.*,
        u.email as user_email,
        u.full_name as user_name,
        u.avatar_url as user_avatar,
        (SELECT COUNT(*) FROM discussions WHERE parent_id = d.id) as reply_count
       FROM discussions d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.trip_id = $1
       ORDER BY d.created_at ASC`,
      [params.id]
    );

    // Build threaded structure
    const discussions = result.rows;
    const threaded = discussions
      .filter(d => !d.parent_id)
      .map(parent => ({
        ...parent,
        replies: discussions.filter(d => d.parent_id === parent.id)
      }));

    return NextResponse.json({ discussions: threaded });
  } catch (error: any) {
    console.error('Failed to fetch discussions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}

// POST new discussion/comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = DiscussionSchema.parse(body);

    // Verify user has access to trip
    const tripCheck = await query(
      `SELECT t.id FROM trips t
       LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id
       WHERE t.id = $1 AND (t.user_id = $2 OR tc.user_id = $2 OR t.visibility = 'public')`,
      [params.id, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 403 });
    }

    const result = await query(
      `INSERT INTO discussions (trip_id, user_id, content, parent_id, itinerary_item_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        params.id,
        user.id,
        input.content,
        input.parentId || null,
        input.itineraryItemId || null
      ]
    );

    return NextResponse.json({ discussion: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create discussion:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
}

// DELETE discussion
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const discussionId = searchParams.get('discussionId');

    if (!discussionId) {
      return NextResponse.json({ error: 'Discussion ID required' }, { status: 400 });
    }

    // Verify ownership
    const result = await query(
      `DELETE FROM discussions
       WHERE id = $1 AND user_id = $2 AND trip_id = $3
       RETURNING id`,
      [discussionId, user.id, params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Discussion not found or access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete discussion:', error);
    return NextResponse.json(
      { error: 'Failed to delete discussion' },
      { status: 500 }
    );
  }
}
