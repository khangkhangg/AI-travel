import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - list services for a business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      'SELECT * FROM business_services WHERE business_id = $1 AND is_active = true ORDER BY created_at DESC',
      [id]
    );

    return NextResponse.json({ services: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

// POST - add new service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const businessCheck = await query(
      'SELECT user_id FROM businesses WHERE id = $1',
      [id]
    );

    if (businessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (businessCheck.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { service_name, description, price_type, base_price, currency, add_ons } = body;

    if (!service_name) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO business_services (
        business_id, service_name, description, price_type, base_price, currency, add_ons, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        id,
        service_name,
        description || '',
        price_type || 'fixed',
        base_price || 0,
        currency || 'USD',
        JSON.stringify(add_ons || [])
      ]
    );

    return NextResponse.json({ service: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to add service:', error);
    return NextResponse.json({ error: 'Failed to add service' }, { status: 500 });
  }
}
