import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - Fetch user's recent activity
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch recent suggestions made by the user
    const suggestionsResult = await query(
      `SELECT
        s.id,
        s.place_name,
        s.status,
        s.created_at,
        t.id as trip_id,
        t.title as trip_title,
        t.city as trip_city,
        tu.full_name as trip_owner_name
      FROM trip_suggestions s
      JOIN trips t ON s.trip_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2`,
      [user.id, limit]
    );

    // Fetch recent proposals/bids made by the user (if they have a business)
    let proposalsResult = { rows: [] as any[] };
    try {
      proposalsResult = await query(
        `SELECT
          p.id,
          p.total_price,
          p.currency,
          p.status,
          p.created_at,
          t.id as trip_id,
          t.title as trip_title,
          t.city as trip_city,
          tu.full_name as trip_owner_name,
          i.title as activity_title
        FROM marketplace_proposals p
        JOIN trips t ON p.trip_id = t.id
        LEFT JOIN users tu ON t.user_id = tu.id
        LEFT JOIN itinerary_items i ON p.activity_id = i.id
        JOIN businesses b ON p.business_id = b.id
        WHERE b.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2`,
        [user.id, limit]
      );
    } catch {
      // marketplace_proposals or businesses table might not exist
    }

    // Fetch suggestions received on user's trips
    const receivedSuggestionsResult = await query(
      `SELECT
        s.id,
        s.place_name,
        s.reason,
        s.status,
        s.created_at,
        t.id as trip_id,
        t.title as trip_title,
        u.full_name as suggester_name,
        u.avatar_url as suggester_avatar
      FROM trip_suggestions s
      JOIN trips t ON s.trip_id = t.id
      JOIN users u ON s.user_id = u.id
      WHERE t.user_id = $1 AND s.user_id != $1
      ORDER BY s.created_at DESC
      LIMIT $2`,
      [user.id, limit]
    );

    // Fetch proposals/bids received on user's trips
    let receivedProposalsResult = { rows: [] as any[] };
    try {
      receivedProposalsResult = await query(
        `SELECT
          p.id,
          p.total_price,
          p.currency,
          p.status,
          p.created_at,
          p.message,
          p.terms,
          t.id as trip_id,
          t.title as trip_title,
          t.city as trip_city,
          b.business_name,
          b.logo_url as business_logo,
          b.business_type,
          i.title as activity_title
        FROM marketplace_proposals p
        JOIN trips t ON p.trip_id = t.id
        JOIN businesses b ON p.business_id = b.id
        LEFT JOIN itinerary_items i ON p.activity_id = i.id
        WHERE t.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2`,
        [user.id, limit]
      );
    } catch {
      // marketplace_proposals or businesses table might not exist
    }

    // Combine and format activities
    const activities: any[] = [];

    // Add suggestions made
    suggestionsResult.rows.forEach((s) => {
      activities.push({
        id: `suggestion-${s.id}`,
        type: 'suggestion_made',
        title: `Suggested "${s.place_name}"`,
        subtitle: `on ${s.trip_title}${s.trip_city ? ` (${s.trip_city})` : ''}`,
        status: s.status,
        tripId: s.trip_id,
        tripOwner: s.trip_owner_name,
        createdAt: s.created_at,
      });
    });

    // Add proposals/bids made
    proposalsResult.rows.forEach((p) => {
      activities.push({
        id: `proposal-${p.id}`,
        type: 'bid_made',
        title: `Submitted bid for ${p.activity_title || 'trip'}`,
        subtitle: `${p.currency} ${p.total_price} on ${p.trip_title}`,
        status: p.status,
        tripId: p.trip_id,
        tripOwner: p.trip_owner_name,
        createdAt: p.created_at,
      });
    });

    // Add suggestions received
    receivedSuggestionsResult.rows.forEach((s) => {
      activities.push({
        id: `received-${s.id}`,
        type: 'suggestion_received',
        title: `${s.suggester_name} suggested "${s.place_name}"`,
        subtitle: `on your trip "${s.trip_title}"`,
        status: s.status,
        tripId: s.trip_id,
        suggesterAvatar: s.suggester_avatar,
        message: s.reason || undefined,
        createdAt: s.created_at,
      });
    });

    // Add proposals/bids received
    receivedProposalsResult.rows.forEach((p) => {
      // Extract withdrawal reason from terms JSON if present
      let withdrawalReason: string | undefined;
      if (p.terms) {
        try {
          const terms = typeof p.terms === 'string' ? JSON.parse(p.terms) : p.terms;
          withdrawalReason = terms.withdrawal_reason;
        } catch {
          // Invalid JSON, ignore
        }
      }

      activities.push({
        id: `bid-received-${p.id}`,
        type: 'bid_received',
        title: `${p.business_name} submitted a bid`,
        subtitle: `${p.currency} ${p.total_price} for ${p.activity_title || p.trip_title}`,
        status: p.status,
        tripId: p.trip_id,
        businessLogo: p.business_logo,
        businessType: p.business_type,
        message: p.message || undefined,
        withdrawalReason,
        createdAt: p.created_at,
      });
    });

    // Sort all activities by date
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Take only the most recent ones
    const recentActivities = activities.slice(0, limit);

    return NextResponse.json({ activities: recentActivities });
  } catch (error: any) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
