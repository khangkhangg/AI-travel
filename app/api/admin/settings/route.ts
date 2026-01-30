import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'config', 'settings.json');

interface Settings {
  deepseekApiKey: string;
  chatEnabled: boolean;
  maxTokens: number;
  systemPrompt: string;
}

const DEFAULT_SETTINGS: Settings = {
  deepseekApiKey: '',
  chatEnabled: true,
  maxTokens: 4096,
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

// GET - retrieve settings
export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await loadSettings();

  // Mask the API key for security
  const maskedSettings = {
    ...settings,
    deepseekApiKey: settings.deepseekApiKey
      ? `${settings.deepseekApiKey.slice(0, 8)}...${settings.deepseekApiKey.slice(-4)}`
      : '',
    hasApiKey: !!settings.deepseekApiKey,
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

    await saveSettings(updatedSettings);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
