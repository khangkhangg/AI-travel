import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - List hotels (public browse or own hotels)
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    const { searchParams } = new URL(request.url);

    const mine = searchParams.get('mine') === 'true';
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const verified = searchParams.get('verified') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT
        h.*,
        u.full_name as owner_name,
        u.avatar_url as owner_avatar
      FROM hotels h
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.is_active = TRUE
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (mine) {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      sql += ` AND h.user_id = $${paramIndex++}`;
      params.push(user.id);
    }

    if (city) {
      sql += ` AND h.city ILIKE $${paramIndex++}`;
      params.push(`%${city}%`);
    }

    if (country) {
      sql += ` AND h.country ILIKE $${paramIndex++}`;
      params.push(`%${country}%`);
    }

    if (verified) {
      sql += ` AND h.is_verified = TRUE`;
    }

    sql += ` ORDER BY h.is_verified DESC, h.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    const hotels = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      city: row.city,
      country: row.country,
      address: row.address,
      starRating: row.star_rating,
      photos: row.photos || [],
      amenities: row.amenities || [],
      website: row.website,
      googleMapsUrl: row.google_maps_url,
      agodaUrl: row.agoda_url,
      bookingComUrl: row.booking_com_url,
      airbnbUrl: row.airbnb_url,
      isVerified: row.is_verified,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      owner: {
        fullName: row.owner_name,
        avatarUrl: row.owner_avatar,
      },
    }));

    return NextResponse.json({ hotels });
  } catch (error: any) {
    console.error('Failed to fetch hotels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotels' },
      { status: 500 }
    );
  }
}

// POST - Register a new hotel
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      city,
      country,
      address,
      starRating,
      photos = [],
      amenities = [],
      website,
      googleMapsUrl,
      agodaUrl,
      bookingComUrl,
      airbnbUrl,
    } = body;

    if (!name || !city || !country) {
      return NextResponse.json(
        { error: 'Name, city, and country are required' },
        { status: 400 }
      );
    }

    if (starRating && (starRating < 1 || starRating > 5)) {
      return NextResponse.json(
        { error: 'Star rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO hotels (
        user_id, name, description, city, country, address,
        star_rating, photos, amenities, website,
        google_maps_url, agoda_url, booking_com_url, airbnb_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        user.id,
        name,
        description || null,
        city,
        country,
        address || null,
        starRating || null,
        photos,
        amenities,
        website || null,
        googleMapsUrl || null,
        agodaUrl || null,
        bookingComUrl || null,
        airbnbUrl || null,
      ]
    );

    const row = result.rows[0];

    return NextResponse.json({
      hotel: {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        city: row.city,
        country: row.country,
        address: row.address,
        starRating: row.star_rating,
        photos: row.photos || [],
        amenities: row.amenities || [],
        website: row.website,
        googleMapsUrl: row.google_maps_url,
        agodaUrl: row.agoda_url,
        bookingComUrl: row.booking_com_url,
        airbnbUrl: row.airbnb_url,
        isVerified: row.is_verified,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      message: 'Hotel registered successfully',
    });
  } catch (error: any) {
    console.error('Failed to register hotel:', error);
    return NextResponse.json(
      { error: 'Failed to register hotel' },
      { status: 500 }
    );
  }
}

// PUT - Update hotel (owner only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Verify ownership
    const ownerCheck = await query(
      `SELECT user_id FROM hotels WHERE id = $1`,
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    if (ownerCheck.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build update query
    const allowedFields = [
      'name', 'description', 'city', 'country', 'address',
      'star_rating', 'photos', 'amenities', 'website',
      'google_maps_url', 'agoda_url', 'booking_com_url', 'airbnb_url', 'is_active'
    ];

    const fieldMapping: Record<string, string> = {
      starRating: 'star_rating',
      googleMapsUrl: 'google_maps_url',
      agodaUrl: 'agoda_url',
      bookingComUrl: 'booking_com_url',
      airbnbUrl: 'airbnb_url',
      isActive: 'is_active',
    };

    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      const dbField = fieldMapping[key] || key;
      if (allowedFields.includes(dbField) && value !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex++}`);
        updateParams.push(value);
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateFields.push(`updated_at = NOW()`);
    updateParams.push(id);

    const result = await query(
      `UPDATE hotels SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateParams
    );

    const row = result.rows[0];

    return NextResponse.json({
      hotel: {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        city: row.city,
        country: row.country,
        address: row.address,
        starRating: row.star_rating,
        photos: row.photos || [],
        amenities: row.amenities || [],
        website: row.website,
        googleMapsUrl: row.google_maps_url,
        agodaUrl: row.agoda_url,
        bookingComUrl: row.booking_com_url,
        airbnbUrl: row.airbnb_url,
        isVerified: row.is_verified,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      message: 'Hotel updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update hotel:', error);
    return NextResponse.json(
      { error: 'Failed to update hotel' },
      { status: 500 }
    );
  }
}

// DELETE - Delete hotel (owner only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    const result = await query(
      `DELETE FROM hotels WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Hotel not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Hotel deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete hotel:', error);
    return NextResponse.json(
      { error: 'Failed to delete hotel' },
      { status: 500 }
    );
  }
}
