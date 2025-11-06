import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { canGenerateTrip, incrementTripCount, getUser as getDBUser, createUser } from '@/lib/db/users';
import { getAIProvider, getDefaultAIModel } from '@/lib/ai/models';
import { query } from '@/lib/db';
import { z } from 'zod';

const TripInputSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  numPeople: z.number().min(1),
  budgetPerPerson: z.number().optional(),
  city: z.string().optional(),
  budgetRange: z.string().optional(),
  travelType: z.array(z.string()),
  ageRange: z.string().optional(),
  description: z.string().optional(),
  aiModel: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in our database
    let dbUser = await getDBUser(user.id);
    if (!dbUser) {
      dbUser = await createUser({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      });
    }

    // Check if user can generate a trip
    const { canGenerate, reason } = await canGenerateTrip(user.id);
    if (!canGenerate) {
      return NextResponse.json(
        { error: reason || 'Trip generation limit reached' },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const input = TripInputSchema.parse(body);

    // Get AI model to use
    const modelName = input.aiModel || await getDefaultAIModel();
    const provider = await getAIProvider(modelName);

    // Generate itinerary
    const startTime = Date.now();
    const result = await provider.generateItinerary(input);
    const generationTime = Date.now() - startTime;

    // Parse the generated content
    let generatedContent;
    try {
      // Clean up markdown code blocks if present
      let cleanedContent = result.content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '');
      }
      generatedContent = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('Failed to parse AI response:', result.content);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Get AI model info
    const modelInfo = await query(
      'SELECT * FROM ai_models WHERE name = $1',
      [modelName]
    );
    const aiModel = modelInfo.rows[0];

    // Calculate cost
    const cost = aiModel?.cost_per_1k_tokens
      ? (result.tokensUsed / 1000) * parseFloat(aiModel.cost_per_1k_tokens)
      : 0;

    // Save trip to database
    const tripResult = await query(
      `INSERT INTO trips (
        user_id, title, start_date, end_date, num_people,
        budget_per_person, city, budget_range, travel_type,
        age_range, description, ai_model_id, generated_content,
        total_cost, tokens_used, generation_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      [
        user.id,
        generatedContent.title || 'My Trip',
        input.startDate,
        input.endDate,
        input.numPeople,
        input.budgetPerPerson || null,
        input.city || null,
        input.budgetRange || null,
        input.travelType,
        input.ageRange || null,
        input.description || null,
        aiModel?.id || null,
        generatedContent,
        generatedContent.totalEstimatedCost || null,
        result.tokensUsed,
        generationTime
      ]
    );

    const tripId = tripResult.rows[0].id;

    // Save itinerary items
    if (generatedContent.days && Array.isArray(generatedContent.days)) {
      for (const day of generatedContent.days) {
        if (day.activities && Array.isArray(day.activities)) {
          for (let i = 0; i < day.activities.length; i++) {
            const activity = day.activities[i];
            await query(
              `INSERT INTO itinerary_items (
                trip_id, day_number, order_index, time_slot, title,
                description, location_name, location_address,
                category, estimated_cost, estimated_duration_minutes, notes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                tripId,
                day.dayNumber,
                i,
                activity.time || null,
                activity.title,
                activity.description || null,
                activity.location?.name || null,
                activity.location?.address || null,
                activity.category || 'activity',
                activity.estimatedCost || null,
                activity.estimatedDuration || null,
                activity.tips || null
              ]
            );
          }
        }
      }
    }

    // Add user as trip owner
    await query(
      `INSERT INTO trip_collaborators (trip_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [tripId, user.id]
    );

    // Log performance metrics
    await query(
      `INSERT INTO model_performance (
        trip_id, ai_model_id, response_time_ms, tokens_used, cost
      ) VALUES ($1, $2, $3, $4, $5)`,
      [tripId, aiModel?.id || null, generationTime, result.tokensUsed, cost]
    );

    // Increment user's trip count
    await incrementTripCount(user.id);

    return NextResponse.json({
      success: true,
      tripId,
      trip: {
        id: tripId,
        ...generatedContent,
        tokensUsed: result.tokensUsed,
        cost,
        generationTimeMs: generationTime
      }
    });

  } catch (error: any) {
    console.error('Trip generation error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate trip' },
      { status: 500 }
    );
  }
}
