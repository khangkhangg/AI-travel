import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'config', 'settings.json');

interface PublicSettings {
  tripCategoriesEnabled: boolean;
  popularDestinationsEnabled: boolean;
  packagesTabEnabled: boolean;
  tripDetailsEnabled: boolean;
}

const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  tripCategoriesEnabled: true,
  popularDestinationsEnabled: true,
  packagesTabEnabled: true,
  tripDetailsEnabled: true,
};

async function loadPublicSettings(): Promise<PublicSettings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);
    return {
      tripCategoriesEnabled: settings.tripCategoriesEnabled ?? true,
      popularDestinationsEnabled: settings.popularDestinationsEnabled ?? true,
      packagesTabEnabled: settings.packagesTabEnabled ?? true,
      tripDetailsEnabled: settings.tripDetailsEnabled ?? true,
    };
  } catch {
    return DEFAULT_PUBLIC_SETTINGS;
  }
}

// GET - retrieve public settings (no auth required)
export async function GET() {
  const settings = await loadPublicSettings();
  return NextResponse.json(settings);
}
