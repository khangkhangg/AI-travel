import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'config', 'settings.json');
const ENV_FILE = path.join(process.cwd(), '.env');

interface Settings {
  deepseekApiKey: string;
  chatEnabled: boolean;
  maxTokens: number;
  systemPrompt: string;
  // Supabase Configuration
  supabaseUrl: string;
  supabaseAnonKey: string;
  // Database Configuration
  databaseUrl: string;
}

const DEFAULT_SETTINGS: Settings = {
  deepseekApiKey: '',
  chatEnabled: true,
  maxTokens: 4096,
  // Load from env as defaults
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  systemPrompt: `You are a helpful AI travel planning assistant for Wanderlust. Help users plan their dream trips with PRECISE and DETAILED itineraries.

When creating itineraries, ALWAYS include:

1. **Precise Times**: Use specific times (e.g., "9:00 AM", "2:30 PM", "8:00 PM") instead of vague periods like "morning" or "afternoon"

2. **Cost Estimates**: Include estimated costs for EVERY activity, meal, and attraction in USD. Example: "$25 per person" or "$50 total"

3. **Nightlife Options**: For trips longer than 1 day, suggest evening entertainment like:
   - Local bars or pubs
   - Night markets
   - Live music venues
   - Rooftop bars
   - Cultural performances
   - Night tours

4. **Detailed Activities**: Each activity should include:
   - Specific time (e.g., "10:00 AM")
   - Activity name
   - Location/address when relevant
   - Duration estimate
   - Cost per person
   - Brief description or tip

Format your itineraries as:
**Day 1: [Theme]**
* **9:00 AM:** Activity name - Description ($XX per person)
* **12:00 PM:** Lunch at [Restaurant] - Known for [specialty] ($XX per person)
* **2:00 PM:** Activity - Description ($XX per person)
* **7:00 PM:** Dinner at [Restaurant] ($XX per person)
* **9:00 PM:** Evening activity/nightlife option ($XX per person)

Before creating an itinerary, gather essential information:
- Destination
- Number of days
- Budget range
- Group size (adults and children with ages)
- Travel interests (food, culture, adventure, relaxation)
- Preferred accommodation location
- Travel method (flight, car, train)

Be friendly, enthusiastic, and provide insider tips that make trips memorable!`,
};

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

async function ensureConfigDir() {
  const configDir = path.dirname(SETTINGS_FILE);
  try {
    await fs.access(configDir);
  } catch {
    await fs.mkdir(configDir, { recursive: true });
  }
}

async function loadSettings(): Promise<Settings> {
  try {
    await ensureConfigDir();
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// Update .env file with new values
async function updateEnvFile(updates: Record<string, string>): Promise<boolean> {
  try {
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_FILE, 'utf-8');
    } catch {
      // .env doesn't exist, create new
      envContent = '';
    }

    const lines = envContent.split('\n');
    const updatedKeys = new Set<string>();

    // Update existing lines
    const updatedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;

      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
      if (match) {
        const key = match[1];
        if (key in updates) {
          updatedKeys.add(key);
          return `${key}=${updates[key]}`;
        }
      }
      return line;
    });

    // Add new keys that weren't in the file
    for (const [key, value] of Object.entries(updates)) {
      if (!updatedKeys.has(key)) {
        updatedLines.push(`${key}=${value}`);
      }
    }

    await fs.writeFile(ENV_FILE, updatedLines.join('\n'));
    return true;
  } catch (error) {
    console.error('Failed to update .env file:', error);
    return false;
  }
}

// GET - retrieve settings
export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await loadSettings();

  // Mask sensitive values for security
  const maskedSettings = {
    ...settings,
    deepseekApiKey: settings.deepseekApiKey
      ? `${settings.deepseekApiKey.slice(0, 8)}...${settings.deepseekApiKey.slice(-4)}`
      : '',
    hasApiKey: !!settings.deepseekApiKey,
    // Supabase - show URL, mask key
    supabaseUrl: settings.supabaseUrl || '',
    supabaseAnonKey: settings.supabaseAnonKey
      ? `${settings.supabaseAnonKey.slice(0, 12)}...${settings.supabaseAnonKey.slice(-8)}`
      : '',
    hasSupabaseConfig: !!(settings.supabaseUrl && settings.supabaseAnonKey),
    // Database - mask connection string
    databaseUrl: settings.databaseUrl
      ? settings.databaseUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
      : '',
    hasDatabaseConfig: !!settings.databaseUrl,
  };

  return NextResponse.json(maskedSettings);
}

// POST - update settings
export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const currentSettings = await loadSettings();

    const updatedSettings: Settings = {
      ...currentSettings,
      chatEnabled: body.chatEnabled ?? currentSettings.chatEnabled,
      maxTokens: body.maxTokens ?? currentSettings.maxTokens,
      systemPrompt: body.systemPrompt ?? currentSettings.systemPrompt,
    };

    // Only update API key if provided (not masked value)
    if (body.deepseekApiKey && !body.deepseekApiKey.includes('...')) {
      updatedSettings.deepseekApiKey = body.deepseekApiKey;
    }

    // Update Supabase URL if provided
    if (body.supabaseUrl !== undefined) {
      updatedSettings.supabaseUrl = body.supabaseUrl;
    }

    // Update Supabase Anon Key if provided (not masked value)
    if (body.supabaseAnonKey && !body.supabaseAnonKey.includes('...')) {
      updatedSettings.supabaseAnonKey = body.supabaseAnonKey;
    }

    // Update Database URL if provided (not masked value)
    if (body.databaseUrl && !body.databaseUrl.includes('***')) {
      updatedSettings.databaseUrl = body.databaseUrl;
    }

    await saveSettings(updatedSettings);

    // Also update .env file for environment variables
    const envUpdates: Record<string, string> = {};
    let envChanged = false;

    if (body.supabaseUrl && body.supabaseUrl !== process.env.NEXT_PUBLIC_SUPABASE_URL) {
      envUpdates['NEXT_PUBLIC_SUPABASE_URL'] = body.supabaseUrl;
      envChanged = true;
    }

    if (body.supabaseAnonKey && !body.supabaseAnonKey.includes('...')) {
      envUpdates['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = body.supabaseAnonKey;
      envChanged = true;
    }

    if (body.databaseUrl && !body.databaseUrl.includes('***')) {
      envUpdates['DATABASE_URL'] = body.databaseUrl;
      envChanged = true;
    }

    if (Object.keys(envUpdates).length > 0) {
      await updateEnvFile(envUpdates);
    }

    return NextResponse.json({
      success: true,
      envChanged,
      message: envChanged
        ? 'Settings saved. Restart the server for environment changes to take effect.'
        : 'Settings saved successfully.'
    });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
