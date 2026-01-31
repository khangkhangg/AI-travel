import { createClient } from '@/lib/auth/supabase';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create or update user in our database
      const user = data.user;

      try {
        // Check if user exists
        const existing = await query('SELECT id FROM users WHERE id = $1', [user.id]);

        if (existing.rows.length === 0) {
          // Create new user with 30-day verification deadline
          await query(
            `INSERT INTO users (id, email, full_name, avatar_url, email_verified, verification_deadline)
             VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')`,
            [
              user.id,
              user.email,
              user.user_metadata?.full_name || user.user_metadata?.name || null,
              user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              user.email_confirmed_at ? true : false,
            ]
          );
        } else {
          // Update existing user with latest info from OAuth
          await query(
            `UPDATE users SET
              full_name = COALESCE($2, full_name),
              avatar_url = COALESCE($3, avatar_url),
              email_verified = COALESCE($4, email_verified),
              updated_at = NOW()
             WHERE id = $1`,
            [
              user.id,
              user.user_metadata?.full_name || user.user_metadata?.name,
              user.user_metadata?.avatar_url || user.user_metadata?.picture,
              user.email_confirmed_at ? true : false,
            ]
          );
        }
      } catch (err) {
        console.error('Failed to sync user to database:', err);
        // Continue anyway - auth was successful
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
