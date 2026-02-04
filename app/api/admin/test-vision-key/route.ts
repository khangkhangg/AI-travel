import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { testVisionApiKey } from '@/lib/ai/vision-models';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

/**
 * POST /api/admin/test-vision-key
 *
 * Tests if a vision AI API key is valid by making a test request
 */
export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    if (!['deepseek', 'alibaba', 'zhipu'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be deepseek, alibaba, or zhipu' },
        { status: 400 }
      );
    }

    const result = await testVisionApiKey(provider, apiKey);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API key test error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
