import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - Get single tour by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try by ID first, then by slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const tourResult = await query(
      `SELECT t.*,
        tg.id as guide_id,
        tg.business_name,
        tg.bio as guide_bio,
        tg.languages,
        tg.years_experience,
        tg.is_verified,
        tg.rating as guide_rating,
        tg.total_reviews as guide_total_reviews,
        u.full_name as guide_name,
        u.avatar_url as guide_avatar
       FROM tours t
       JOIN tour_guides tg ON tg.id = t.guide_id
       JOIN users u ON u.id = tg.user_id
       WHERE ${isUUID ? 't.id = $1' : 't.slug = $1'}`,
      [id]
    );

    if (tourResult.rows.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const row = tourResult.rows[0];

    // Increment view count
    await query('UPDATE tours SET views_count = views_count + 1 WHERE id = $1', [row.id]);

    // Get images
    const imagesResult = await query(
      'SELECT * FROM tour_images WHERE tour_id = $1 ORDER BY sort_order',
      [row.id]
    );

    // Get tags
    const tagsResult = await query(
      `SELECT tt.* FROM tour_tags tt
       JOIN tour_tag_mappings ttm ON ttm.tag_id = tt.id
       WHERE ttm.tour_id = $1`,
      [row.id]
    );

    // Get activities
    const activitiesResult = await query(
      'SELECT * FROM tour_activities WHERE tour_id = $1 ORDER BY day_number, order_index',
      [row.id]
    );

    const tour = {
      id: row.id,
      guideId: row.guide_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      highlights: row.highlights || [],
      city: row.city,
      country: row.country,
      meetingPoint: row.meeting_point,
      meetingPointLat: row.meeting_point_lat,
      meetingPointLng: row.meeting_point_lng,
      durationDays: row.duration_days,
      durationHours: row.duration_hours,
      pricePerPerson: parseFloat(row.price_per_person),
      priceCurrency: row.price_currency,
      maxGroupSize: row.max_group_size,
      minGroupSize: row.min_group_size,
      whatIncluded: row.what_included || [],
      whatNotIncluded: row.what_not_included || [],
      requirements: row.requirements || [],
      notes: row.notes,
      instructions: row.instructions,
      cancellationPolicy: row.cancellation_policy,
      status: row.status,
      visibility: row.visibility,
      isFeatured: row.is_featured,
      viewsCount: row.views_count + 1,
      bookingsCount: row.bookings_count,
      rating: parseFloat(row.rating) || 0,
      reviewsCount: row.reviews_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
      guide: {
        id: row.guide_id,
        businessName: row.business_name,
        bio: row.guide_bio,
        languages: row.languages || [],
        yearsExperience: row.years_experience,
        isVerified: row.is_verified,
        rating: parseFloat(row.guide_rating) || 0,
        totalReviews: row.guide_total_reviews,
        user: {
          fullName: row.guide_name,
          avatarUrl: row.guide_avatar,
        },
      },
      images: imagesResult.rows.map(img => ({
        id: img.id,
        url: img.url,
        altText: img.alt_text,
        caption: img.caption,
        isCover: img.is_cover,
        sortOrder: img.sort_order,
      })),
      tags: tagsResult.rows.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        icon: tag.icon,
        color: tag.color,
      })),
      activities: activitiesResult.rows.map(act => ({
        id: act.id,
        dayNumber: act.day_number,
        orderIndex: act.order_index,
        timeStart: act.time_start,
        timeEnd: act.time_end,
        title: act.title,
        description: act.description,
        location: act.location,
        durationMinutes: act.duration_minutes,
        activityType: act.activity_type,
        isOptional: act.is_optional,
        extraCost: act.extra_cost ? parseFloat(act.extra_cost) : undefined,
      })),
    };

    return NextResponse.json({ tour });
  } catch (error: any) {
    console.error('Failed to fetch tour:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update tour (owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check ownership
    const ownerCheck = await query(
      `SELECT t.* FROM tours t
       JOIN tour_guides tg ON tg.id = t.guide_id
       WHERE t.id = $1 AND tg.user_id = $2`,
      [id, user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Tour not found or access denied' }, { status: 403 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'description', 'highlights', 'city', 'country', 'meeting_point',
      'duration_days', 'duration_hours', 'price_per_person', 'price_currency',
      'max_group_size', 'min_group_size', 'what_included', 'what_not_included',
      'requirements', 'notes', 'instructions', 'cancellation_policy',
      'status', 'visibility',
    ];

    const fieldMapping: Record<string, string> = {
      meetingPoint: 'meeting_point',
      durationDays: 'duration_days',
      durationHours: 'duration_hours',
      pricePerPerson: 'price_per_person',
      priceCurrency: 'price_currency',
      maxGroupSize: 'max_group_size',
      minGroupSize: 'min_group_size',
      whatIncluded: 'what_included',
      whatNotIncluded: 'what_not_included',
      cancellationPolicy: 'cancellation_policy',
    };

    for (const [key, value] of Object.entries(body)) {
      const dbField = fieldMapping[key] || key;
      if (allowedFields.includes(dbField) && value !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');

    // If status is changing to active, set published_at
    if (body.status === 'active') {
      updates.push(`published_at = COALESCE(published_at, NOW())`);
    }

    values.push(id);
    const updateResult = await query(
      `UPDATE tours SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Update tags if provided
    if (body.tagIds) {
      await query('DELETE FROM tour_tag_mappings WHERE tour_id = $1', [id]);
      for (const tagId of body.tagIds) {
        await query(
          'INSERT INTO tour_tag_mappings (tour_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, tagId]
        );
      }
    }

    return NextResponse.json({
      tour: updateResult.rows[0],
      message: 'Tour updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update tour:', error);
    return NextResponse.json(
      { error: 'Failed to update tour', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete tour (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const ownerCheck = await query(
      `SELECT t.* FROM tours t
       JOIN tour_guides tg ON tg.id = t.guide_id
       WHERE t.id = $1 AND tg.user_id = $2`,
      [id, user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Tour not found or access denied' }, { status: 403 });
    }

    // Soft delete by archiving
    await query(
      "UPDATE tours SET status = 'archived', updated_at = NOW() WHERE id = $1",
      [id]
    );

    return NextResponse.json({ message: 'Tour deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete tour:', error);
    return NextResponse.json(
      { error: 'Failed to delete tour', details: error.message },
      { status: 500 }
    );
  }
}
