import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton instance for client-side with cookie support
let supabaseInstance: SupabaseClient | null = null;

// For client components only - returns singleton instance with cookie support
// Uses @supabase/ssr to ensure auth tokens are stored in cookies (not just localStorage)
// This enables server-side API routes to read the session
export function createBrowserSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}
