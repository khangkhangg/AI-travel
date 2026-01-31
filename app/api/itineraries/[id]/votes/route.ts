import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { VoteType, VoteTargetType } from '@/lib/types/user';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get votes for an itinerary (optionally filtered by target)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType') as VoteTargetType | null;
    const targetId = searchParams.get('targetId');

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
        v.*,
        u.full_name,
        u.avatar_url
      FROM itinerary_votes v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.itinerary_id = $1
    `;
    const sqlParams: any[] = [id];
    let paramIndex = 2;

    if (targetType) {
      sql += ` AND v.target_type = $${paramIndex++}`;
      sqlParams.push(targetType);
    }
    if (targetId) {
      sql += ` AND v.target_id = $${paramIndex++}`;
      sqlParams.push(targetId);
    }

    const result = await query(sql, sqlParams);

    // Calculate vote counts per target
    const voteCounts: Record<string, { up: number; down: number; userVote?: VoteType }> = {};

    result.rows.forEach((row) => {
      const key = `${row.target_type}:${row.target_id}`;
      if (!voteCounts[key]) {
        voteCounts[key] = { up: 0, down: 0 };
      }
      if (row.vote === 'up') {
        voteCounts[key].up++;
      } else {
        voteCounts[key].down++;
      }
      // Track current user's vote
      if (user && row.user_id === user.id) {
        voteCounts[key].userVote = row.vote;
      }
    });

    const votes = result.rows.map((row) => ({
      id: row.id,
      itineraryId: row.itinerary_id,
      userId: row.user_id,
      targetType: row.target_type,
      targetId: row.target_id,
      vote: row.vote,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
      },
    }));

    return NextResponse.json({ votes, voteCounts });
  } catch (error: any) {
    console.error('Failed to fetch votes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}

// POST - Add or update a vote
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

    // For private itineraries, only owner and collaborators can vote
    if (itinerary.visibility === 'private' && !isOwner) {
      const collabCheck = await query(
        `SELECT id FROM itinerary_collaborators WHERE itinerary_id = $1 AND user_id = $2`,
        [id, user.id]
      );
      if (collabCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { targetType, targetId, vote } = body;

    if (!targetType || !targetId || !vote) {
      return NextResponse.json(
        { error: 'targetType, targetId, and vote are required' },
        { status: 400 }
      );
    }

    if (!['activity', 'hotel', 'suggestion'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
    }

    if (!['up', 'down'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote (must be "up" or "down")' }, { status: 400 });
    }

    // Upsert vote
    const result = await query(
      `INSERT INTO itinerary_votes (itinerary_id, user_id, target_type, target_id, vote)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (itinerary_id, user_id, target_type, target_id)
       DO UPDATE SET vote = $5, created_at = NOW()
       RETURNING *`,
      [id, user.id, targetType, targetId, vote]
    );

    const row = result.rows[0];

    // Get updated vote counts for this target
    const countResult = await query(
      `SELECT vote, COUNT(*) as count
       FROM itinerary_votes
       WHERE itinerary_id = $1 AND target_type = $2 AND target_id = $3
       GROUP BY vote`,
      [id, targetType, targetId]
    );

    const voteCount = { up: 0, down: 0 };
    countResult.rows.forEach((r) => {
      voteCount[r.vote as VoteType] = parseInt(r.count);
    });

    return NextResponse.json({
      vote: {
        id: row.id,
        itineraryId: row.itinerary_id,
        userId: row.user_id,
        targetType: row.target_type,
        targetId: row.target_id,
        vote: row.vote,
        createdAt: row.created_at,
      },
      voteCount,
      message: 'Vote recorded successfully',
    });
  } catch (error: any) {
    console.error('Failed to record vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a vote
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: 'targetType and targetId are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `DELETE FROM itinerary_votes
       WHERE itinerary_id = $1 AND user_id = $2 AND target_type = $3 AND target_id = $4
       RETURNING id`,
      [id, user.id, targetType, targetId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Vote not found' }, { status: 404 });
    }

    // Get updated vote counts for this target
    const countResult = await query(
      `SELECT vote, COUNT(*) as count
       FROM itinerary_votes
       WHERE itinerary_id = $1 AND target_type = $2 AND target_id = $3
       GROUP BY vote`,
      [id, targetType, targetId]
    );

    const voteCount = { up: 0, down: 0 };
    countResult.rows.forEach((r) => {
      voteCount[r.vote as VoteType] = parseInt(r.count);
    });

    return NextResponse.json({
      voteCount,
      message: 'Vote removed successfully',
    });
  } catch (error: any) {
    console.error('Failed to remove vote:', error);
    return NextResponse.json(
      { error: 'Failed to remove vote' },
      { status: 500 }
    );
  }
}
