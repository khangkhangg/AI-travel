import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// Helper function to create system messages for suggestion events
async function createSuggestionSystemMessage(
  tripId: string,
  suggestionId: string,
  messageType: string,
  suggestion: any,
  userInfo: any,
  activityInfo?: any
) {
  try {
    const metadata = {
      suggestion_id: suggestionId,
      suggester_id: userInfo.id,
      suggester_name: userInfo.full_name || userInfo.user_name,
      suggester_avatar: userInfo.avatar_url || userInfo.user_avatar,
      activity_id: activityInfo?.id,
      activity_title: activityInfo?.title,
      place_name: suggestion.place_name,
      reason: suggestion.reason,
      day_number: suggestion.day_number,
      category: suggestion.category,
      source_url: suggestion.source_url,
      location_lat: suggestion.location_lat,
      location_lng: suggestion.location_lng,
      location_address: suggestion.location_address,
      previous_status: suggestion.status,
    };

    let content = '';
    switch (messageType) {
      case 'suggestion_created':
        content = `${userInfo.full_name || userInfo.user_name || 'Someone'} suggested "${suggestion.place_name}"${activityInfo ? ` for "${activityInfo.title}"` : ''}`;
        break;
      case 'suggestion_used':
        content = `Marked suggestion "${suggestion.place_name}" from ${userInfo.full_name || userInfo.user_name || 'a user'} as used`;
        break;
      case 'suggestion_dismissed':
        content = `Dismissed suggestion "${suggestion.place_name}" from ${userInfo.full_name || userInfo.user_name || 'a user'}`;
        break;
      default:
        content = `Suggestion ${messageType.replace('suggestion_', '')} for "${suggestion.place_name}"`;
    }

    await query(
      `INSERT INTO discussions (trip_id, itinerary_item_id, user_id, content, message_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        tripId,
        activityInfo?.id || null,
        userInfo.id,
        content,
        messageType,
        JSON.stringify(metadata),
      ]
    );
  } catch (error) {
    console.error('Failed to create suggestion system message:', error);
    // Don't fail the main operation if system message creation fails
  }
}

// GET - Fetch suggestions for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activity_id');
    const status = searchParams.get('status');

    // Build query with optional filters (without user_badges to avoid table existence issues)
    let queryStr = `
      SELECT
        s.*,
        u.full_name as user_name,
        u.avatar_url as user_avatar
      FROM trip_suggestions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.trip_id = $1
    `;
    const values: any[] = [id];
    let paramIndex = 2;

    if (activityId) {
      queryStr += ` AND s.activity_id = $${paramIndex++}`;
      values.push(activityId);
    }

    if (status) {
      queryStr += ` AND s.status = $${paramIndex++}`;
      values.push(status);
    }

    queryStr += ' ORDER BY s.created_at DESC';

    const result = await query(queryStr, values);

    // Fetch user badges separately (gracefully handle if table doesn't exist)
    const suggestions = await Promise.all(
      result.rows.map(async (suggestion) => {
        let userBadges: any[] = [];
        try {
          const badgesResult = await query(
            `SELECT badge_type, metadata FROM user_badges WHERE user_id = $1`,
            [suggestion.user_id]
          );
          userBadges = badgesResult.rows;
        } catch {
          // Table doesn't exist yet
        }
        return {
          ...suggestion,
          user_badges: userBadges,
        };
      })
    );

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

// POST - Create a new suggestion
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

    // Check if trip exists and user is not the owner
    const tripCheck = await query(
      'SELECT user_id, visibility FROM trips WHERE id = $1',
      [id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const trip = tripCheck.rows[0];

    // Only allow suggestions on public, curated, or marketplace trips
    if (!['public', 'curated', 'marketplace'].includes(trip.visibility)) {
      return NextResponse.json(
        { error: 'Cannot suggest on private trips' },
        { status: 403 }
      );
    }

    // Trip owner cannot suggest on their own trip
    if (trip.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot suggest on your own trip' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { activity_id, day_number, place_name, reason, category, location_lat, location_lng, source_url, location_address } = body;

    if (!place_name || !reason) {
      return NextResponse.json(
        { error: 'Place name and reason are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO trip_suggestions
        (trip_id, user_id, activity_id, day_number, place_name, reason, category, location_lat, location_lng, source_url, location_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, user.id, activity_id || null, day_number || null, place_name, reason, category || null, location_lat || null, location_lng || null, source_url || null, location_address || null]
    );

    // Fetch user details for response
    const userResult = await query(
      `SELECT full_name as user_name, avatar_url as user_avatar FROM users WHERE id = $1`,
      [user.id]
    );

    // Fetch user badges (gracefully handle if table doesn't exist)
    let userBadges: any[] = [];
    try {
      const badgesResult = await query(
        `SELECT badge_type, metadata FROM user_badges WHERE user_id = $1`,
        [user.id]
      );
      userBadges = badgesResult.rows;
    } catch {
      // Table doesn't exist yet, continue with empty badges
    }

    // Get activity info if activity_id exists
    let activityInfo = null;
    if (activity_id) {
      const activityResult = await query(
        'SELECT id, title FROM itinerary_items WHERE id = $1',
        [activity_id]
      );
      if (activityResult.rows.length > 0) {
        activityInfo = activityResult.rows[0];
      }
    }

    // Create system message for suggestion creation
    const userInfo = {
      id: user.id,
      full_name: userResult.rows[0]?.user_name,
      avatar_url: userResult.rows[0]?.user_avatar,
    };

    await createSuggestionSystemMessage(
      id,
      result.rows[0].id,
      'suggestion_created',
      result.rows[0],
      userInfo,
      activityInfo
    );

    return NextResponse.json({
      suggestion: {
        ...result.rows[0],
        user_name: userResult.rows[0]?.user_name,
        user_avatar: userResult.rows[0]?.user_avatar,
        user_badges: userBadges,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create suggestion:', error.message, error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to create suggestion' },
      { status: 500 }
    );
  }
}

// PATCH - Update suggestion status (trip owner only)
export async function PATCH(
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
    const { suggestion_id, status } = body;

    if (!suggestion_id || !status) {
      return NextResponse.json(
        { error: 'Suggestion ID and status are required' },
        { status: 400 }
      );
    }

    if (!['pending', 'used', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if user is trip owner
    const tripCheck = await query(
      `SELECT t.user_id FROM trips t
       JOIN trip_suggestions s ON s.trip_id = t.id
       WHERE s.id = $1 AND t.id = $2`,
      [suggestion_id, id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    if (tripCheck.rows[0].user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only trip owner can update suggestion status' },
        { status: 403 }
      );
    }

    const result = await query(
      `UPDATE trip_suggestions SET status = $1 WHERE id = $2 RETURNING *`,
      [status, suggestion_id]
    );

    // Get suggestion with user info for system message
    const suggestionInfo = await query(
      `SELECT s.*, u.id as user_id, u.full_name as user_name, u.avatar_url as user_avatar
       FROM trip_suggestions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [suggestion_id]
    );

    if (suggestionInfo.rows.length > 0) {
      const suggestion = suggestionInfo.rows[0];

      // Get activity info if activity_id exists
      let activityInfo = null;
      if (suggestion.activity_id) {
        const activityResult = await query(
          'SELECT id, title FROM itinerary_items WHERE id = $1',
          [suggestion.activity_id]
        );
        if (activityResult.rows.length > 0) {
          activityInfo = activityResult.rows[0];
        }
      }

      // Create system message for status change
      const messageType = `suggestion_${status}`;
      const userInfo = {
        id: suggestion.user_id,
        full_name: suggestion.user_name,
        avatar_url: suggestion.user_avatar,
      };

      await createSuggestionSystemMessage(
        id,
        suggestion_id,
        messageType,
        suggestion,
        userInfo,
        activityInfo
      );
    }

    return NextResponse.json({ suggestion: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to update suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a suggestion (only by suggestion author)
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
    const suggestionId = searchParams.get('suggestion_id');

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      );
    }

    // Only allow deletion by the suggestion author
    const result = await query(
      `DELETE FROM trip_suggestions
       WHERE id = $1 AND trip_id = $2 AND user_id = $3
       RETURNING id`,
      [suggestionId, id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Suggestion not found or access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to delete suggestion' },
      { status: 500 }
    );
  }
}
