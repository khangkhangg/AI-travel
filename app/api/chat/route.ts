import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'config', 'settings.json');

interface Settings {
  deepseekApiKey: string;
  chatEnabled: boolean;
  maxTokens: number;
  systemPrompt: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI travel planning assistant for Wanderlust. Help users plan their dream trips by:
- Suggesting destinations based on their preferences
- Creating detailed day-by-day itineraries
- Recommending activities, restaurants, and accommodations
- Providing budget estimates and travel tips
- Being friendly, enthusiastic, and knowledgeable about travel

Always be helpful and provide actionable travel advice.`;

async function loadSettings(): Promise<Settings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      deepseekApiKey: '',
      chatEnabled: true,
      maxTokens: 2048,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await loadSettings();

    if (!settings.chatEnabled) {
      return NextResponse.json(
        { error: 'Chat is currently disabled' },
        { status: 503 }
      );
    }

    if (!settings.deepseekApiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Prepare messages for Deepseek API
    const apiMessages = [
      {
        role: 'system',
        content: settings.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Call Deepseek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: apiMessages,
        max_tokens: settings.maxTokens,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Deepseek API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get AI response. Please try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: assistantMessage,
      usage: data.usage,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
