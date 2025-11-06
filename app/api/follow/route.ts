import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { z } from 'zod';

const FollowSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = FollowSchema.parse(body);

    if (input.userId === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const existingFollow = await query(
      'SELECT id FROM followers WHERE follower_id = $1 AND following_id = $2',
      [user.id, input.userId]
    );

    let following = true;

    if (existingFollow.rows.length > 0) {
      // Unfollow
      await query(
        'DELETE FROM followers WHERE follower_id = $1 AND following_id = $2',
        [user.id, input.userId]
      );
      following = false;
    } else {
      // Follow
      await query(
        'INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)',
        [user.id, input.userId]
      );
    }

    // Get updated follower count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM followers WHERE following_id = $1',
      [input.userId]
    );

    return NextResponse.json({
      following,
      followerCount: parseInt(countResult.rows[0].count)
    });
  } catch (error: any) {
    console.error('Failed to follow user:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}
