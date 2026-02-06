import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendTelegramMessage } from '@/lib/telegram';

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botToken, chatId } = await request.json();

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Bot token and chat ID are required' },
        { status: 400 }
      );
    }

    const message = `✅ <b>Test Message</b>

This is a test message from your Wanderlust admin dashboard.

If you see this, Telegram notifications are configured correctly!`;

    const result = await sendTelegramMessage({ botToken, chatId }, message);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Failed to send test Telegram message:', error);
    return NextResponse.json(
      { error: 'Failed to send test message', details: error.message },
      { status: 500 }
    );
  }
}
