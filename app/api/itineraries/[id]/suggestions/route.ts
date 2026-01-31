import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { SuggestionType, SuggestionStatus } from '@/lib/types/user';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - List suggestions for an itinerary
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as SuggestionStatus | null;
    const dayNumber = searchParams.get('dayNumber');

    // Check access to itinerary
    const itineraryResult = await query(
      `SELECT user_id, visibility FROM itineraries WHERE id = $1`,
      [id]
    );

    if (itineraryResult.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const itinerary = itineraryResult.rows[0];
    const isOwner = user?.id === itinerary.user_id;

    // Check collaborator status for private itineraries
    if (itinerary.visibility === 'private' && !isOwner) {
      if (!user) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      const collabCheck = await query(
        `SELECT id FROM itinerary_collaborators WHERE itinerary_id = $1 AND user_id = $2`,
        [id, user.id]
      );
      if (collabCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Build query
    let sql = `
      SELECT
        s.*,
        u.full_name,
        u.avatar_url
      FROM itinerary_suggestions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.itinerary_id = $1
    `;
    const sqlParams: any[] = [id];
    let paramIndex = 2;

    if (status) {
      sql += ` AND s.status = $${paramIndex++}`;
      sqlParams.push(status);
    }
    if (dayNumber) {
      sql += ` AND s.day_number = $${paramIndex++}`;
      sqlParams.push(parseInt(dayNumber));
    }

    sql += ` ORDER BY s.created_at DESC`;

    const result = await query(sql, sqlParams);

    // Get vote counts for each suggestion
    const suggestionIds = result.rows.map((r) => r.id);
    let voteCounts: Record<string, { up: number; down: number }> = {};

    if (suggestionIds.length > 0) {
      const voteResult = await query(
        `SELECT target_id, vote, COUNT(*) as count
         FROM itinerary_votes
         WHERE itinerary_id = $1 AND target_type = 'suggestion' AND target_id = ANY($2::uuid[])
         GROUP BY target_id, vote`,
        [id, suggestionIds]
      );

      voteResult.rows.forEach((row) => {
        if (!voteCounts[row.target_id]) {
          voteCounts[row.target_id] = { up: 0, down: 0 };
        }
        voteCounts[row.target_id][row.vote as 'up' | 'down'] = parseInt(row.count);
      });
    }

    const suggestions = result.rows.map((row) => ({
      id: row.id,
      itineraryId: row.itinerary_id,
      userId: row.user_id,
      dayNumber: row.day_number,
      activityIndex: row.activity_index,
      suggestionType: row.suggestion_type,
      content: row.content,
      status: row.status,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
      },
      voteCount: voteCounts[row.id] || { up: 0, down: 0 },
    }));

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

// POST - Create a suggestion
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check access to itinerary
    const itineraryResult = await query(
      `SELECT user_id, visibility FROM itineraries WHERE id = $1`,
      [id]
    );

    if (itineraryResult.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const itinerary = itineraryResult.rows[0];
    const isOwner = user.id === itinerary.user_id;

    // For private itineraries, only owner and collaborators can suggest
    if (itinerary.visibility === 'private' && !isOwner) {
      const collabCheck = await query(
        `SELECT role FROM itinerary_collaborators WHERE itinerary_id = $1 AND user_id = $2`,
        [id, user.id]
      );
      if (collabCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      // Only collaborators (not viewers) can suggest
      if (collabCheck.rows[0].role !== 'collaborator') {
        return NextResponse.json(
          { error: 'Viewers cannot make suggestions' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { dayNumber, activityIndex, suggestionType, content } = body;

    if (!suggestionType || !content) {
      return NextResponse.json(
        { error: 'suggestionType and content are required' },
        { status: 400 }
      );
    }

    if (!['replace', 'alternative', 'add', 'remove'].includes(suggestionType)) {
      return NextResponse.json({ error: 'Invalid suggestionType' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO itinerary_suggestions (itinerary_id, user_id, day_number, activity_index, suggestion_type, content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, user.id, dayNumber || null, activityIndex ?? null, suggestionType, content]
    );

    const row = result.rows[0];

    // Fetch user info
    const userResult = await query(
      `SELECT full_name, avatar_url FROM users WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json({
      suggestion: {
        id: row.id,
        itineraryId: row.itinerary_id,
        userId: row.user_id,
        dayNumber: row.day_number,
        activityIndex: row.activity_index,
        suggestionType: row.suggestion_type,
        content: row.content,
        status: row.status,
        createdAt: row.created_at,
        user: {
          id: user.id,
          fullName: userResult.rows[0]?.full_name,
          avatarUrl: userResult.rows[0]?.avatar_url,
        },
        voteCount: { up: 0, down: 0 },
      },
      message: 'Suggestion created successfully',
    });
  } catch (error: any) {
    console.error('Failed to create suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    );
  }
}

// PUT - Update suggestion status (owner only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const ownerCheck = await query(
      `SELECT user_id FROM itineraries WHERE id = $1`,
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    if (ownerCheck.rows[0].user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the owner can accept/reject suggestions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { suggestionId, status } = body;

    if (!suggestionId || !status) {
      return NextResponse.json(
        { error: 'suggestionId and status are required' },
        { status: 400 }
      );
    }

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const result = await query(
      `UPDATE itinerary_suggestions SET status = $1 WHERE id = $2 AND itinerary_id = $3 RETURNING *`,
      [status, suggestionId, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // If suggestion was accepted, potentially award helpful badge to the suggester
    if (status === 'accepted') {
      // Count accepted suggestions by this user
      const acceptedCount = await query(
        `SELECT COUNT(*) FROM itinerary_suggestions WHERE user_id = $1 AND status = 'accepted'`,
        [row.user_id]
      );

      // Award helpful badge if they have 5+ accepted suggestions
      if (parseInt(acceptedCount.rows[0].count) >= 5) {
        await query(
          `INSERT INTO user_badges (user_id, badge_type)
           VALUES ($1, 'helpful')
           ON CONFLICT DO NOTHING`,
          [row.user_id]
        );
      }
    }

    return NextResponse.json({
      suggestion: {
        id: row.id,
        itineraryId: row.itinerary_id,
        userId: row.user_id,
        dayNumber: row.day_number,
        activityIndex: row.activity_index,
        suggestionType: row.suggestion_type,
        content: row.content,
        status: row.status,
        createdAt: row.created_at,
      },
      message: `Suggestion ${status}`,
    });
  } catch (error: any) {
    console.error('Failed to update suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a suggestion (author or owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const suggestionId = searchParams.get('suggestionId');

    if (!suggestionId) {
      return NextResponse.json({ error: 'suggestionId is required' }, { status: 400 });
    }

    // Check if user is suggestion author or itinerary owner
    const checkResult = await query(
      `SELECT s.user_id as suggestion_author, i.user_id as itinerary_owner
       FROM itinerary_suggestions s
       JOIN itineraries i ON s.itinerary_id = i.id
       WHERE s.id = $1 AND s.itinerary_id = $2`,
      [suggestionId, id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const { suggestion_author, itinerary_owner } = checkResult.rows[0];
    if (user.id !== suggestion_author && user.id !== itinerary_owner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await query(`DELETE FROM itinerary_suggestions WHERE id = $1`, [suggestionId]);

    return NextResponse.json({ message: 'Suggestion deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to delete suggestion' },
      { status: 500 }
    );
  }
}
