import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Simple admin auth check
async function isAdmin() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  return adminSession?.value === process.env.ADMIN_PASSWORD;
}

// POST - Run pending migrations
export async function POST(request: NextRequest) {
  try {
    // Allow in development or with admin auth
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && !await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: { name: string; status: string; error?: string }[] = [];

    // Migration 1: trip_images table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS trip_images (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
          itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT trip_or_itinerary_required CHECK (trip_id IS NOT NULL OR itinerary_id IS NOT NULL)
        )
      `);
      results.push({ name: 'trip_images table', status: 'success' });
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        results.push({ name: 'trip_images table', status: 'skipped (exists)' });
      } else {
        results.push({ name: 'trip_images table', status: 'error', error: e.message });
      }
    }

    // Migration 2: trip_images indexes
    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_trip_images_trip ON trip_images(trip_id) WHERE trip_id IS NOT NULL`);
      await query(`CREATE INDEX IF NOT EXISTS idx_trip_images_itinerary ON trip_images(itinerary_id) WHERE itinerary_id IS NOT NULL`);
      results.push({ name: 'trip_images indexes', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'trip_images indexes', status: 'error', error: e.message });
    }

    // Migration 3: users status column
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`);
      results.push({ name: 'users.status column', status: 'success' });
    } catch (e: any) {
      if (e.message.includes('already exists') || e.message.includes('duplicate')) {
        results.push({ name: 'users.status column', status: 'skipped (exists)' });
      } else {
        results.push({ name: 'users.status column', status: 'error', error: e.message });
      }
    }

    // Migration 4: users status index
    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
      results.push({ name: 'users.status index', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'users.status index', status: 'error', error: e.message });
    }

    // Migration 5: followers table (if not exists)
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS followers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(follower_id, following_id)
        )
      `);
      results.push({ name: 'followers table', status: 'success' });
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        results.push({ name: 'followers table', status: 'skipped (exists)' });
      } else {
        results.push({ name: 'followers table', status: 'error', error: e.message });
      }
    }

    // Migration 6: user_badge_levels table (gamified badges)
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_badge_levels (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          track VARCHAR(20) NOT NULL,
          level INTEGER NOT NULL DEFAULT 1,
          current_count INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, track)
        )
      `);
      results.push({ name: 'user_badge_levels table', status: 'success' });
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        results.push({ name: 'user_badge_levels table', status: 'skipped (exists)' });
      } else {
        results.push({ name: 'user_badge_levels table', status: 'error', error: e.message });
      }
    }

    // Migration 7: user_badge_levels index
    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_user_badge_levels_user ON user_badge_levels(user_id)`);
      results.push({ name: 'user_badge_levels index', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'user_badge_levels index', status: 'error', error: e.message });
    }

    return NextResponse.json({
      message: 'Migrations completed',
      results,
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Check migration status
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tables: { name: string; exists: boolean }[] = [];

    // Check trip_images
    const tripImagesCheck = await query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trip_images')
    `);
    tables.push({ name: 'trip_images', exists: tripImagesCheck.rows[0].exists });

    // Check followers
    const followersCheck = await query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'followers')
    `);
    tables.push({ name: 'followers', exists: followersCheck.rows[0].exists });

    // Check users.status column
    const statusCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'status'
      )
    `);
    tables.push({ name: 'users.status', exists: statusCheck.rows[0].exists });

    return NextResponse.json({ tables });
  } catch (error: any) {
    console.error('Failed to check migrations:', error);
    return NextResponse.json(
      { error: 'Failed to check migrations', details: error.message },
      { status: 500 }
    );
  }
}
