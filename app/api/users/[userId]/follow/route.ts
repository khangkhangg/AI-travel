import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// POST - Follow a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Can't follow yourself
    if (currentUser.id === userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if target user exists
    const userExists = await query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userExists.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create follow relationship
    await query(
      `INSERT INTO followers (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [currentUser.id, userId]
    );

    // Get updated follower count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM followers WHERE following_id = $1',
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Now following user',
      followersCount: parseInt(countResult.rows[0].count),
    });
  } catch (error: any) {
    console.error('Failed to follow user:', error);
    return NextResponse.json(
      { error: 'Failed to follow user', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Remove follow relationship
    await query(
      'DELETE FROM followers WHERE follower_id = $1 AND following_id = $2',
      [currentUser.id, userId]
    );

    // Get updated follower count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM followers WHERE following_id = $1',
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Unfollowed user',
      followersCount: parseInt(countResult.rows[0].count),
    });
  } catch (error: any) {
    console.error('Failed to unfollow user:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Check if current user is following
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getUser();
    const { userId } = await params;

    let isFollowing = false;

    if (currentUser) {
      const result = await query(
        'SELECT id FROM followers WHERE follower_id = $1 AND following_id = $2',
        [currentUser.id, userId]
      );
      isFollowing = result.rows.length > 0;
    }

    // Get follower count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM followers WHERE following_id = $1',
      [userId]
    );

    return NextResponse.json({
      isFollowing,
      followersCount: parseInt(countResult.rows[0].count),
    });
  } catch (error: any) {
    console.error('Failed to get follow status:', error);
    return NextResponse.json(
      { error: 'Failed to get follow status', details: error.message },
      { status: 500 }
    );
  }
}
