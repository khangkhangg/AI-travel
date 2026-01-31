import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single itinerary with full details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();

    // Fetch itinerary with user info
    const result = await query(
      `SELECT
        i.*,
        u.id as owner_id,
        u.full_name as user_full_name,
        u.avatar_url as user_avatar_url,
        u.email as user_email,
        u.bio as user_bio,
        u.location as user_location
      FROM itineraries i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // Check access permissions
    const isOwner = user?.id === row.user_id;
    const isPublic = row.visibility === 'public' || row.visibility === 'marketplace';

    // Check if user is a collaborator
    let isCollaborator = false;
    let collaboratorRole = null;
    if (user && !isOwner) {
      const collabResult = await query(
        `SELECT role FROM itinerary_collaborators WHERE itinerary_id = $1 AND user_id = $2`,
        [id, user.id]
      );
      if (collabResult.rows.length > 0) {
        isCollaborator = true;
        collaboratorRole = collabResult.rows[0].role;
      }
    }

    // Deny access to private itineraries for non-owners/non-collaborators
    if (row.visibility === 'private' && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Increment view count for non-owners viewing public itineraries
    if (!isOwner && isPublic) {
      await query(
        `UPDATE itineraries SET view_count = view_count + 1 WHERE id = $1`,
        [id]
      );
    }

    // Fetch collaborators
    const collaboratorsResult = await query(
      `SELECT
        ic.*,
        u.full_name,
        u.avatar_url,
        u.email
      FROM itinerary_collaborators ic
      LEFT JOIN users u ON ic.user_id = u.id
      WHERE ic.itinerary_id = $1`,
      [id]
    );

    const collaborators = collaboratorsResult.rows.map(c => ({
      id: c.id,
      itineraryId: c.itinerary_id,
      userId: c.user_id,
      role: c.role,
      invitedAt: c.invited_at,
      user: {
        id: c.user_id,
        fullName: c.full_name,
        avatarUrl: c.avatar_url,
        email: c.email,
      },
    }));

    // Fetch payment links for the owner (for tipping)
    let ownerPaymentLinks: any[] = [];
    if (isPublic) {
      const paymentResult = await query(
        `SELECT platform, value, is_primary FROM user_payment_links
         WHERE user_id = $1 ORDER BY is_primary DESC`,
        [row.user_id]
      );
      ownerPaymentLinks = paymentResult.rows.map(p => ({
        platform: p.platform,
        value: p.value,
        isPrimary: p.is_primary,
      }));
    }

    return NextResponse.json({
      itinerary: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        destinationCity: row.destination_city,
        destinationCountry: row.destination_country,
        startDate: row.start_date,
        endDate: row.end_date,
        visibility: row.visibility,
        openToOffers: row.open_to_offers,
        groupSize: row.group_size,
        interests: row.interests || [],
        cloneCount: row.clone_count,
        viewCount: row.view_count + (isOwner || !isPublic ? 0 : 1), // Include the view we just added
        clonedFromId: row.cloned_from_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: {
          id: row.owner_id,
          fullName: row.user_full_name,
          avatarUrl: row.user_avatar_url,
          email: isOwner || isCollaborator ? row.user_email : undefined,
          bio: row.user_bio,
          location: row.user_location,
          paymentLinks: ownerPaymentLinks,
        },
        collaborators,
      },
      access: {
        isOwner,
        isCollaborator,
        collaboratorRole,
        canEdit: isOwner || collaboratorRole === 'collaborator',
        canView: true,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itinerary' },
      { status: 500 }
    );
  }
}

// PUT - Update itinerary
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership or collaborator status
    const checkResult = await query(
      `SELECT i.user_id, ic.role
       FROM itineraries i
       LEFT JOIN itinerary_collaborators ic ON ic.itinerary_id = i.id AND ic.user_id = $2
       WHERE i.id = $1`,
      [id, user.id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const { user_id: ownerId, role } = checkResult.rows[0];
    const isOwner = user.id === ownerId;
    const canEdit = isOwner || role === 'collaborator';

    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      destinationCity,
      destinationCountry,
      startDate,
      endDate,
      visibility,
      openToOffers,
      groupSize,
      interests,
    } = body;

    // Only owner can change visibility settings
    let updateFields: string[] = [];
    let updateParams: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateParams.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateParams.push(description);
    }
    if (destinationCity !== undefined) {
      updateFields.push(`destination_city = $${paramIndex++}`);
      updateParams.push(destinationCity);
    }
    if (destinationCountry !== undefined) {
      updateFields.push(`destination_country = $${paramIndex++}`);
      updateParams.push(destinationCountry);
    }
    if (startDate !== undefined) {
      updateFields.push(`start_date = $${paramIndex++}`);
      updateParams.push(startDate);
    }
    if (endDate !== undefined) {
      updateFields.push(`end_date = $${paramIndex++}`);
      updateParams.push(endDate);
    }
    if (groupSize !== undefined) {
      updateFields.push(`group_size = $${paramIndex++}`);
      updateParams.push(groupSize);
    }
    if (interests !== undefined) {
      updateFields.push(`interests = $${paramIndex++}`);
      updateParams.push(interests);
    }

    // Owner-only fields
    if (isOwner) {
      if (visibility !== undefined) {
        if (!['public', 'private', 'marketplace'].includes(visibility)) {
          return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
        }
        updateFields.push(`visibility = $${paramIndex++}`);
        updateParams.push(visibility);
      }
      if (openToOffers !== undefined) {
        updateFields.push(`open_to_offers = $${paramIndex++}`);
        updateParams.push(openToOffers);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push(`updated_at = NOW()`);
    updateParams.push(id);

    const result = await query(
      `UPDATE itineraries SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateParams
    );

    const row = result.rows[0];

    return NextResponse.json({
      itinerary: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        destinationCity: row.destination_city,
        destinationCountry: row.destination_country,
        startDate: row.start_date,
        endDate: row.end_date,
        visibility: row.visibility,
        openToOffers: row.open_to_offers,
        groupSize: row.group_size,
        interests: row.interests || [],
        cloneCount: row.clone_count,
        viewCount: row.view_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      message: 'Itinerary updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to update itinerary' },
      { status: 500 }
    );
  }
}

// DELETE - Delete itinerary (owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `DELETE FROM itineraries WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Itinerary not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Itinerary deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary' },
      { status: 500 }
    );
  }
}
