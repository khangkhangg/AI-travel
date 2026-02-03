import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Simple admin auth check
async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// PATCH - Update user status (ban/activate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['active', 'banned'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "active" or "banned".' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, status`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: result.rows[0],
      message: status === 'banned' ? 'User has been banned' : 'User has been activated',
    });
  } catch (error: any) {
    console.error('Failed to update user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status', details: error.message },
      { status: 500 }
    );
  }
}
