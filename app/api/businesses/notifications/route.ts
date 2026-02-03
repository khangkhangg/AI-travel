import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - get notification settings for current user's business
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
      return NextResponse.json({ error: 'No business found for this user' }, { status: 404 });
    }

    const businessId = businessResult.rows[0].id;

    // Get or create notification settings
    let settingsResult = await query(
      'SELECT * FROM business_notification_settings WHERE business_id = $1',
      [businessId]
    );

    // If no settings exist, create default ones
    if (settingsResult.rows.length === 0) {
      settingsResult = await query(
        `INSERT INTO business_notification_settings (business_id)
         VALUES ($1)
         RETURNING *`,
        [businessId]
      );
    }

    const settings = settingsResult.rows[0];

    return NextResponse.json({
      // Email settings
      email_new_trips: settings.email_new_trips,
      email_proposal_updates: settings.email_proposal_updates,
      email_new_reviews: settings.email_new_reviews,
      email_weekly_digest: settings.email_weekly_digest,
      // Telegram settings
      telegram_id: settings.telegram_id,
      telegram_verified: settings.telegram_verified,
      telegram_new_trips: settings.telegram_new_trips,
      telegram_proposal_updates: settings.telegram_proposal_updates,
      telegram_new_reviews: settings.telegram_new_reviews,
      telegram_daily_summary: settings.telegram_daily_summary,
    });
  } catch (error: any) {
    console.error('Failed to fetch notification settings:', error);
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 });
  }
}

// PUT - update notification settings
export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: 'No business found for this user' }, { status: 404 });
    }

    const businessId = businessResult.rows[0].id;

    const body = await request.json();
    const {
      email_new_trips,
      email_proposal_updates,
      email_new_reviews,
      email_weekly_digest,
      telegram_id,
      telegram_new_trips,
      telegram_proposal_updates,
      telegram_new_reviews,
      telegram_daily_summary,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (email_new_trips !== undefined) {
      updates.push(`email_new_trips = $${paramIndex}`);
      values.push(email_new_trips);
      paramIndex++;
    }
    if (email_proposal_updates !== undefined) {
      updates.push(`email_proposal_updates = $${paramIndex}`);
      values.push(email_proposal_updates);
      paramIndex++;
    }
    if (email_new_reviews !== undefined) {
      updates.push(`email_new_reviews = $${paramIndex}`);
      values.push(email_new_reviews);
      paramIndex++;
    }
    if (email_weekly_digest !== undefined) {
      updates.push(`email_weekly_digest = $${paramIndex}`);
      values.push(email_weekly_digest);
      paramIndex++;
    }
    if (telegram_id !== undefined) {
      updates.push(`telegram_id = $${paramIndex}`);
      values.push(telegram_id || null);
      paramIndex++;
      // Reset verification when telegram_id changes
      updates.push(`telegram_verified = false`);
    }
    if (telegram_new_trips !== undefined) {
      updates.push(`telegram_new_trips = $${paramIndex}`);
      values.push(telegram_new_trips);
      paramIndex++;
    }
    if (telegram_proposal_updates !== undefined) {
      updates.push(`telegram_proposal_updates = $${paramIndex}`);
      values.push(telegram_proposal_updates);
      paramIndex++;
    }
    if (telegram_new_reviews !== undefined) {
      updates.push(`telegram_new_reviews = $${paramIndex}`);
      values.push(telegram_new_reviews);
      paramIndex++;
    }
    if (telegram_daily_summary !== undefined) {
      updates.push(`telegram_daily_summary = $${paramIndex}`);
      values.push(telegram_daily_summary);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No settings to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(businessId);

    // Upsert notification settings
    const result = await query(
      `INSERT INTO business_notification_settings (business_id)
       VALUES ($${paramIndex})
       ON CONFLICT (business_id) DO UPDATE SET ${updates.join(', ')}
       RETURNING *`,
      values
    );

    const settings = result.rows[0];

    return NextResponse.json({
      email_new_trips: settings.email_new_trips,
      email_proposal_updates: settings.email_proposal_updates,
      email_new_reviews: settings.email_new_reviews,
      email_weekly_digest: settings.email_weekly_digest,
      telegram_id: settings.telegram_id,
      telegram_verified: settings.telegram_verified,
      telegram_new_trips: settings.telegram_new_trips,
      telegram_proposal_updates: settings.telegram_proposal_updates,
      telegram_new_reviews: settings.telegram_new_reviews,
      telegram_daily_summary: settings.telegram_daily_summary,
      message: 'Notification settings updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update notification settings:', error);
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
  }
}

// POST - verify Telegram connection
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'No business found for this user' }, { status: 404 });
    }

    const businessId = businessResult.rows[0].id;

    const body = await request.json();
    const { verification_code } = body;

    if (!verification_code) {
      return NextResponse.json({ error: 'Verification code required' }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Check if the verification_code matches a stored pending verification
    // 2. Verify against the Telegram bot's records
    // For now, we'll simulate a successful verification

    // Mark telegram as verified
    const result = await query(
      `UPDATE business_notification_settings
       SET telegram_verified = true, updated_at = NOW()
       WHERE business_id = $1
       RETURNING telegram_id, telegram_verified`,
      [businessId]
    );

    if (result.rows.length === 0 || !result.rows[0].telegram_id) {
      return NextResponse.json(
        { error: 'Please set your Telegram ID first' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      telegram_verified: true,
      message: 'Telegram connected successfully! You will now receive notifications.',
    });
  } catch (error: any) {
    console.error('Failed to verify Telegram:', error);
    return NextResponse.json({ error: 'Failed to verify Telegram connection' }, { status: 500 });
  }
}
