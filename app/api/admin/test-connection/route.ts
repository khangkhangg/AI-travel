import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, supabaseUrl, supabaseAnonKey, databaseUrl } = body;

    if (type === 'supabase') {
      // Test Supabase connection
      if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json({
          success: false,
          error: 'Missing Supabase URL or Anon Key',
        });
      }

      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Try to get the current session (doesn't require auth, just tests connection)
        const { error } = await supabase.auth.getSession();

        if (error) {
          return NextResponse.json({
            success: false,
            error: `Supabase error: ${error.message}`,
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Supabase connection successful!',
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Connection failed: ${err.message}`,
        });
      }
    }

    if (type === 'database') {
      // Test PostgreSQL connection
      if (!databaseUrl) {
        return NextResponse.json({
          success: false,
          error: 'Missing database URL',
        });
      }

      const pool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5000,
      });

      try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        await pool.end();

        return NextResponse.json({
          success: true,
          message: 'Database connection successful!',
          serverTime: result.rows[0].now,
        });
      } catch (err: any) {
        await pool.end();
        return NextResponse.json({
          success: false,
          error: `Database error: ${err.message}`,
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid connection type',
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}
