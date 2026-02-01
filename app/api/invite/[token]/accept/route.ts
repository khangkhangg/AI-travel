import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

// POST accept an invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to accept invite' }, { status: 401 });
    }

    // Look up the invite
    const inviteResult = await query(
      `SELECT id, trip_id, email, role, expires_at, accepted_at
       FROM trip_invites
       WHERE token = $1`,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const invite = inviteResult.rows[0];

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 });
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return NextResponse.json({ error: 'This invite has already been accepted' }, { status: 400 });
    }

    // Check if user email matches invite email
    if (user.email !== invite.email) {
      return NextResponse.json(
        { error: `This invite was sent to ${invite.email}. Please sign in with that email.` },
        { status: 403 }
      );
    }

    // Check if user is already a collaborator
    const existingCollab = await query(
      `SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2`,
      [invite.trip_id, user.id]
    );

    if (existingCollab.rows.length > 0) {
      // Already a collaborator - just mark invite as accepted
      await query(
        `UPDATE trip_invites SET accepted_at = NOW() WHERE id = $1`,
        [invite.id]
      );

      return NextResponse.json({
        success: true,
        tripId: invite.trip_id,
        message: 'You are already a collaborator on this trip',
      });
    }

    // Add user as collaborator
    await query(
      `INSERT INTO trip_collaborators (trip_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [invite.trip_id, user.id, invite.role]
    );

    // Mark invite as accepted
    await query(
      `UPDATE trip_invites SET accepted_at = NOW() WHERE id = $1`,
      [invite.id]
    );

    return NextResponse.json({
      success: true,
      tripId: invite.trip_id,
      role: invite.role,
      message: 'Successfully joined trip as ' + invite.role,
    });

  } catch (error: any) {
    console.error('Failed to accept invite:', error);
    return NextResponse.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    );
  }
}
