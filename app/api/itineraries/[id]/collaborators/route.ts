import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { CollaboratorRole } from '@/lib/types/user';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - List collaborators for an itinerary
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();

    // Check if itinerary exists and user has access
    const itineraryResult = await query(
      `SELECT user_id, visibility FROM itineraries WHERE id = $1`,
      [id]
    );

    if (itineraryResult.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const itinerary = itineraryResult.rows[0];
    const isOwner = user?.id === itinerary.user_id;

    // Check if user is collaborator
    let isCollaborator = false;
    if (user && !isOwner) {
      const collabCheck = await query(
        `SELECT id FROM itinerary_collaborators WHERE itinerary_id = $1 AND user_id = $2`,
        [id, user.id]
      );
      isCollaborator = collabCheck.rows.length > 0;
    }

    // Only owner and collaborators can see collaborator list for private itineraries
    if (itinerary.visibility === 'private' && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await query(
      `SELECT
        ic.*,
        u.full_name,
        u.avatar_url,
        u.email
      FROM itinerary_collaborators ic
      LEFT JOIN users u ON ic.user_id = u.id
      WHERE ic.itinerary_id = $1
      ORDER BY ic.invited_at`,
      [id]
    );

    const collaborators = result.rows.map(row => ({
      id: row.id,
      itineraryId: row.itinerary_id,
      userId: row.user_id,
      role: row.role,
      invitedAt: row.invited_at,
      user: {
        id: row.user_id,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
        email: isOwner ? row.email : undefined, // Only owner sees emails
      },
    }));

    return NextResponse.json({ collaborators });
  } catch (error: any) {
    console.error('Failed to fetch collaborators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    );
  }
}

// POST - Add a collaborator (owner only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const ownerCheck = await query(
      `SELECT user_id FROM itineraries WHERE id = $1`,
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    if (ownerCheck.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: 'Only the owner can add collaborators' }, { status: 403 });
    }

    const body = await request.json();
    const { email, userId: targetUserId, role = 'viewer' } = body;

    if (!email && !targetUserId) {
      return NextResponse.json(
        { error: 'Email or userId is required' },
        { status: 400 }
      );
    }

    if (!['viewer', 'collaborator'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Find user by email or id
    let collaboratorId = targetUserId;
    if (email) {
      const userResult = await query(
        `SELECT id FROM users WHERE email = $1`,
        [email]
      );
      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      collaboratorId = userResult.rows[0].id;
    }

    // Can't add yourself
    if (collaboratorId === user.id) {
      return NextResponse.json(
        { error: 'Cannot add yourself as collaborator' },
        { status: 400 }
      );
    }

    // Add collaborator (upsert)
    const result = await query(
      `INSERT INTO itinerary_collaborators (itinerary_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (itinerary_id, user_id)
       DO UPDATE SET role = $3
       RETURNING *`,
      [id, collaboratorId, role]
    );

    // Fetch user info
    const userInfo = await query(
      `SELECT id, full_name, avatar_url, email FROM users WHERE id = $1`,
      [collaboratorId]
    );

    const row = result.rows[0];
    const userRow = userInfo.rows[0];

    return NextResponse.json({
      collaborator: {
        id: row.id,
        itineraryId: row.itinerary_id,
        userId: row.user_id,
        role: row.role,
        invitedAt: row.invited_at,
        user: {
          id: userRow.id,
          fullName: userRow.full_name,
          avatarUrl: userRow.avatar_url,
          email: userRow.email,
        },
      },
      message: 'Collaborator added successfully',
    });
  } catch (error: any) {
    console.error('Failed to add collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to add collaborator' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a collaborator (owner only, or self-remove)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collaboratorId = searchParams.get('collaboratorId');
    const userId = searchParams.get('userId');

    if (!collaboratorId && !userId) {
      return NextResponse.json(
        { error: 'collaboratorId or userId is required' },
        { status: 400 }
      );
    }

    // Check ownership
    const ownerCheck = await query(
      `SELECT user_id FROM itineraries WHERE id = $1`,
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const isOwner = ownerCheck.rows[0].user_id === user.id;
    const isSelfRemoval = userId === user.id;

    // Only owner can remove others, or users can remove themselves
    if (!isOwner && !isSelfRemoval) {
      return NextResponse.json(
        { error: 'Only the owner can remove collaborators' },
        { status: 403 }
      );
    }

    let result;
    if (collaboratorId) {
      result = await query(
        `DELETE FROM itinerary_collaborators WHERE id = $1 AND itinerary_id = $2 RETURNING id`,
        [collaboratorId, id]
      );
    } else {
      result = await query(
        `DELETE FROM itinerary_collaborators WHERE itinerary_id = $1 AND user_id = $2 RETURNING id`,
        [id, userId]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Collaborator removed successfully' });
  } catch (error: any) {
    console.error('Failed to remove collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    );
  }
}
