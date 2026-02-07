import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Public settings that can be fetched without authentication
const PUBLIC_SETTINGS = [
  'google_calendar_booking_enabled',
  'profile_design',
  'app_branding',
  'google_analytics',
];

// GET - Get public site settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key parameter is required' }, { status: 400 });
    }

    // Only allow fetching public settings
    if (!PUBLIC_SETTINGS.includes(key)) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    const result = await query(
      'SELECT key, value FROM site_settings WHERE key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      // Return default values for known settings
      const defaults: Record<string, any> = {
        google_calendar_booking_enabled: 'false',
        profile_design: 'journey',
        app_branding: { appName: 'Wanderlust', logoUrl: null },
        google_analytics: { trackingId: '' },
      };

      return NextResponse.json({
        key,
        value: defaults[key] || null,
      });
    }

    return NextResponse.json({
      key: result.rows[0].key,
      value: result.rows[0].value,
    });
  } catch (error: any) {
    console.error('Failed to get site setting:', error);
    return NextResponse.json(
      { error: 'Failed to get site setting' },
      { status: 500 }
    );
  }
}
