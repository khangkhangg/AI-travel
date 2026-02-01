import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';
import { z } from 'zod';

const TravelerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0).max(120),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

// GET travelers for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      'SELECT generated_content FROM trips WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const travelers = result.rows[0].generated_content?.travelers || [];
    return NextResponse.json({ travelers });
  } catch (error: any) {
    console.error('Failed to fetch travelers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch travelers' },
      { status: 500 }
    );
  }
}

// POST add a traveler
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = TravelerSchema.parse(body);

    // Get current trip data
    const tripResult = await query(
      'SELECT generated_content FROM trips WHERE id = $1',
      [id]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const currentContent = tripResult.rows[0].generated_content || {};
    const travelers = currentContent.travelers || [];

    // Create new traveler
    const newTraveler = {
      id: crypto.randomUUID(),
      name: input.name,
      age: input.age,
      isChild: input.age < 12,
      email: input.email || undefined,
      phone: input.phone || undefined,
    };

    // Add to travelers array
    const updatedTravelers = [...travelers, newTraveler];
    const updatedContent = {
      ...currentContent,
      travelers: updatedTravelers,
    };

    // Update trip
    await query(
      'UPDATE trips SET generated_content = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedContent), id]
    );

    return NextResponse.json({ traveler: newTraveler, travelers: updatedTravelers }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add traveler:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add traveler' },
      { status: 500 }
    );
  }
}

// DELETE remove a traveler
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const travelerId = searchParams.get('travelerId');

    if (!travelerId) {
      return NextResponse.json({ error: 'Traveler ID required' }, { status: 400 });
    }

    // Get current trip data
    const tripResult = await query(
      'SELECT generated_content FROM trips WHERE id = $1',
      [id]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const currentContent = tripResult.rows[0].generated_content || {};
    const travelers = currentContent.travelers || [];

    // Remove traveler
    const updatedTravelers = travelers.filter((t: any) => t.id !== travelerId);

    if (updatedTravelers.length === travelers.length) {
      return NextResponse.json({ error: 'Traveler not found' }, { status: 404 });
    }

    const updatedContent = {
      ...currentContent,
      travelers: updatedTravelers,
    };

    // Update trip
    await query(
      'UPDATE trips SET generated_content = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedContent), id]
    );

    return NextResponse.json({ success: true, travelers: updatedTravelers });
  } catch (error: any) {
    console.error('Failed to remove traveler:', error);
    return NextResponse.json(
      { error: 'Failed to remove traveler' },
      { status: 500 }
    );
  }
}
