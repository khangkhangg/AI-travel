import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Check admin auth
async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_authenticated')?.value === 'true';
}

// DELETE - Remove a featured creator
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Featured ID is required' },
        { status: 400 }
      );
    }

    // Delete the featured creator entry
    const result = await query(
      `DELETE FROM featured_creators WHERE id = $1 RETURNING id, category`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Featured creator not found' },
        { status: 404 }
      );
    }

    // Reorder remaining entries in the same category
    const category = result.rows[0].category;
    await query(
      `WITH ordered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) - 1 as new_order
        FROM featured_creators
        WHERE category = $1
      )
      UPDATE featured_creators fc
      SET display_order = o.new_order
      FROM ordered o
      WHERE fc.id = o.id`,
      [category]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to remove featured creator:', error);
    return NextResponse.json(
      { error: 'Failed to remove featured creator', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update display order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { displayOrder, featuredUntil } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Featured ID is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(displayOrder);
    }

    if (featuredUntil !== undefined) {
      updates.push(`featured_until = $${paramIndex++}`);
      values.push(featuredUntil);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    values.push(id);
    const result = await query(
      `UPDATE featured_creators SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Featured creator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update featured creator:', error);
    return NextResponse.json(
      { error: 'Failed to update featured creator', details: error.message },
      { status: 500 }
    );
  }
}
