import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { Tour, TourFilters, TourListResponse, CreateTourRequest } from '@/lib/types/tour';
import { nanoid } from 'nanoid';

// Helper to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + nanoid(6);
}

// GET - List tours with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters: TourFilters = {
      city: searchParams.get('city') || undefined,
      country: searchParams.get('country') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      minDuration: searchParams.get('minDuration') ? parseInt(searchParams.get('minDuration')!) : undefined,
      maxDuration: searchParams.get('maxDuration') ? parseInt(searchParams.get('maxDuration')!) : undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      guideId: searchParams.get('guideId') || undefined,
      status: searchParams.get('status') || undefined,
      visibility: searchParams.get('visibility') || 'public',
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as TourFilters['sortBy']) || 'newest',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
    };

    // Build query
    let whereConditions = ['t.status = $1'];
    let params: any[] = ['active'];
    let paramIndex = 2;

    if (filters.visibility) {
      whereConditions.push(`t.visibility = $${paramIndex}`);
      params.push(filters.visibility);
      paramIndex++;
    }

    if (filters.city) {
      whereConditions.push(`LOWER(t.city) LIKE $${paramIndex}`);
      params.push(`%${filters.city.toLowerCase()}%`);
      paramIndex++;
    }

    if (filters.country) {
      whereConditions.push(`LOWER(t.country) LIKE $${paramIndex}`);
      params.push(`%${filters.country.toLowerCase()}%`);
      paramIndex++;
    }

    if (filters.minPrice !== undefined) {
      whereConditions.push(`t.price_per_person >= $${paramIndex}`);
      params.push(filters.minPrice);
      paramIndex++;
    }

    if (filters.maxPrice !== undefined) {
      whereConditions.push(`t.price_per_person <= $${paramIndex}`);
      params.push(filters.maxPrice);
      paramIndex++;
    }

    if (filters.minDuration !== undefined) {
      whereConditions.push(`t.duration_days >= $${paramIndex}`);
      params.push(filters.minDuration);
      paramIndex++;
    }

    if (filters.maxDuration !== undefined) {
      whereConditions.push(`t.duration_days <= $${paramIndex}`);
      params.push(filters.maxDuration);
      paramIndex++;
    }

    if (filters.minRating !== undefined) {
      whereConditions.push(`t.rating >= $${paramIndex}`);
      params.push(filters.minRating);
      paramIndex++;
    }

    if (filters.guideId) {
      whereConditions.push(`t.guide_id = $${paramIndex}`);
      params.push(filters.guideId);
      paramIndex++;
    }

    if (filters.search) {
      whereConditions.push(`(LOWER(t.name) LIKE $${paramIndex} OR LOWER(t.description) LIKE $${paramIndex} OR LOWER(t.city) LIKE $${paramIndex})`);
      params.push(`%${filters.search.toLowerCase()}%`);
      paramIndex++;
    }

    // Sort
    let orderBy = 't.created_at DESC';
    switch (filters.sortBy) {
      case 'price':
        orderBy = `t.price_per_person ${filters.sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
        break;
      case 'rating':
        orderBy = `t.rating ${filters.sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
        break;
      case 'reviews':
        orderBy = `t.reviews_count ${filters.sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
        break;
      case 'popular':
        orderBy = `t.bookings_count ${filters.sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
        break;
      case 'newest':
      default:
        orderBy = `t.created_at ${filters.sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
    }

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM tours t WHERE ${whereConditions.join(' AND ')}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get tours with pagination
    const offset = (filters.page! - 1) * filters.limit!;
    const toursResult = await query(
      `SELECT t.*,
        tg.business_name as guide_business_name,
        u.full_name as guide_name,
        u.avatar_url as guide_avatar,
        (SELECT json_agg(img) FROM (
           SELECT json_build_object('id', ti.id, 'url', ti.url, 'isCover', ti.is_cover) as img
           FROM tour_images ti WHERE ti.tour_id = t.id ORDER BY ti.sort_order LIMIT 5
         ) sub) as images,
        (SELECT json_agg(json_build_object('id', tt.id, 'name', tt.name, 'slug', tt.slug, 'icon', tt.icon, 'color', tt.color))
         FROM tour_tag_mappings ttm
         JOIN tour_tags tt ON tt.id = ttm.tag_id
         WHERE ttm.tour_id = t.id) as tags
       FROM tours t
       JOIN tour_guides tg ON tg.id = t.guide_id
       JOIN users u ON u.id = tg.user_id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, filters.limit, offset]
    );

    const tours: Tour[] = toursResult.rows.map(row => ({
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
      viewsCount: row.views_count,
      bookingsCount: row.bookings_count,
      rating: parseFloat(row.rating) || 0,
      reviewsCount: row.reviews_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
      guide: {
        id: row.guide_id,
        userId: '',
        businessName: row.guide_business_name,
        user: {
          fullName: row.guide_name,
          email: '',
          avatarUrl: row.guide_avatar,
        },
      } as any,
      images: row.images || [],
      tags: row.tags || [],
    }));

    const response: TourListResponse = {
      tours,
      total,
      page: filters.page!,
      limit: filters.limit!,
      totalPages: Math.ceil(total / filters.limit!),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to fetch tours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tours', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new tour (requires tour guide status)
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a tour guide
    const guideResult = await query(
      'SELECT * FROM tour_guides WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    if (guideResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'You must be a registered tour guide to create tours' },
        { status: 403 }
      );
    }

    const guide = guideResult.rows[0];
    const body: CreateTourRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.city || !body.country || !body.pricePerPerson || !body.durationDays) {
      return NextResponse.json(
        { error: 'Missing required fields: name, city, country, pricePerPerson, durationDays' },
        { status: 400 }
      );
    }

    const slug = generateSlug(body.name);

    // Create the tour
    const tourResult = await query(
      `INSERT INTO tours (
        guide_id, name, slug, description, highlights,
        city, country, meeting_point,
        duration_days, duration_hours, price_per_person, price_currency,
        max_group_size, min_group_size,
        what_included, what_not_included, requirements,
        notes, instructions, cancellation_policy,
        visibility, status
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14,
        $15, $16, $17,
        $18, $19, $20,
        $21, 'draft'
      ) RETURNING *`,
      [
        guide.id,
        body.name,
        slug,
        body.description || null,
        body.highlights || [],
        body.city,
        body.country,
        body.meetingPoint || null,
        body.durationDays,
        body.durationHours || 0,
        body.pricePerPerson,
        body.priceCurrency || 'USD',
        body.maxGroupSize || 10,
        body.minGroupSize || 1,
        body.whatIncluded || [],
        body.whatNotIncluded || [],
        body.requirements || [],
        body.notes || null,
        body.instructions || null,
        body.cancellationPolicy || null,
        body.visibility || 'public',
      ]
    );

    const tour = tourResult.rows[0];

    // Add tags if provided
    if (body.tagIds && body.tagIds.length > 0) {
      for (const tagId of body.tagIds) {
        await query(
          'INSERT INTO tour_tag_mappings (tour_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [tour.id, tagId]
        );
      }
    }

    // Add images if provided
    if (body.images && body.images.length > 0) {
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        await query(
          `INSERT INTO tour_images (tour_id, url, alt_text, caption, is_cover, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [tour.id, img.url, img.altText || null, img.caption || null, img.isCover || i === 0, i]
        );
      }
    }

    // Add activities if provided
    if (body.activities && body.activities.length > 0) {
      for (const activity of body.activities) {
        await query(
          `INSERT INTO tour_activities (
            tour_id, day_number, order_index, time_start, time_end,
            title, description, location, duration_minutes, activity_type,
            is_optional, extra_cost
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            tour.id,
            activity.dayNumber,
            activity.orderIndex,
            activity.timeStart || null,
            activity.timeEnd || null,
            activity.title,
            activity.description || null,
            activity.location || null,
            activity.durationMinutes || null,
            activity.activityType || 'activity',
            activity.isOptional || false,
            activity.extraCost || null,
          ]
        );
      }
    }

    return NextResponse.json({
      tour: { ...tour, id: tour.id },
      message: 'Tour created successfully',
    });
  } catch (error: any) {
    console.error('Failed to create tour:', error);
    return NextResponse.json(
      { error: 'Failed to create tour', details: error.message },
      { status: 500 }
    );
  }
}
