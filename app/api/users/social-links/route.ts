import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

const VALID_PLATFORMS = ['instagram', 'twitter', 'facebook', 'tiktok', 'youtube', 'linkedin', 'website'];

// GET - Get user's social links
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT * FROM user_social_links WHERE user_id = $1 ORDER BY created_at`,
      [user.id]
    );

    const socialLinks = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      platform: row.platform,
      value: row.value,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ socialLinks });
  } catch (error: any) {
    console.error('Failed to fetch social links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social links' },
      { status: 500 }
    );
  }
}

// POST - Add or update social link
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, value } = body;

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

    // Upsert - insert or update if exists
    const result = await query(
      `INSERT INTO user_social_links (user_id, platform, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, platform)
       DO UPDATE SET value = $3, updated_at = NOW()
       RETURNING *`,
      [user.id, platform, value]
    );

    const row = result.rows[0];
    return NextResponse.json({
      socialLink: {
        id: row.id,
        userId: row.user_id,
        platform: row.platform,
        value: row.value,
        createdAt: row.created_at,
      },
      message: 'Social link saved successfully',
    });
  } catch (error: any) {
    console.error('Failed to save social link:', error);
    return NextResponse.json(
      { error: 'Failed to save social link' },
      { status: 500 }
    );
  }
}

// DELETE - Remove social link
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
        `DELETE FROM user_social_links WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, user.id]
      );
    } else {
      result = await query(
        `DELETE FROM user_social_links WHERE platform = $1 AND user_id = $2 RETURNING id`,
        [platform, user.id]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Social link deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete social link:', error);
    return NextResponse.json(
      { error: 'Failed to delete social link' },
      { status: 500 }
    );
  }
}
