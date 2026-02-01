import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';
import { isEmailConfigured, sendInviteEmail } from '@/lib/email';
import { z } from 'zod';
import crypto from 'crypto';

const InviteSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.enum(['editor', 'viewer']).default('viewer'),
});

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64 character hex string
}

// GET pending invites for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this trip
    const tripResult = await query(
      `SELECT t.id, t.user_id FROM trips t
       LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id AND tc.user_id = $2
       WHERE t.id = $1 AND (t.user_id = $2 OR tc.user_id IS NOT NULL)`,
      [id, user.id]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
    }

    // Get pending invites (not accepted, not expired)
    const invitesResult = await query(
      `SELECT id, email, role, token, created_at, expires_at
       FROM trip_invites
       WHERE trip_id = $1 AND accepted_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [id]
    );

    return NextResponse.json({ invites: invitesResult.rows });
  } catch (error: any) {
    console.error('Failed to fetch invites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invites' },
      { status: 500 }
    );
  }
}

// POST create a new invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = InviteSchema.parse(body);

    // Check if user has permission to invite (must be owner or editor)
    const tripResult = await query(
      `SELECT t.id, t.title, t.user_id FROM trips t
       LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id AND tc.user_id = $2
       WHERE t.id = $1 AND (t.user_id = $2 OR (tc.user_id IS NOT NULL AND tc.role IN ('owner', 'editor')))`,
      [id, user.id]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or no permission to invite' }, { status: 404 });
    }

    const trip = tripResult.rows[0];

    // Note: We skip checking if user is already a collaborator by email here
    // because that would require access to auth.users table (Supabase-specific)
    // The invite acceptance flow will handle duplicates

    // Check if there's already a pending invite for this email
    const existingInviteResult = await query(
      `SELECT id FROM trip_invites
       WHERE trip_id = $1 AND email = $2 AND accepted_at IS NULL AND expires_at > NOW()`,
      [id, input.email]
    );

    if (existingInviteResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'An invite is already pending for this email' },
        { status: 400 }
      );
    }

    // Generate invite token
    const token = generateToken();

    // Create invite record
    const inviteResult = await query(
      `INSERT INTO trip_invites (trip_id, email, role, token, invited_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, token, created_at, expires_at`,
      [id, input.email, input.role, token, user.id]
    );

    const invite = inviteResult.rows[0];

    // Build invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2002';
    const inviteUrl = `${baseUrl}/invite/${token}`;

    // Check if email is configured and try to send
    const emailConfigured = isEmailConfigured();
    let emailSent = false;

    if (emailConfigured) {
      try {
        const emailResult = await sendInviteEmail({
          to: input.email,
          inviteUrl,
          tripTitle: trip.title,
          tripCity: trip.city,
          inviterName: user.email,
          role: input.role,
        });
        emailSent = emailResult.success;
        if (!emailResult.success) {
          console.error('Failed to send invite email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
        // Continue - invite is still valid, user can share link manually
      }
    }

    return NextResponse.json({
      invite,
      inviteUrl,
      emailSent,
      emailConfigured,
      message: emailConfigured && emailSent
        ? 'Invite sent via email'
        : 'Invite created - share the link with the recipient'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create invite:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}

// DELETE revoke an invite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('inviteId');

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 });
    }

    // Check if user has permission to revoke invites
    const tripResult = await query(
      `SELECT t.id FROM trips t
       LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id AND tc.user_id = $2
       WHERE t.id = $1 AND (t.user_id = $2 OR (tc.user_id IS NOT NULL AND tc.role IN ('owner', 'editor')))`,
      [id, user.id]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or no permission' }, { status: 404 });
    }

    // Delete the invite
    const deleteResult = await query(
      `DELETE FROM trip_invites WHERE id = $1 AND trip_id = $2 RETURNING id`,
      [inviteId, id]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Failed to revoke invite:', error);
    return NextResponse.json(
      { error: 'Failed to revoke invite' },
      { status: 500 }
    );
  }
}
