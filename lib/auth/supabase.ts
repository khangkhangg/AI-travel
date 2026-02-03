import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { cache } from 'react';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// For client components
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Cache getUser per-request to reduce Supabase API calls
export const getUser = cache(async () => {
  const supabase = await createClient();
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    // Check for rate limit error (can be in error.message or error.code)
    const isRateLimited = error && (
      error.message?.toLowerCase().includes('rate limit') ||
      (error as any).code === 'over_request_rate_limit'
    );
    if (isRateLimited) {
      // Fall back to session when rate limited
      console.warn('[Auth] Rate limited on getUser, falling back to getSession');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    }
    return user;
  } catch (error: any) {
    const isRateLimited =
      error?.message?.toLowerCase().includes('rate limit') ||
      error?.code === 'over_request_rate_limit';
    if (isRateLimited) {
      // Fall back to session when rate limited
      console.warn('[Auth] Rate limited (exception), falling back to getSession');
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    }
    throw error;
  }
});

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
