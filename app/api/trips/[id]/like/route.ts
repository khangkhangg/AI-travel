import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query, getClient } from '@/lib/db';

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

    await client.query('BEGIN');

    // Toggle like
    const existingLike = await client.query(
      'SELECT id FROM trip_likes WHERE trip_id = $1 AND user_id = $2',
      [id, user.id]
    );

    let liked = true;

    if (existingLike.rows.length > 0) {
      // Unlike
      await client.query(
        'DELETE FROM trip_likes WHERE trip_id = $1 AND user_id = $2',
        [id, user.id]
      );

      await client.query(
        'UPDATE trips SET likes_count = likes_count - 1 WHERE id = $1',
        [id]
      );

      liked = false;
    } else {
      // Like
      await client.query(
        'INSERT INTO trip_likes (trip_id, user_id) VALUES ($1, $2)',
        [id, user.id]
      );

      await client.query(
        'UPDATE trips SET likes_count = likes_count + 1 WHERE id = $1',
        [id]
      );
    }

    // Get updated count
    const countResult = await client.query(
      'SELECT likes_count FROM trips WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      liked,
      likesCount: countResult.rows[0]?.likes_count || 0
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to like trip:', error);
    return NextResponse.json(
      { error: 'Failed to like trip' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
