import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch marketplace trips for landing page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);
    const serviceType = searchParams.get('serviceType'); // guide, hotel, transport, experience

    let whereConditions = ["t.visibility = 'marketplace'"];
    const values: any[] = [];
    let paramIndex = 1;

    // Filter by service type if provided
    if (serviceType && serviceType !== 'all') {
      whereConditions.push(`t.marketplace_needs ? $${paramIndex}`);
      values.push(serviceType);
      paramIndex++;
    }

    values.push(limit);

    const result = await query(
      `SELECT
        t.id,
        t.title,
        t.city,
        t.start_date,
        t.end_date,
        t.num_people,
        t.marketplace_needs,
        t.marketplace_budget_min,
        t.marketplace_budget_max,
        t.travel_type,
        t.created_at,
        -- Creator info
        u.id as creator_id,
        u.full_name as creator_name,
        u.avatar_url as creator_avatar,
        -- Proposal count
        (SELECT COUNT(*) FROM marketplace_proposals mp
         WHERE mp.trip_id = t.id AND mp.status = 'pending') as proposal_count,
        -- Service needs detail
        (SELECT jsonb_agg(jsonb_build_object(
          'service_type', tsn.service_type,
          'status', tsn.status
        )) FROM trip_service_needs tsn
        WHERE tsn.trip_id = t.id) as service_needs
      FROM trips t
      JOIN users u ON t.user_id = u.id
      WHERE ${whereConditions.join(' AND ')}
        AND t.title IS NOT NULL
        AND t.city IS NOT NULL
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex}`,
      values
    );

    // Transform results for frontend
    const trips = result.rows.map(row => {
      // Calculate duration
      let duration = '3 days';
      if (row.start_date && row.end_date) {
        const start = new Date(row.start_date);
        const end = new Date(row.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        duration = `${days} day${days !== 1 ? 's' : ''}`;
      }

      // Format start date
      let startDate: string | undefined;
      if (row.start_date) {
        const start = new Date(row.start_date);
        const end = row.end_date ? new Date(row.end_date) : start;
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        startDate = `${start.toLocaleDateString('en-US', options)}-${end.toLocaleDateString('en-US', { day: 'numeric' })}, ${start.getFullYear()}`;
      }

      // Format budget
      let budget: string | undefined;
      if (row.marketplace_budget_min || row.marketplace_budget_max) {
        const min = row.marketplace_budget_min;
        const max = row.marketplace_budget_max;
        if (min && max) {
          budget = `$${min.toLocaleString()}-${max.toLocaleString()}`;
        } else if (max) {
          budget = `Up to $${max.toLocaleString()}`;
        } else if (min) {
          budget = `From $${min.toLocaleString()}`;
        }
      }

      // Determine needs from marketplace_needs or service_needs
      const needs: string[] = [];
      if (row.marketplace_needs) {
        if (Array.isArray(row.marketplace_needs)) {
          needs.push(...row.marketplace_needs);
        } else if (typeof row.marketplace_needs === 'object') {
          Object.keys(row.marketplace_needs).forEach(key => {
            if (row.marketplace_needs[key]) needs.push(key);
          });
        }
      }
      if (row.service_needs && Array.isArray(row.service_needs)) {
        row.service_needs.forEach((sn: any) => {
          if (sn.service_type && sn.status === 'need' && !needs.includes(sn.service_type)) {
            needs.push(sn.service_type);
          }
        });
      }

      // Determine status based on proposal count
      const proposalCount = parseInt(row.proposal_count) || 0;
      let status: 'open' | 'has_offers' | 'booked' = 'open';
      if (proposalCount > 0) {
        status = 'has_offers';
      }

      // Format created at
      const createdAt = new Date(row.created_at);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      let createdAtFormatted: string;
      if (diffHours < 1) {
        createdAtFormatted = 'Just now';
      } else if (diffHours < 24) {
        createdAtFormatted = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        createdAtFormatted = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }

      return {
        id: row.id,
        title: row.title,
        destination: row.city,
        country: '', // Not stored separately
        duration,
        startDate,
        travelers: row.num_people || 1,
        budget,
        status,
        categories: (row.travel_type || []).slice(0, 2),
        needs: needs.slice(0, 4),
        offersCount: proposalCount,
        createdAt: createdAtFormatted,
        user: {
          name: row.creator_name || 'Anonymous',
          avatar: row.creator_avatar || null,
        },
      };
    });

    return NextResponse.json({ trips });
  } catch (error: any) {
    console.error('Failed to fetch marketplace trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace trips' },
      { status: 500 }
    );
  }
}
