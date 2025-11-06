import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Remove default from all models
    await client.query('UPDATE ai_models SET is_default = false');

    // Set new default
    await client.query(
      'UPDATE ai_models SET is_default = true WHERE id = $1',
      [params.id]
    );

    await client.query('COMMIT');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to set default model:', error);
    return NextResponse.json(
      { error: 'Failed to set default model' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
