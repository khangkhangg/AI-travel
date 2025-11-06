import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { z } from 'zod';

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['editor', 'viewer']).default('viewer'),
});

// GET collaborators
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT
        tc.*,
        u.email,
        u.full_name,
        u.avatar_url
       FROM trip_collaborators tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.trip_id = $1
       ORDER BY tc.joined_at ASC`,
      [params.id]
    );

    return NextResponse.json({ collaborators: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch collaborators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    );
  }
}

// POST invite collaborator
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = InviteSchema.parse(body);

    // Check if requester is owner or editor
    const permissionCheck = await query(
      `SELECT tc.role FROM trip_collaborators tc
       WHERE tc.trip_id = $1 AND tc.user_id = $2 AND tc.role IN ('owner', 'editor')`,
      [params.id, user.id]
    );

    if (permissionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Only owners and editors can invite collaborators' },
        { status: 403 }
      );
    }

    // Find user by email
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [input.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found. They must create an account first.' },
        { status: 404 }
      );
    }

    const inviteeId = userResult.rows[0].id;

    // Add collaborator
    const result = await query(
      `INSERT INTO trip_collaborators (trip_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (trip_id, user_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [params.id, inviteeId, input.role]
    );

    return NextResponse.json({ collaborator: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to invite collaborator:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to invite collaborator' },
      { status: 500 }
    );
  }
}

// DELETE remove collaborator
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collaboratorId = searchParams.get('userId');

    if (!collaboratorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if requester is owner
    const permissionCheck = await query(
      `SELECT tc.role FROM trip_collaborators tc
       WHERE tc.trip_id = $1 AND tc.user_id = $2 AND tc.role = 'owner'`,
      [params.id, user.id]
    );

    if (permissionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Only owners can remove collaborators' },
        { status: 403 }
      );
    }

    // Remove collaborator (cannot remove owner)
    const result = await query(
      `DELETE FROM trip_collaborators
       WHERE trip_id = $1 AND user_id = $2 AND role != 'owner'
       RETURNING id`,
      [params.id, collaboratorId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Collaborator not found or cannot remove owner' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to remove collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    );
  }
}
