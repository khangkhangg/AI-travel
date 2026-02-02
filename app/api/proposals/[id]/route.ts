import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - get proposal details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT mp.*,
        b.business_name, b.business_type, b.logo_url, b.rating, b.review_count, b.description as business_description,
        u.full_name as owner_name, u.avatar_url as owner_avatar,
        t.title as trip_title, t.city as trip_city, t.start_date, t.user_id as trip_owner_id
       FROM marketplace_proposals mp
       JOIN businesses b ON b.id = mp.business_id
       JOIN users u ON u.id = b.user_id
       JOIN trips t ON t.id = mp.trip_id
       WHERE mp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Get messages for this proposal
    const messagesResult = await query(
      `SELECT pm.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM proposal_messages pm
       JOIN users u ON u.id = pm.sender_id
       WHERE pm.proposal_id = $1
       ORDER BY pm.created_at ASC`,
      [id]
    );

    return NextResponse.json({
      proposal: result.rows[0],
      messages: messagesResult.rows
    });
  } catch (error: any) {
    console.error('Failed to fetch proposal:', error);
    return NextResponse.json({ error: 'Failed to fetch proposal' }, { status: 500 });
  }
}

// PATCH - update proposal status (accept/decline/withdraw)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, response_message } = body;

    // Get proposal with trip and business info
    const proposalResult = await query(
      `SELECT mp.*, t.user_id as trip_owner_id, b.user_id as business_owner_id
       FROM marketplace_proposals mp
       JOIN trips t ON t.id = mp.trip_id
       JOIN businesses b ON b.id = mp.business_id
       WHERE mp.id = $1`,
      [id]
    );

    if (proposalResult.rows.length === 0) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const proposal = proposalResult.rows[0];
    const isTripOwner = proposal.trip_owner_id === user.id;
    const isBusinessOwner = proposal.business_owner_id === user.id;

    // Validate permissions based on status change
    if (status === 'accepted' || status === 'declined') {
      // Only trip owner can accept/decline
      if (!isTripOwner) {
        return NextResponse.json({ error: 'Only trip owner can accept or decline proposals' }, { status: 403 });
      }
    } else if (status === 'withdrawn') {
      // Only business owner can withdraw
      if (!isBusinessOwner) {
        return NextResponse.json({ error: 'Only proposal owner can withdraw' }, { status: 403 });
      }
    } else if (status === 'completed' || status === 'cancelled') {
      // Either party can mark as completed or cancelled
      if (!isTripOwner && !isBusinessOwner) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    // Update proposal
    const result = await query(
      `UPDATE marketplace_proposals
       SET status = $1, response_message = COALESCE($2, response_message), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, response_message, id]
    );

    // If accepted, update service needs status
    if (status === 'accepted' && proposal.service_needs_ids && proposal.service_needs_ids.length > 0) {
      await query(
        "UPDATE trip_service_needs SET status = 'fulfilled' WHERE id = ANY($1)",
        [proposal.service_needs_ids]
      );
    }

    // Add system message for status change
    await query(
      `INSERT INTO proposal_messages (proposal_id, sender_id, message, message_type, created_at)
       VALUES ($1, $2, $3, 'system', NOW())`,
      [id, user.id, `Proposal ${status}`]
    );

    return NextResponse.json({ proposal: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to update proposal:', error);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }
}

// POST - send message on proposal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message, attachments } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Verify user is part of this proposal (trip owner or business owner)
    const proposalCheck = await query(
      `SELECT mp.id FROM marketplace_proposals mp
       JOIN trips t ON t.id = mp.trip_id
       JOIN businesses b ON b.id = mp.business_id
       WHERE mp.id = $1 AND (t.user_id = $2 OR b.user_id = $2)`,
      [id, user.id]
    );

    if (proposalCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Not authorized to message on this proposal' }, { status: 403 });
    }

    const result = await query(
      `INSERT INTO proposal_messages (proposal_id, sender_id, message, attachments, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [id, user.id, message, JSON.stringify(attachments || [])]
    );

    // Get sender info
    const messageWithSender = await query(
      `SELECT pm.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM proposal_messages pm
       JOIN users u ON u.id = pm.sender_id
       WHERE pm.id = $1`,
      [result.rows[0].id]
    );

    return NextResponse.json({ message: messageWithSender.rows[0] });
  } catch (error: any) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
