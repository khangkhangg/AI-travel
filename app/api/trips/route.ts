import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { nanoid } from 'nanoid';
import { GeneratedTrip } from '@/lib/types/chat-session';

// Generate a unique share code
function generateShareCode(): string {
  return nanoid(10);
}

// GET - list user's trips
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT t.*,
        COALESCE(t.clone_count, 0) as clone_count,
        (SELECT COUNT(*) FROM trip_likes WHERE trip_id = t.id) as likes_count,
        (SELECT COUNT(*) FROM itinerary_items WHERE trip_id = t.id) as items_count
       FROM trips t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ trips: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

// POST - create new trip
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Variables that may be populated from either format
    let destination: string;
    let duration: string;
    let itinerary: any[];
    let travelers: any[];
    let generatedContent: any;

    // Extract common fields that work for both formats
    const { visibility = 'private', curatorInfo, chatHistory, aiMetrics } = body;

    // Check if this is the new GeneratedTrip format
    if (body.generatedTrip) {
      const gt = body.generatedTrip as GeneratedTrip;

      // Map to existing variables for compatibility
      destination = gt.metadata.destination;
      duration = `${gt.metadata.duration} days`;

      // Convert itinerary format
      itinerary = gt.itinerary.map(day => ({
        day: day.dayNumber,
        title: `Day ${day.dayNumber}`,
        activities: day.items.map(item => ({
          time: item.startTime || '',
          title: item.title,
          type: item.category,
          description: item.description || '',
          cost: item.estimatedCost || 0,
          location: item.location?.name || '',
        }))
      }));

      // Create travelers array from count (users will add names later)
      travelers = [];
      for (let i = 0; i < gt.metadata.travelers.adults; i++) {
        travelers.push({ name: `Traveler ${i + 1}`, age: 30, isChild: false });
      }
      for (let i = 0; i < gt.metadata.travelers.children; i++) {
        travelers.push({ name: `Child ${i + 1}`, age: 8, isChild: true });
      }

      // Include metadata and recommendations in generated_content
      generatedContent = {
        travelers,
        itinerary,
        metadata: gt.metadata,
        recommendations: gt.recommendations,
      };
    } else {
      // Old format - use directly from body
      destination = body.destination;
      duration = body.duration;
      itinerary = body.itinerary;
      travelers = body.travelers;
      generatedContent = { travelers, itinerary };
    }

    // Generate unique share code
    const shareCode = generateShareCode();
    const title = destination ? `Trip to ${destination}` : 'My Trip';

    // Look up ai_model_id if we have AI metrics with a model name
    let aiModelId = null;
    if (aiMetrics?.model) {
      const modelResult = await query(
        'SELECT id FROM ai_models WHERE name = $1 LIMIT 1',
        [aiMetrics.model]
      );
      if (modelResult.rows.length > 0) {
        aiModelId = modelResult.rows[0].id;
      }
    }

    // Create trip - use city column for destination since schema uses that
    // Include curator info fields if visibility is 'curated'
    // Include AI metrics if available
    const tripResult = await query(
      `INSERT INTO trips (
        user_id, title, city, description,
        visibility, share_code, generated_content, chat_history,
        curator_is_local, curator_years_lived, curator_experience,
        ai_model_id, tokens_used, total_cost,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *`,
      [
        user.id,
        title,
        destination || '',
        duration || '',
        visibility,
        shareCode,
        JSON.stringify(generatedContent),
        JSON.stringify(chatHistory || []),
        visibility === 'curated' ? curatorInfo?.isLocal : null,
        visibility === 'curated' ? curatorInfo?.yearsLived : null,
        visibility === 'curated' ? curatorInfo?.experience : null,
        aiModelId,
        aiMetrics?.tokensUsed || null,
        aiMetrics?.cost || null,
      ]
    );

    const trip = tripResult.rows[0];

    // Insert itinerary items
    if (itinerary && itinerary.length > 0) {
      for (const day of itinerary) {
        for (let i = 0; i < day.activities.length; i++) {
          const activity = day.activities[i];
          await query(
            `INSERT INTO itinerary_items (
              trip_id, day_number, order_index, title,
              description, category, time_slot, estimated_cost,
              location_name, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
            [
              trip.id,
              day.day,
              i,
              activity.title,
              activity.description || '',
              activity.type || 'activity',
              activity.time || '',
              activity.cost || 0,
              activity.location || '',
            ]
          );
        }
      }
    }

    // Insert travelers if provided
    if (travelers && travelers.length > 0) {
      for (const traveler of travelers) {
        await query(
          `INSERT INTO trip_travelers (
            trip_id, name, age, is_child, created_at
          ) VALUES ($1, $2, $3, $4, NOW())`,
          [trip.id, traveler.name, traveler.age, traveler.isChild || traveler.age < 12]
        );
      }
    }

    // Add user as owner in collaborators
    await query(
      `INSERT INTO trip_collaborators (trip_id, user_id, role, created_at)
       VALUES ($1, $2, 'owner', NOW())
       ON CONFLICT (trip_id, user_id) DO NOTHING`,
      [trip.id, user.id]
    );

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2000';
    const shareUrl = `${baseUrl}/shared/${shareCode}`;

    return NextResponse.json({
      trip,
      shareUrl,
      shareCode,
    });
  } catch (error: any) {
    console.error('Failed to create trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}
