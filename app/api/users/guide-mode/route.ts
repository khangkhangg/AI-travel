import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - get guide mode status
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      'SELECT is_guide, guide_details FROM users WHERE id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      is_guide: result.rows[0].is_guide || false,
      guide_details: result.rows[0].guide_details || null
    });
  } catch (error: any) {
    console.error('Failed to fetch guide mode:', error);
    return NextResponse.json({ error: 'Failed to fetch guide mode' }, { status: 500 });
  }
}

// PATCH - toggle guide mode and update details
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { is_guide, guide_details } = body;

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (is_guide !== undefined) {
      updates.push(`is_guide = $${paramIndex}`);
      values.push(is_guide);
      paramIndex++;
    }

    if (guide_details !== undefined) {
      updates.push(`guide_details = $${paramIndex}`);
      values.push(JSON.stringify(guide_details));
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    values.push(user.id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING is_guide, guide_details`,
      values
    );

    return NextResponse.json({
      is_guide: result.rows[0].is_guide,
      guide_details: result.rows[0].guide_details
    });
  } catch (error: any) {
    console.error('Failed to update guide mode:', error);
    return NextResponse.json({ error: 'Failed to update guide mode' }, { status: 500 });
  }
}
