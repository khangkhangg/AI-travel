import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// Helper function to create system messages for proposal events
async function createProposalSystemMessage(
  tripId: string,
  proposalId: string,
  messageType: string,
  proposal: any,
  businessInfo: any,
  activityInfo?: any
) {
  try {
    const metadata = {
      proposal_id: proposalId,
      business_id: businessInfo.id,
      business_name: businessInfo.business_name,
      business_type: businessInfo.business_type,
      business_logo: businessInfo.logo_url,
      activity_id: activityInfo?.id,
      activity_title: activityInfo?.title,
      total_price: proposal.total_price,
      currency: proposal.currency,
      message: proposal.message,
      services_offered: proposal.services_offered,
      pricing_breakdown: proposal.pricing_breakdown,
      withdrawal_reason: proposal.terms?.withdrawal_reason,
      previous_status: proposal.status,
    };

    let content = '';
    switch (messageType) {
      case 'proposal_created':
        content = `${businessInfo.business_name} submitted a proposal${activityInfo ? ` for "${activityInfo.title}"` : ''}`;
        break;
      case 'proposal_accepted':
        content = `Accepted proposal from ${businessInfo.business_name}${activityInfo ? ` for "${activityInfo.title}"` : ''}`;
        break;
      case 'proposal_declined':
        content = `Declined proposal from ${businessInfo.business_name}${activityInfo ? ` for "${activityInfo.title}"` : ''}`;
        break;
      case 'proposal_withdrawn':
        content = `${businessInfo.business_name} withdrew their proposal${activityInfo ? ` for "${activityInfo.title}"` : ''}`;
        break;
      case 'proposal_withdrawal_requested':
        content = `${businessInfo.business_name} requested to withdraw their proposal${activityInfo ? ` for "${activityInfo.title}"` : ''}`;
        break;
      default:
        content = `Proposal ${messageType.replace('proposal_', '')} by ${businessInfo.business_name}`;
    }

    await query(
      `INSERT INTO discussions (trip_id, itinerary_item_id, user_id, content, message_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        tripId,
        activityInfo?.id || null,
        businessInfo.user_id,
        content,
        messageType,
        JSON.stringify(metadata),
      ]
    );
  } catch (error) {
    console.error('Failed to create proposal system message:', error);
    // Don't fail the main operation if system message creation fails
  }
}

// GET - get proposals for a trip (trip owner) or proposals by business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forBusiness = searchParams.get('forBusiness') === 'true';

    if (forBusiness) {
      // Get proposals submitted by the current user's business
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const result = await query(
        `SELECT mp.*,
          b.business_name, b.business_type, b.logo_url, b.rating, b.review_count,
          t.title as trip_title, t.city as trip_city
         FROM marketplace_proposals mp
         JOIN trips t ON t.id = mp.trip_id
         JOIN businesses b ON b.id = mp.business_id
         WHERE mp.trip_id = $1 AND b.user_id = $2
         ORDER BY mp.created_at DESC`,
        [id, user.id]
      );

      return NextResponse.json({ proposals: result.rows });
    }

    // Get all proposals for trip (trip owner only)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify trip ownership
    const tripCheck = await query(
      'SELECT user_id FROM trips WHERE id = $1',
      [id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (tripCheck.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await query(
      `SELECT mp.*,
        b.business_name, b.business_type, b.logo_url, b.rating, b.review_count,
        u.full_name as owner_name, u.avatar_url as owner_avatar
       FROM marketplace_proposals mp
       JOIN businesses b ON b.id = mp.business_id
       JOIN users u ON u.id = b.user_id
       WHERE mp.trip_id = $1
       ORDER BY mp.created_at DESC`,
      [id]
    );

    return NextResponse.json({ proposals: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

// POST - submit a proposal (business only)
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

    // Get user's business
    const businessResult = await query(
      'SELECT id FROM businesses WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'You need to register as a business to submit proposals' },
        { status: 400 }
      );
    }

    const businessId = businessResult.rows[0].id;

    // Check if trip exists and is marketplace
    const tripCheck = await query(
      "SELECT id, user_id FROM trips WHERE id = $1 AND visibility = 'marketplace'",
      [id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or not in marketplace' }, { status: 404 });
    }

    // Can't bid on own trip
    if (tripCheck.rows[0].user_id === user.id) {
      return NextResponse.json({ error: 'Cannot submit proposal for your own trip' }, { status: 400 });
    }

    // Check if already submitted a proposal (exclude declined, expired, and withdrawn)
    const existingProposal = await query(
      "SELECT id, status FROM marketplace_proposals WHERE trip_id = $1 AND business_id = $2 AND status NOT IN ('declined', 'expired', 'withdrawn')",
      [id, businessId]
    );

    if (existingProposal.rows.length > 0) {
      const existing = existingProposal.rows[0];
      const statusMsg = existing.status === 'withdrawal_requested'
        ? 'You have a pending withdrawal request for this trip'
        : 'You already have an active proposal for this trip';
      return NextResponse.json(
        { error: statusMsg },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      activity_id,
      service_needs_ids,
      services_offered,
      pricing_breakdown,
      total_price,
      currency,
      message,
      terms,
      attachments,
      expires_at
    } = body;

    if (!services_offered || !pricing_breakdown || !total_price) {
      return NextResponse.json(
        { error: 'Services offered, pricing breakdown, and total price are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO marketplace_proposals (
        trip_id, business_id, activity_id, service_needs_ids, services_offered, pricing_breakdown,
        total_price, currency, message, terms, attachments, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        id,
        businessId,
        activity_id || null,
        service_needs_ids || [],
        JSON.stringify(services_offered),
        JSON.stringify(pricing_breakdown),
        total_price,
        currency || 'USD',
        message || '',
        terms ? JSON.stringify(terms) : null,
        JSON.stringify(attachments || []),
        expires_at || null
      ]
    );

    // Update service needs status to has_offers
    if (service_needs_ids && service_needs_ids.length > 0) {
      await query(
        "UPDATE trip_service_needs SET status = 'has_offers' WHERE id = ANY($1)",
        [service_needs_ids]
      );
    }

    // Get business info for system message
    const businessInfo = await query(
      'SELECT id, user_id, business_name, business_type, logo_url FROM businesses WHERE id = $1',
      [businessId]
    );

    // Get activity info if activity_id exists
    let activityInfo = null;
    if (activity_id) {
      const activityResult = await query(
        'SELECT id, title FROM itinerary_items WHERE id = $1',
        [activity_id]
      );
      if (activityResult.rows.length > 0) {
        activityInfo = activityResult.rows[0];
      }
    }

    // Create system message for proposal creation
    if (businessInfo.rows.length > 0) {
      await createProposalSystemMessage(
        id,
        result.rows[0].id,
        'proposal_created',
        result.rows[0],
        businessInfo.rows[0],
        activityInfo
      );
    }

    return NextResponse.json({ proposal: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to submit proposal:', error);
    return NextResponse.json({ error: 'Failed to submit proposal' }, { status: 500 });
  }
}

// PATCH - Update proposal status (accept/decline by owner, withdraw by business)
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
    const { proposal_id, status, message } = await request.json();

    if (!proposal_id || !status) {
      return NextResponse.json({ error: 'Proposal ID and status are required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['accepted', 'declined', 'withdrawn', 'withdrawal_requested'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get proposal with business and trip info
    const proposalCheck = await query(
      `SELECT mp.*, b.user_id as business_user_id, t.user_id as trip_owner_id
       FROM marketplace_proposals mp
       JOIN businesses b ON b.id = mp.business_id
       JOIN trips t ON t.id = mp.trip_id
       WHERE mp.id = $1 AND mp.trip_id = $2`,
      [proposal_id, id]
    );

    if (proposalCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const proposal = proposalCheck.rows[0];

    // Check permissions and valid state transitions based on action
    if (status === 'withdrawn') {
      // Business can withdraw their own pending proposal directly
      // Trip owner can approve a withdrawal request (from withdrawal_requested to withdrawn)
      if (proposal.business_user_id === user.id) {
        // Business withdrawing - only allowed for pending proposals
        if (proposal.status !== 'pending') {
          return NextResponse.json({ error: 'Can only withdraw pending proposals directly. Use withdrawal request for accepted proposals.' }, { status: 400 });
        }
      } else if (proposal.trip_owner_id === user.id) {
        // Trip owner approving withdrawal - only allowed for withdrawal_requested
        if (proposal.status !== 'withdrawal_requested') {
          return NextResponse.json({ error: 'Can only approve withdrawal for proposals with pending withdrawal request' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'Not authorized to withdraw this proposal' }, { status: 403 });
      }
    } else if (status === 'withdrawal_requested') {
      // Only the business owner can request withdrawal for their accepted proposals
      if (proposal.business_user_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized to request withdrawal' }, { status: 403 });
      }
      if (proposal.status !== 'accepted') {
        return NextResponse.json({ error: 'Can only request withdrawal for accepted proposals' }, { status: 400 });
      }
    } else if (status === 'accepted' || status === 'declined') {
      // Only trip owner can accept/decline
      if (proposal.trip_owner_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      // Can accept/decline pending proposals OR decline withdrawal requests
      if (proposal.status !== 'pending' && !(status === 'accepted' && proposal.status === 'withdrawal_requested')) {
        // Trip owner can reject a withdrawal request by setting status back to 'accepted'
        if (!(status === 'accepted' && proposal.status === 'withdrawal_requested')) {
          return NextResponse.json({ error: 'Can only update pending proposals' }, { status: 400 });
        }
      }
    }

    // Update the proposal (optionally include withdrawal message in terms JSON)
    let updateQuery = 'UPDATE marketplace_proposals SET status = $1, updated_at = NOW()';
    const updateParams: any[] = [status, proposal_id];

    if (status === 'withdrawal_requested' && message) {
      // Store withdrawal reason in terms JSON
      const terms = proposal.terms ? (typeof proposal.terms === 'string' ? JSON.parse(proposal.terms) : proposal.terms) : {};
      terms.withdrawal_reason = message;
      updateQuery = 'UPDATE marketplace_proposals SET status = $1, terms = $3, updated_at = NOW()';
      updateParams.push(JSON.stringify(terms));
    }

    updateQuery += ` WHERE id = $2 RETURNING *`;

    const result = await query(updateQuery, updateParams);

    // Get business info for system message
    const businessInfo = await query(
      'SELECT id, user_id, business_name, business_type, logo_url FROM businesses WHERE id = $1',
      [proposal.business_id]
    );

    // Get activity info if activity_id exists
    let activityInfo = null;
    if (proposal.activity_id) {
      const activityResult = await query(
        'SELECT id, title FROM itinerary_items WHERE id = $1',
        [proposal.activity_id]
      );
      if (activityResult.rows.length > 0) {
        activityInfo = activityResult.rows[0];
      }
    }

    // Create system message for status change
    if (businessInfo.rows.length > 0) {
      const updatedProposal = result.rows[0];
      const messageType = `proposal_${status}`;

      await createProposalSystemMessage(
        id,
        proposal_id,
        messageType,
        updatedProposal,
        businessInfo.rows[0],
        activityInfo
      );
    }

    return NextResponse.json({ proposal: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to update proposal:', error);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }
}

// DELETE - Remove a proposal (business owner only, for their own proposals)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId');

    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    // Get proposal with business info
    const proposalCheck = await query(
      `SELECT mp.*, b.user_id as business_user_id
       FROM marketplace_proposals mp
       JOIN businesses b ON b.id = mp.business_id
       WHERE mp.id = $1 AND mp.trip_id = $2`,
      [proposalId, id]
    );

    if (proposalCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const proposal = proposalCheck.rows[0];

    // Only the business owner can delete their own proposal
    if (proposal.business_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this proposal' }, { status: 403 });
    }

    // Can only delete pending proposals
    if (proposal.status !== 'pending') {
      return NextResponse.json({ error: 'Can only delete pending proposals' }, { status: 400 });
    }

    // Delete the proposal
    await query('DELETE FROM marketplace_proposals WHERE id = $1', [proposalId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete proposal:', error);
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 });
  }
}
