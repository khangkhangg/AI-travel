import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this trip
    const tripCheck = await query(
      `SELECT t.id, t.user_id, c.user_id as collaborator_id
       FROM trips t
       LEFT JOIN trip_collaborators c ON t.id = c.trip_id AND c.user_id = $2
       WHERE t.id = $1`,
      [id, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const trip = tripCheck.rows[0];
    const hasAccess = trip.user_id === user.id || trip.collaborator_id === user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get proposal counts per activity (only pending status)
    const proposalCounts = await query(
      `SELECT activity_id, COUNT(*)::int as count
       FROM marketplace_proposals
       WHERE trip_id = $1 AND activity_id IS NOT NULL AND status = 'pending'
       GROUP BY activity_id`,
      [id]
    );

    // Get suggestion counts per activity (only pending status)
    const suggestionCounts = await query(
      `SELECT activity_id, COUNT(*)::int as count
       FROM trip_suggestions
       WHERE trip_id = $1 AND activity_id IS NOT NULL AND status = 'pending'
       GROUP BY activity_id`,
      [id]
    );

    // Format results as objects with activity_id as keys
    const proposals: Record<string, number> = {};
    proposalCounts.rows.forEach((row: any) => {
      proposals[row.activity_id] = row.count;
    });

    const suggestions: Record<string, number> = {};
    suggestionCounts.rows.forEach((row: any) => {
      suggestions[row.activity_id] = row.count;
    });

    return NextResponse.json({ proposals, suggestions });
  } catch (error: any) {
    console.error('Failed to fetch marketplace counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace counts', details: error.message },
      { status: 500 }
    );
  }
}
