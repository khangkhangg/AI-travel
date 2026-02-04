import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/admin/models/vision
 *
 * Fetches all vision AI models from the database
 */
export async function GET() {
  try {
    const result = await query(
      `SELECT id, name, display_name, provider, model_id, api_endpoint, is_active, cost_per_1k_tokens, capabilities
       FROM ai_models
       WHERE model_type = 'vision'
       ORDER BY priority ASC`
    );

    return NextResponse.json({
      models: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        provider: row.provider,
        modelId: row.model_id,
        apiEndpoint: row.api_endpoint,
        isActive: row.is_active,
        costPer1kTokens: parseFloat(row.cost_per_1k_tokens),
        capabilities: row.capabilities,
      })),
    });
  } catch (error: any) {
    console.error('Failed to fetch vision models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vision models' },
      { status: 500 }
    );
  }
}
