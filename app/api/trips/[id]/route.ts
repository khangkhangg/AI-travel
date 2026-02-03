import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();

    // Get trip details
    const tripResult = await query(
      `SELECT
        t.*,
        u.email as owner_email,
        u.full_name as owner_name,
        u.username as owner_username,
        u.avatar_url as owner_avatar,
        u.bio as owner_bio,
        u.location as owner_location,
        m.display_name as ai_model_name,
        (SELECT COUNT(*) FROM trip_likes WHERE trip_id = t.id) as likes_count,
        ${user ? `(SELECT COUNT(*) > 0 FROM trip_likes WHERE trip_id = t.id AND user_id = '${user.id}') as is_liked,` : 'false as is_liked,'}
        ${user ? `(SELECT role FROM trip_collaborators WHERE trip_id = t.id AND user_id = '${user.id}') as user_role` : 'null as user_role'}
       FROM trips t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN ai_models m ON t.ai_model_id = m.id
       WHERE t.id = $1`,
      [id]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const trip = tripResult.rows[0];

    // Check access permissions
    const isOwner = user && trip.user_id === user.id;
    const isCollaborator = trip.user_role !== null;
    const isPublicOrCurated = trip.visibility === 'public' || trip.visibility === 'curated';

    if (!isPublicOrCurated && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Increment view count
    await query(
      'UPDATE trips SET views_count = views_count + 1 WHERE id = $1',
      [id]
    );

    // Get itinerary items with votes and comment counts
    const itemsResult = await query(
      `SELECT
        i.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', v.id,
            'user_id', v.user_id,
            'vote', v.vote
          ))
          FROM activity_votes v
          WHERE v.itinerary_item_id = i.id),
          '[]'
        ) as votes,
        (SELECT COUNT(*) FROM discussions d WHERE d.itinerary_item_id = i.id) as comment_count
       FROM itinerary_items i
       WHERE i.trip_id = $1
       ORDER BY i.day_number, i.order_index`,
      [id]
    );

    // Get collaborators
    const collaboratorsResult = await query(
      `SELECT tc.*, u.email, u.full_name, u.avatar_url
       FROM trip_collaborators tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.trip_id = $1`,
      [id]
    );

    // Get creator badges (gracefully handle if table doesn't exist)
    let badges: any[] = [];
    try {
      const badgesResult = await query(
        `SELECT badge_type, metadata, earned_at
         FROM user_badges
         WHERE user_id = $1
         ORDER BY earned_at DESC`,
        [trip.user_id]
      );
      badges = badgesResult.rows;
    } catch {
      // Table doesn't exist yet, continue with empty badges
    }

    // Get creator payment links (gracefully handle if table doesn't exist)
    let paymentLinks: any[] = [];
    try {
      const paymentLinksResult = await query(
        `SELECT platform, value, is_primary
         FROM user_payment_links
         WHERE user_id = $1
         ORDER BY is_primary DESC, created_at ASC`,
        [trip.user_id]
      );
      paymentLinks = paymentLinksResult.rows;
    } catch {
      // Table doesn't exist yet, continue with empty payment links
    }

    // Get creator stats (trip count, countries visited)
    let tripCount = 0;
    let countriesCount = 0;
    try {
      const statsResult = await query(
        `SELECT COUNT(*) as trip_count FROM trips WHERE user_id = $1 AND visibility IN ('public', 'curated')`,
        [trip.user_id]
      );
      tripCount = parseInt(statsResult.rows[0]?.trip_count) || 0;
    } catch {
      // Continue with 0
    }

    try {
      const countriesResult = await query(
        `SELECT COUNT(DISTINCT country) as countries_count FROM user_travel_history WHERE user_id = $1`,
        [trip.user_id]
      );
      countriesCount = parseInt(countriesResult.rows[0]?.countries_count) || 0;
    } catch {
      // Table doesn't exist yet, continue with 0
    }

    // Build creator object
    const creator = {
      id: trip.user_id,
      name: trip.owner_name || 'Trip Creator',
      username: trip.owner_username,
      avatar_url: trip.owner_avatar,
      bio: trip.owner_bio,
      location: trip.owner_location,
      badges,
      trip_count: tripCount,
      countries_count: countriesCount,
    };

    return NextResponse.json({
      trip: {
        ...trip,
        itinerary_items: itemsResult.rows,
        collaborators: collaboratorsResult.rows,
        creator,
        payment_links: paymentLinks,
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}

// PATCH update trip
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
    const {
      title, visibility, curatorInfo, chatHistory, itinerary, travelers, destination,
      start_date,
      marketplace_needs, marketplace_budget_min, marketplace_budget_max, marketplace_notes,
      aiMetrics
    } = body;

    // Check if user has edit permissions
    const permissionCheck = await query(
      `SELECT tc.role FROM trip_collaborators tc
       WHERE tc.trip_id = $1 AND tc.user_id = $2 AND tc.role IN ('owner', 'editor')`,
      [id, user.id]
    );

    if (permissionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }

    if (destination !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(destination);
    }

    if (start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(start_date || null);
    }

    if (visibility !== undefined) {
      updates.push(`visibility = $${paramIndex++}`);
      values.push(visibility);
    }

    if (chatHistory !== undefined) {
      updates.push(`chat_history = $${paramIndex++}`);
      values.push(JSON.stringify(chatHistory));
    }

    if (itinerary !== undefined || travelers !== undefined) {
      // Get current generated_content to merge
      const currentResult = await query('SELECT generated_content FROM trips WHERE id = $1', [id]);
      const currentContent = currentResult.rows[0]?.generated_content || {};

      const newContent = {
        ...currentContent,
        ...(itinerary !== undefined && { itinerary }),
        ...(travelers !== undefined && { travelers }),
      };
      updates.push(`generated_content = $${paramIndex++}`);
      values.push(JSON.stringify(newContent));
    }

    // Handle curator info fields for 'curated' visibility
    if (curatorInfo && visibility === 'curated') {
      if (curatorInfo.isLocal) {
        updates.push(`curator_is_local = $${paramIndex++}`);
        values.push(curatorInfo.isLocal);
      }
      if (curatorInfo.yearsLived) {
        updates.push(`curator_years_lived = $${paramIndex++}`);
        values.push(curatorInfo.yearsLived);
      }
      if (curatorInfo.experience) {
        updates.push(`curator_experience = $${paramIndex++}`);
        values.push(curatorInfo.experience);
      }
    } else if (visibility && visibility !== 'curated') {
      // Clear curator fields if switching away from curated
      updates.push(`curator_is_local = NULL`);
      updates.push(`curator_years_lived = NULL`);
      updates.push(`curator_experience = NULL`);
    }

    // Handle marketplace fields for 'marketplace' visibility
    if (visibility === 'marketplace') {
      if (marketplace_needs !== undefined) {
        updates.push(`marketplace_needs = $${paramIndex++}`);
        values.push(JSON.stringify(marketplace_needs));
      }
      if (marketplace_budget_min !== undefined) {
        updates.push(`marketplace_budget_min = $${paramIndex++}`);
        values.push(marketplace_budget_min);
      }
      if (marketplace_budget_max !== undefined) {
        updates.push(`marketplace_budget_max = $${paramIndex++}`);
        values.push(marketplace_budget_max);
      }
      if (marketplace_notes !== undefined) {
        updates.push(`marketplace_notes = $${paramIndex++}`);
        values.push(marketplace_notes);
      }
    } else if (visibility && visibility !== 'marketplace') {
      // Clear marketplace fields if switching away from marketplace
      updates.push(`marketplace_needs = NULL`);
      updates.push(`marketplace_budget_min = NULL`);
      updates.push(`marketplace_budget_max = NULL`);
      updates.push(`marketplace_notes = NULL`);
    }

    // Handle AI metrics update
    if (aiMetrics) {
      if (aiMetrics.tokensUsed !== undefined) {
        updates.push(`tokens_used = $${paramIndex++}`);
        values.push(aiMetrics.tokensUsed);
      }
      if (aiMetrics.cost !== undefined) {
        updates.push(`total_cost = $${paramIndex++}`);
        values.push(aiMetrics.cost);
      }
      // Look up ai_model_id if we have a model name
      if (aiMetrics.model) {
        const modelResult = await query(
          'SELECT id FROM ai_models WHERE name = $1 LIMIT 1',
          [aiMetrics.model]
        );
        if (modelResult.rows.length > 0) {
          updates.push(`ai_model_id = $${paramIndex++}`);
          values.push(modelResult.rows[0].id);
        }
      }
    }

    // Allow empty updates if we're just refreshing the trip
    if (updates.length === 0 && !chatHistory && !itinerary && !travelers && !marketplace_needs && !aiMetrics) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    if (updates.length === 0) {
      // Only generated_content updates, still need to return current trip
      const result = await query('SELECT * FROM trips WHERE id = $1', [id]);
      return NextResponse.json({ trip: result.rows[0] });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE trips SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return NextResponse.json({ trip: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to update trip:', error);
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    );
  }
}

// DELETE trip
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

    // Only owner can delete
    const result = await query(
      `DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
