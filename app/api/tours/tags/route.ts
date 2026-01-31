import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - List all tour tags
export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM tour_tags WHERE is_active = true ORDER BY sort_order`,
      []
    );

    const tags = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      icon: row.icon,
      color: row.color,
      sortOrder: row.sort_order,
    }));

    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error('Failed to fetch tour tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour tags' },
      { status: 500 }
    );
  }
}
