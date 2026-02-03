import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - list marketplace trips with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get('destination');
    const serviceType = searchParams.get('serviceType');
    const budgetMin = searchParams.get('budgetMin');
    const budgetMax = searchParams.get('budgetMax');
    const startDateFrom = searchParams.get('startDateFrom');
    const startDateTo = searchParams.get('startDateTo');
    const travelers = searchParams.get('travelers');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereConditions = ["t.visibility = 'marketplace'", "t.start_date > NOW()"];
    const values: any[] = [];
    let paramIndex = 1;

    // Filter by destination (city)
    if (destination) {
      whereConditions.push(`LOWER(t.city) LIKE $${paramIndex}`);
      values.push(`%${destination.toLowerCase()}%`);
      paramIndex++;
    }

    // Filter by service type needed
    if (serviceType) {
      whereConditions.push(`t.marketplace_needs ? $${paramIndex}`);
      values.push(serviceType);
      paramIndex++;
    }

    // Filter by budget range
    if (budgetMin) {
      whereConditions.push(`(t.marketplace_budget_max IS NULL OR t.marketplace_budget_max >= $${paramIndex})`);
      values.push(parseInt(budgetMin));
      paramIndex++;
    }
    if (budgetMax) {
      whereConditions.push(`(t.marketplace_budget_min IS NULL OR t.marketplace_budget_min <= $${paramIndex})`);
      values.push(parseInt(budgetMax));
      paramIndex++;
    }

    // Filter by date range
    if (startDateFrom) {
      whereConditions.push(`t.start_date >= $${paramIndex}`);
      values.push(startDateFrom);
      paramIndex++;
    }
    if (startDateTo) {
      whereConditions.push(`t.start_date <= $${paramIndex}`);
      values.push(startDateTo);
      paramIndex++;
    }

    // Filter by number of travelers
    if (travelers) {
      whereConditions.push(`t.num_people >= $${paramIndex}`);
      values.push(parseInt(travelers));
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM trips t WHERE ${whereConditions.join(' AND ')}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Get trips with creator info and service needs summary
    values.push(limit, offset);
    const result = await query(
      `SELECT
        t.id, t.title, t.description, t.city, t.start_date, t.num_people,
        t.marketplace_needs, t.marketplace_budget_min, t.marketplace_budget_max, t.marketplace_notes,
        t.created_at,
        u.id as creator_id, u.full_name as creator_name, u.avatar_url as creator_avatar, u.username as creator_username,
        (SELECT COUNT(*) FROM itinerary_items WHERE trip_id = t.id) as activity_count,
        (SELECT COUNT(*) FROM marketplace_proposals WHERE trip_id = t.id AND status = 'pending') as proposal_count,
        (SELECT jsonb_agg(jsonb_build_object(
          'id', tsn.id,
          'service_type', tsn.service_type,
          'notes', tsn.notes,
          'budget_min', tsn.budget_min,
          'budget_max', tsn.budget_max,
          'status', tsn.status
        )) FROM trip_service_needs tsn WHERE tsn.trip_id = t.id) as service_needs,
        (SELECT jsonb_agg(jsonb_build_object(
          'night_number', ta.night_number,
          'date', ta.date,
          'status', ta.status,
          'location_preference', ta.location_preference
        )) FROM trip_accommodations ta WHERE ta.trip_id = t.id AND ta.status = 'need') as accommodation_needs
       FROM trips t
       JOIN users u ON u.id = t.user_id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY t.start_date ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    return NextResponse.json({
      trips: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch marketplace trips:', error);
    return NextResponse.json({ error: 'Failed to fetch marketplace trips' }, { status: 500 });
  }
}
