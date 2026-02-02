import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get site settings from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Get specific setting
      const result = await query(
        'SELECT key, value, updated_at FROM site_settings WHERE key = $1',
        [key]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }

      return NextResponse.json({
        key: result.rows[0].key,
        value: result.rows[0].value,
        updatedAt: result.rows[0].updated_at,
      });
    }

    // Get all settings
    const result = await query('SELECT key, value, updated_at FROM site_settings');

    const settings: Record<string, any> = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Failed to get site settings:', error);
    return NextResponse.json(
      { error: 'Failed to get site settings', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update site setting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value)]
    );

    return NextResponse.json({
      key: result.rows[0].key,
      value: result.rows[0].value,
      message: 'Setting updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update site setting:', error);
    return NextResponse.json(
      { error: 'Failed to update site setting', details: error.message },
      { status: 500 }
    );
  }
}
