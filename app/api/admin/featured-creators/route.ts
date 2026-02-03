import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { INTEREST_CATEGORIES } from '@/lib/types/user';

// Check admin auth
async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// GET - List all featured creators by category
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all featured creators with user info
    const result = await query(
      `SELECT
        fc.id as featured_id,
        fc.category,
        fc.display_order,
        fc.featured_until,
        fc.created_at as featured_at,
        u.id,
        u.username,
        u.full_name,
        u.avatar_url,
        u.location,
        (SELECT COUNT(*) FROM trips WHERE user_id = u.id AND visibility IN ('public', 'marketplace', 'curated')) as itinerary_count,
        (SELECT COALESCE(SUM(clone_count), 0) FROM trips WHERE user_id = u.id) as total_clones
      FROM featured_creators fc
      JOIN users u ON fc.user_id = u.id
      ORDER BY fc.category, fc.display_order ASC`,
      []
    );

    // Group by category
    const byCategory: Record<string, any[]> = {};
    for (const row of result.rows) {
      if (!byCategory[row.category]) {
        byCategory[row.category] = [];
      }
      byCategory[row.category].push({
        featured_id: row.featured_id,
        id: row.id,
        username: row.username,
        full_name: row.full_name,
        avatar_url: row.avatar_url,
        location: row.location,
        itinerary_count: parseInt(row.itinerary_count) || 0,
        total_clones: parseInt(row.total_clones) || 0,
        display_order: row.display_order,
        featured_until: row.featured_until,
        featured_at: row.featured_at,
      });
    }

    return NextResponse.json({ byCategory });
  } catch (error: any) {
    console.error('Failed to fetch featured creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured creators', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Add a featured creator
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, category, featuredUntil } = body;

    if (!userId || !category) {
      return NextResponse.json(
        { error: 'userId and category are required' },
        { status: 400 }
      );
    }

    // Validate category
    if (!INTEREST_CATEGORIES[category]) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userCheck = await query(
      `SELECT id FROM users WHERE id = $1`,
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the max display_order for this category
    const orderResult = await query(
      `SELECT COALESCE(MAX(display_order), -1) + 1 as next_order
       FROM featured_creators
       WHERE category = $1`,
      [category]
    );
    const nextOrder = orderResult.rows[0].next_order;

    // Insert featured creator (UPSERT to handle duplicates)
    const result = await query(
      `INSERT INTO featured_creators (user_id, category, display_order, featured_until)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category) DO UPDATE SET
         display_order = EXCLUDED.display_order,
         featured_until = EXCLUDED.featured_until
       RETURNING id`,
      [userId, category, nextOrder, featuredUntil || null]
    );

    return NextResponse.json({
      success: true,
      featuredId: result.rows[0].id,
    });
  } catch (error: any) {
    console.error('Failed to add featured creator:', error);
    return NextResponse.json(
      { error: 'Failed to add featured creator', details: error.message },
      { status: 500 }
    );
  }
}
