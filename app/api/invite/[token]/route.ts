import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET validate an invite token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Look up the invite with trip details
    const result = await query(
      `SELECT
        ti.id,
        ti.email,
        ti.role,
        ti.expires_at,
        ti.accepted_at,
        ti.invited_by,
        t.id as trip_id,
        t.title as trip_title,
        t.city as trip_city
       FROM trip_invites ti
       JOIN trips t ON ti.trip_id = t.id
       WHERE ti.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Invite not found' },
        { status: 404 }
      );
    }

    const invite = result.rows[0];

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({
        valid: true,
        expired: true,
        alreadyAccepted: false,
      });
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return NextResponse.json({
        valid: true,
        expired: false,
        alreadyAccepted: true,
      });
    }

    // Valid invite
    return NextResponse.json({
      valid: true,
      expired: false,
      alreadyAccepted: false,
      tripTitle: invite.trip_title,
      tripCity: invite.trip_city,
      role: invite.role,
      email: invite.email,
    });

  } catch (error: any) {
    console.error('Failed to validate invite:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate invite' },
      { status: 500 }
    );
  }
}
