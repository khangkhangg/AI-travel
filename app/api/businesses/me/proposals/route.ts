import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - Fetch all proposals for the current user's business
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's business
    const businessResult = await query(
      'SELECT id FROM businesses WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ error: 'No active business found' }, { status: 404 });
    }

    const businessId = businessResult.rows[0].id;

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, accepted, declined, withdrawn, all
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let statusFilter = '';
    const params: any[] = [businessId, limit];

    if (status && status !== 'all') {
      statusFilter = 'AND mp.status = $3';
      params.push(status);
    }

    const result = await query(
      `SELECT
        mp.*,
        t.id as trip_id,
        t.title as trip_title,
        t.city as trip_city,
        t.visibility as trip_visibility,
        t.start_date as trip_start_date,
        tu.full_name as trip_owner_name,
        tu.avatar_url as trip_owner_avatar,
        i.title as activity_title
       FROM marketplace_proposals mp
       JOIN trips t ON t.id = mp.trip_id
       LEFT JOIN users tu ON t.user_id = tu.id
       LEFT JOIN itinerary_items i ON mp.activity_id = i.id
       WHERE mp.business_id = $1 ${statusFilter}
       ORDER BY mp.created_at DESC
       LIMIT $2`,
      params
    );

    // Parse JSON fields
    const proposals = result.rows.map((p: any) => ({
      ...p,
      services_offered: typeof p.services_offered === 'string'
        ? JSON.parse(p.services_offered)
        : p.services_offered,
      pricing_breakdown: typeof p.pricing_breakdown === 'string'
        ? JSON.parse(p.pricing_breakdown)
        : p.pricing_breakdown,
    }));

    return NextResponse.json({ proposals });
  } catch (error: any) {
    console.error('Failed to fetch business proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}
