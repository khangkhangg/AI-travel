import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query, getClient } from '@/lib/db';
import { z } from 'zod';

const VoteSchema = z.object({
  itineraryItemId: z.string().uuid(),
  voteType: z.enum(['up', 'down', 'neutral']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await getClient();

  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = VoteSchema.parse(body);

    await client.query('BEGIN');

    // Check if user has access to trip
    const tripCheck = await client.query(
      `SELECT t.id FROM trips t
       LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id
       WHERE t.id = $1 AND (t.user_id = $2 OR tc.user_id = $2)`,
      [id, user.id]
    );

    if (tripCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 403 });
    }

    // Upsert vote
    const result = await client.query(
      `INSERT INTO item_votes (itinerary_item_id, user_id, vote_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (itinerary_item_id, user_id)
       DO UPDATE SET vote_type = EXCLUDED.vote_type
       RETURNING *`,
      [input.itineraryItemId, user.id, input.voteType]
    );

    // Get vote counts
    const voteCounts = await client.query(
      `SELECT
        vote_type,
        COUNT(*) as count
       FROM item_votes
       WHERE itinerary_item_id = $1
       GROUP BY vote_type`,
      [input.itineraryItemId]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      vote: result.rows[0],
      counts: voteCounts.rows
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to vote:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// GET vote counts for trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query(
      `SELECT
        ii.id as itinerary_item_id,
        COUNT(*) FILTER (WHERE iv.vote_type = 'up') as up_votes,
        COUNT(*) FILTER (WHERE iv.vote_type = 'down') as down_votes
       FROM itinerary_items ii
       LEFT JOIN item_votes iv ON ii.id = iv.itinerary_item_id
       WHERE ii.trip_id = $1
       GROUP BY ii.id`,
      [id]
    );

    return NextResponse.json({ votes: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch votes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}
