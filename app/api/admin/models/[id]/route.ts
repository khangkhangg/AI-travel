import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { is_active } = body;

    await query(
      `UPDATE ai_models SET is_active = $1, updated_at = NOW() WHERE id = $2`,
      [is_active, params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update model:', error);
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    );
  }
}
