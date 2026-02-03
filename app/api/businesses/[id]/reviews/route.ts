import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - get reviews for a business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'recent'; // 'recent' or 'rating'

    // Get reviews with reviewer info
    const orderBy = sort === 'rating' ? 'br.rating DESC, br.created_at DESC' : 'br.created_at DESC';

    const reviewsResult = await query(
      `SELECT
        br.*,
        u.id as reviewer_id,
        u.full_name as reviewer_name,
        u.avatar_url as reviewer_avatar,
        u.username as reviewer_username
       FROM business_reviews br
       JOIN users u ON u.id = br.reviewer_id
       WHERE br.business_id = $1
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM business_reviews WHERE business_id = $1',
      [id]
    );

    // Get average rating and verification counts
    const statsResult = await query(
      `SELECT
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE verified_contact = true) as contact_verifications,
        COUNT(*) FILTER (WHERE verified_location = true) as location_verifications,
        COUNT(*) FILTER (WHERE verified_services = true) as services_verifications,
        COUNT(*) FILTER (WHERE verified_pricing = true) as pricing_verifications
       FROM business_reviews
       WHERE business_id = $1`,
      [id]
    );

    const stats = statsResult.rows[0];

    return NextResponse.json({
      reviews: reviewsResult.rows.map(row => ({
        id: row.id,
        rating: row.rating,
        review_text: row.review_text,
        verified_contact: row.verified_contact,
        verified_location: row.verified_location,
        verified_services: row.verified_services,
        verified_pricing: row.verified_pricing,
        created_at: row.created_at,
        reviewer: {
          id: row.reviewer_id,
          name: row.reviewer_name,
          avatar_url: row.reviewer_avatar,
          username: row.reviewer_username,
        },
      })),
      total: parseInt(countResult.rows[0].total),
      averageRating: parseFloat(stats.average_rating).toFixed(1),
      verificationCounts: {
        contact: parseInt(stats.contact_verifications),
        location: parseInt(stats.location_verifications),
        services: parseInt(stats.services_verifications),
        pricing: parseInt(stats.pricing_verifications),
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST - create a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to leave a review' }, { status: 401 });
    }

    const { id: businessId } = await params;

    // Check if business exists
    const businessCheck = await query(
      'SELECT id, user_id FROM businesses WHERE id = $1 AND is_active = true',
      [businessId]
    );

    if (businessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Prevent business owner from reviewing themselves
    if (businessCheck.rows[0].user_id === user.id) {
      return NextResponse.json({ error: 'You cannot review your own business' }, { status: 400 });
    }

    // Check if user already reviewed this business
    const existingReview = await query(
      'SELECT id FROM business_reviews WHERE business_id = $1 AND reviewer_id = $2',
      [businessId, user.id]
    );

    if (existingReview.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have already reviewed this business. You can update your existing review.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      rating,
      review_text,
      verified_contact,
      verified_location,
      verified_services,
      verified_pricing,
    } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Create review
    const result = await query(
      `INSERT INTO business_reviews (
        business_id, reviewer_id, rating, review_text,
        verified_contact, verified_location, verified_services, verified_pricing
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        businessId,
        user.id,
        rating,
        review_text || null,
        verified_contact || false,
        verified_location || false,
        verified_services || false,
        verified_pricing || false,
      ]
    );

    // Get reviewer info
    const userResult = await query(
      'SELECT full_name, avatar_url, username FROM users WHERE id = $1',
      [user.id]
    );

    const review = result.rows[0];
    const reviewer = userResult.rows[0];

    return NextResponse.json({
      review: {
        id: review.id,
        rating: review.rating,
        review_text: review.review_text,
        verified_contact: review.verified_contact,
        verified_location: review.verified_location,
        verified_services: review.verified_services,
        verified_pricing: review.verified_pricing,
        created_at: review.created_at,
        reviewer: {
          id: user.id,
          name: reviewer.full_name,
          avatar_url: reviewer.avatar_url,
          username: reviewer.username,
        },
      },
    });
  } catch (error: any) {
    console.error('Failed to create review:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You have already reviewed this business' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

// PUT - update an existing review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: businessId } = await params;
    const body = await request.json();
    const {
      rating,
      review_text,
      verified_contact,
      verified_location,
      verified_services,
      verified_pricing,
    } = body;

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Update review
    const result = await query(
      `UPDATE business_reviews SET
        rating = COALESCE($1, rating),
        review_text = COALESCE($2, review_text),
        verified_contact = COALESCE($3, verified_contact),
        verified_location = COALESCE($4, verified_location),
        verified_services = COALESCE($5, verified_services),
        verified_pricing = COALESCE($6, verified_pricing),
        updated_at = NOW()
       WHERE business_id = $7 AND reviewer_id = $8
       RETURNING *`,
      [
        rating || null,
        review_text,
        verified_contact,
        verified_location,
        verified_services,
        verified_pricing,
        businessId,
        user.id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ review: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to update review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE - delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: businessId } = await params;

    const result = await query(
      'DELETE FROM business_reviews WHERE business_id = $1 AND reviewer_id = $2 RETURNING id',
      [businessId, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
