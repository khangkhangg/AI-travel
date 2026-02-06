/**
 * Telegram notification utility
 */

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export async function sendTelegramMessage(
  config: TelegramConfig,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const { botToken, chatId } = config;

  if (!botToken || !chatId) {
    return { success: false, error: 'Missing bot token or chat ID' };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      return { success: false, error: data.description || 'Unknown error' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send message' };
  }
}

export async function getTelegramConfig(): Promise<TelegramConfig | null> {
  // This is for server-side use - import query from db
  try {
    const { query } = await import('@/lib/db');
    const result = await query(
      'SELECT value FROM site_settings WHERE key = $1',
      ['telegram_config']
    );

    if (result.rows.length === 0) {
      return null;
    }

    const config = result.rows[0].value;
    if (!config || !config.botToken || !config.chatId) {
      return null;
    }

    return {
      botToken: config.botToken,
      chatId: config.chatId,
    };
  } catch {
    return null;
  }
}

export async function sendAdminLoginAlert(adminName: string): Promise<void> {
  const config = await getTelegramConfig();
  if (!config) {
    return;
  }

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const message = `🔐 <b>Admin Login Alert</b>

<b>User:</b> ${adminName}
<b>Time:</b> ${timestamp}

Someone just logged into the admin dashboard.`;

  await sendTelegramMessage(config, message);
}
