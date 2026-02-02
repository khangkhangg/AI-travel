import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Simple admin auth check
async function isAdmin() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  return adminSession?.value === process.env.ADMIN_PASSWORD;
}

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT
        u.id,
        u.email,
        u.full_name,
        u.username,
        u.avatar_url,
        u.status,
        u.created_at,
        COUNT(t.id) as trip_count
       FROM users u
       LEFT JOIN trips t ON t.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    return NextResponse.json({
      users: result.rows.map(row => ({
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        username: row.username,
        avatar_url: row.avatar_url,
        status: row.status || 'active',
        created_at: row.created_at,
        trip_count: parseInt(row.trip_count) || 0,
      })),
    });
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}
