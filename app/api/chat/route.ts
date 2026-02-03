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

IMPORTANT: When you identify or confirm any trip details from the conversation, include a hidden metadata block at the END of your response in this exact format:

<!--TRIP_DATA
destination: [city/country name if mentioned]
duration: [number of days if mentioned]
budget: [budget amount with $ if mentioned]
travelers: [number of travelers if mentioned]
TRIP_DATA-->

Only include fields that have been explicitly mentioned or confirmed. This helps the UI display trip details to the user.

Example: If user says "I want to visit Tokyo for 5 days", end your response with:
<!--TRIP_DATA
destination: Tokyo
duration: 5 days
TRIP_DATA-->

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

    // Calculate tokens used and cost
    const tokensUsed = data.usage?.total_tokens || 0;
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;

    // Deepseek pricing: ~$0.14/1M input tokens, ~$0.28/1M output tokens (estimate)
    const inputCost = (promptTokens / 1000000) * 0.14;
    const outputCost = (completionTokens / 1000000) * 0.28;
    const cost = inputCost + outputCost;

    return NextResponse.json({
      message: assistantMessage,
      usage: data.usage,
      aiMetrics: {
        model: 'deepseek-chat',
        provider: 'deepseek',
        tokensUsed,
        promptTokens,
        completionTokens,
        cost,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
