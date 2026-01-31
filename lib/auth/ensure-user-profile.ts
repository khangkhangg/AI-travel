/**
 * Ensures a user profile exists in the local database.
 * Called after Supabase Auth operations to sync the user record.
 *
 * This handles the case where:
 * - User exists in Supabase Auth but not in local DB (registration failed)
 * - User signed up via OAuth and profile wasn't created
 */

interface UserData {
  id: string;
  email: string;
  fullName?: string;
}

/**
 * Client-side: Ensures user profile exists by calling the API
 */
export async function ensureUserProfileClient(user: UserData): Promise<boolean> {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.fullName || '',
      }),
    });

    // 200 = created or already exists, both are success
    return response.ok;
  } catch (error) {
    console.warn('Failed to ensure user profile:', error);
    return false;
  }
}

/**
 * Server-side: Ensures user profile exists by directly querying DB
 */
export async function ensureUserProfileServer(
  user: UserData,
  query: (text: string, params?: any[]) => Promise<any>
): Promise<boolean> {
  try {
    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE id = $1', [user.id]);

    if (existing.rows.length > 0) {
      return true; // Already exists
    }

    // Create user profile
    await query(
      `INSERT INTO users (id, email, full_name, email_verified, verification_deadline)
       VALUES ($1, $2, $3, FALSE, NOW() + INTERVAL '30 days')
       ON CONFLICT (id) DO NOTHING`,
      [user.id, user.email, user.fullName || null]
    );

    return true;
  } catch (error) {
    console.warn('Failed to ensure user profile (server):', error);
    return false;
  }
}
