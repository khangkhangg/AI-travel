import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance for client-side
let supabaseInstance: SupabaseClient | null = null;

// For client components only - returns singleton instance
export function createBrowserSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}
