import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// This endpoint creates the required database tables if they don't exist
// Access it once at: http://localhost:2002/api/setup
export async function GET() {
  try {
    // Create trips table
    await query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title TEXT,
        start_date DATE,
        end_date DATE,
        num_people INTEGER,
        budget_per_person DECIMAL(10, 2),
        city TEXT,
        budget_range TEXT,
        travel_type TEXT[] DEFAULT '{}',
        age_range TEXT,
        description TEXT,
        visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'marketplace', 'curated')),
        ai_model_id UUID,
        generated_content JSONB,
        total_cost DECIMAL(10, 2),
        tokens_used INTEGER,
        generation_time_ms INTEGER,
        is_exported BOOLEAN DEFAULT false,
        views_count INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        share_code TEXT UNIQUE,
        curator_is_local TEXT,
        curator_years_lived TEXT,
        curator_experience TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Add chat_history column if it doesn't exist (for existing databases)
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'trips' AND column_name = 'chat_history') THEN
          ALTER TABLE trips ADD COLUMN chat_history JSONB DEFAULT '[]';
        END IF;
      END $$;
    `);

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trips_share_code ON trips(share_code)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trips_visibility ON trips(visibility)`);

    // Create itinerary_items table
    await query(`
      CREATE TABLE IF NOT EXISTS itinerary_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        time_slot TEXT,
        title TEXT NOT NULL,
        description TEXT,
        location_name TEXT,
        location_address TEXT,
        location TEXT,
        location_lat DECIMAL(10, 7),
        location_lng DECIMAL(10, 7),
        google_place_id TEXT,
        category TEXT,
        item_type TEXT DEFAULT 'activity',
        estimated_cost DECIMAL(10, 2),
        estimated_duration_minutes INTEGER,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_itinerary_items_trip_id ON itinerary_items(trip_id)`);

    // Add summary and source_url columns to itinerary_items
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'itinerary_items' AND column_name = 'summary') THEN
          ALTER TABLE itinerary_items ADD COLUMN summary TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'itinerary_items' AND column_name = 'source_url') THEN
          ALTER TABLE itinerary_items ADD COLUMN source_url TEXT;
        END IF;
      END $$;
    `);

    // Create trip_travelers table
    await query(`
      CREATE TABLE IF NOT EXISTS trip_travelers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        is_child BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_trip_travelers_trip_id ON trip_travelers(trip_id)`);

    // Create trip_collaborators table
    await query(`
      CREATE TABLE IF NOT EXISTS trip_collaborators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'editor', 'viewer')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(trip_id, user_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_trip_collaborators_trip_id ON trip_collaborators(trip_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trip_collaborators_user_id ON trip_collaborators(user_id)`);

    // Create trip_likes table
    await query(`
      CREATE TABLE IF NOT EXISTS trip_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(trip_id, user_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_trip_likes_trip_id ON trip_likes(trip_id)`);

    // Create discussions table
    await query(`
      CREATE TABLE IF NOT EXISTS discussions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        itinerary_item_id UUID REFERENCES itinerary_items(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        parent_id UUID,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_discussions_trip_id ON discussions(trip_id)`);

    // Add message_type and metadata columns to discussions table for system messages
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'discussions' AND column_name = 'message_type') THEN
          ALTER TABLE discussions ADD COLUMN message_type TEXT DEFAULT 'message';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'discussions' AND column_name = 'metadata') THEN
          ALTER TABLE discussions ADD COLUMN metadata JSONB;
        END IF;
      END $$;
    `);

    // Add collaborative planning columns to trips table
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'trips' AND column_name = 'arrival_time') THEN
          ALTER TABLE trips ADD COLUMN arrival_time TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'trips' AND column_name = 'departure_time') THEN
          ALTER TABLE trips ADD COLUMN departure_time TEXT;
        END IF;
      END $$;
    `);

    // Add collaborative planning columns to itinerary_items table
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'itinerary_items' AND column_name = 'is_final') THEN
          ALTER TABLE itinerary_items ADD COLUMN is_final BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'itinerary_items' AND column_name = 'payer_id') THEN
          ALTER TABLE itinerary_items ADD COLUMN payer_id UUID;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'itinerary_items' AND column_name = 'is_split') THEN
          ALTER TABLE itinerary_items ADD COLUMN is_split BOOLEAN DEFAULT true;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'itinerary_items' AND column_name = 'time_start') THEN
          ALTER TABLE itinerary_items ADD COLUMN time_start TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'itinerary_items' AND column_name = 'time_end') THEN
          ALTER TABLE itinerary_items ADD COLUMN time_end TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'itinerary_items' AND column_name = 'source_url') THEN
          ALTER TABLE itinerary_items ADD COLUMN source_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'itinerary_items' AND column_name = 'place_data') THEN
          ALTER TABLE itinerary_items ADD COLUMN place_data JSONB;
        END IF;
      END $$;
    `);

    // Create activity_votes table
    await query(`
      CREATE TABLE IF NOT EXISTS activity_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        itinerary_item_id UUID NOT NULL REFERENCES itinerary_items(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        vote TEXT CHECK (vote IN ('up', 'down', 'pending')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(itinerary_item_id, user_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_activity_votes_item_id ON activity_votes(itinerary_item_id)`);

    // Create cost_settlements table
    await query(`
      CREATE TABLE IF NOT EXISTS cost_settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        from_user_id UUID NOT NULL,
        to_user_id UUID NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        is_settled BOOLEAN DEFAULT false,
        settled_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_cost_settlements_trip_id ON cost_settlements(trip_id)`);

    // Create trip_invites table for collaboration invites
    await query(`
      CREATE TABLE IF NOT EXISTS trip_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'viewer',
        token VARCHAR(64) UNIQUE NOT NULL,
        invited_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
        accepted_at TIMESTAMP WITH TIME ZONE,
        CONSTRAINT valid_invite_role CHECK (role IN ('editor', 'viewer'))
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_trip_invites_token ON trip_invites(token)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trip_invites_trip_id ON trip_invites(trip_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trip_invites_email ON trip_invites(email)`);

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully!',
      tables: ['trips', 'itinerary_items', 'trip_travelers', 'trip_collaborators', 'trip_likes', 'discussions', 'activity_votes', 'cost_settlements', 'trip_invites']
    });
  } catch (error: any) {
    console.error('Setup failed:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    );
  }
}
