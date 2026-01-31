import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

const VALID_PLATFORMS = ['paypal', 'venmo', 'cashapp', 'wise', 'kofi', 'buymeacoffee'];

// GET - Get user's payment links
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT * FROM user_payment_links WHERE user_id = $1 ORDER BY is_primary DESC, created_at`,
      [user.id]
    );

    const paymentLinks = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      platform: row.platform,
      value: row.value,
      isPrimary: row.is_primary,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ paymentLinks });
  } catch (error: any) {
    console.error('Failed to fetch payment links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment links' },
      { status: 500 }
    );
  }
}

// POST - Add or update payment link
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, value, isPrimary } = body;

    if (!platform || !value) {
      return NextResponse.json(
        { error: 'Platform and value are required' },
        { status: 400 }
      );
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // If setting as primary, unset other primary links first
    if (isPrimary) {
      await query(
        `UPDATE user_payment_links SET is_primary = FALSE WHERE user_id = $1`,
        [user.id]
      );
    }

    // Upsert - insert or update if exists
    const result = await query(
      `INSERT INTO user_payment_links (user_id, platform, value, is_primary)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, platform)
       DO UPDATE SET value = $3, is_primary = $4, updated_at = NOW()
       RETURNING *`,
      [user.id, platform, value, isPrimary || false]
    );

    const row = result.rows[0];
    return NextResponse.json({
      paymentLink: {
        id: row.id,
        userId: row.user_id,
        platform: row.platform,
        value: row.value,
        isPrimary: row.is_primary,
        createdAt: row.created_at,
      },
      message: 'Payment link saved successfully',
    });
  } catch (error: any) {
    console.error('Failed to save payment link:', error);
    return NextResponse.json(
      { error: 'Failed to save payment link' },
      { status: 500 }
    );
  }
}

// DELETE - Remove payment link
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const platform = searchParams.get('platform');

    if (!id && !platform) {
      return NextResponse.json({ error: 'ID or platform is required' }, { status: 400 });
    }

    let result;
    if (id) {
      result = await query(
        `DELETE FROM user_payment_links WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, user.id]
      );
    } else {
      result = await query(
        `DELETE FROM user_payment_links WHERE platform = $1 AND user_id = $2 RETURNING id`,
        [platform, user.id]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Payment link deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete payment link:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment link' },
      { status: 500 }
    );
  }
}
