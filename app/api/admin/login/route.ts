import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { sendAdminLoginAlert } from '@/lib/telegram';

// Admin credentials file path
const ADMIN_CREDENTIALS_PATH = path.join(process.cwd(), '.admin-credentials.json');

interface AdminCredentials {
  username: string;
  password: string;
  displayName: string;
  email: string;
}

function getAdminCredentials(): AdminCredentials {
  // Default credentials
  const defaults: AdminCredentials = {
    username: process.env.ADMIN_USERNAME || 'khang',
    password: process.env.ADMIN_PASSWORD || 'Sushi08!',
    displayName: process.env.ADMIN_DISPLAY_NAME || 'Khang Nguyen',
    email: process.env.ADMIN_EMAIL || 'khang@aitravel.com',
  };

  // Try to read from file (allows runtime updates)
  try {
    if (fs.existsSync(ADMIN_CREDENTIALS_PATH)) {
      const fileContent = fs.readFileSync(ADMIN_CREDENTIALS_PATH, 'utf-8');
      const fileCredentials = JSON.parse(fileContent);
      return { ...defaults, ...fileCredentials };
    }
  } catch {
    // Ignore errors, use defaults
  }

  return defaults;
}

function saveAdminCredentials(credentials: Partial<AdminCredentials>): void {
  const current = getAdminCredentials();
  const updated = { ...current, ...credentials };
  fs.writeFileSync(ADMIN_CREDENTIALS_PATH, JSON.stringify(updated, null, 2));
}

export async function GET() {
  // Get admin info (for displaying in UI)
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const credentials = getAdminCredentials();
  return NextResponse.json({
    username: credentials.username,
    displayName: credentials.displayName,
    email: credentials.email,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const credentials = getAdminCredentials();

    if (username === credentials.username && password === credentials.password) {
      // Create a simple session token
      const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');

      // Set auth cookie
      const cookieStore = await cookies();
      cookieStore.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      // Send Telegram alert (non-blocking)
      sendAdminLoginAlert(credentials.displayName).catch((err) => {
        console.error('Failed to send Telegram login alert:', err);
      });

      return NextResponse.json({
        success: true,
        admin: {
          username: credentials.username,
          displayName: credentials.displayName,
          email: credentials.email,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // Change password or update admin info
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword, displayName, email } = body;
    const credentials = getAdminCredentials();

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required' },
          { status: 400 }
        );
      }

      if (currentPassword !== credentials.password) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }

      saveAdminCredentials({ password: newPassword });
    }

    // Update display name and email if provided
    if (displayName || email) {
      const updates: Partial<AdminCredentials> = {};
      if (displayName) updates.displayName = displayName;
      if (email) updates.email = email;
      saveAdminCredentials(updates);
    }

    const updatedCredentials = getAdminCredentials();
    return NextResponse.json({
      success: true,
      admin: {
        username: updatedCredentials.username,
        displayName: updatedCredentials.displayName,
        email: updatedCredentials.email,
      },
    });
  } catch (error: any) {
    console.error('Failed to update admin:', error);
    return NextResponse.json(
      { error: 'Failed to update', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Logout - clear session cookie
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return NextResponse.json({ success: true });
}
