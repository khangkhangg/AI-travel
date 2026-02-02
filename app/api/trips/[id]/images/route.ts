import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - Get all images for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT id, image_url, display_order, created_at
       FROM trip_images
       WHERE trip_id = $1
       ORDER BY display_order ASC`,
      [id]
    );

    return NextResponse.json({ images: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Upload image for an itinerary (max 3)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user owns this trip
    const ownerCheck = await query(
      'SELECT user_id FROM trips WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (ownerCheck.rows[0].user_id !== authUser.id) {
      return NextResponse.json({ error: 'Not authorized to edit this trip' }, { status: 403 });
    }

    // Check current image count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM trip_images WHERE trip_id = $1',
      [id]
    );

    const currentCount = parseInt(countResult.rows[0].count);
    if (currentCount >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 images per trip. Please delete an image first.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${id}-${Date.now()}-${currentCount}.${fileExt}`;
    const filePath = `itinerary-images/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const bucketName = 'user-uploads';

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);

      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
        return NextResponse.json({
          error: 'Storage not configured. Please set up Supabase Storage.',
          needsSetup: true,
        }, { status: 500 });
      }

      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Insert into database
    const insertResult = await query(
      `INSERT INTO trip_images (trip_id, image_url, display_order)
       VALUES ($1, $2, $3)
       RETURNING id, image_url, display_order, created_at`,
      [id, publicUrl, currentCount]
    );

    return NextResponse.json({
      image: insertResult.rows[0],
      message: 'Image uploaded successfully',
    });
  } catch (error: any) {
    console.error('Failed to upload image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove an image from itinerary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // Check if user owns this trip
    const ownerCheck = await query(
      'SELECT user_id FROM trips WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (ownerCheck.rows[0].user_id !== authUser.id) {
      return NextResponse.json({ error: 'Not authorized to edit this trip' }, { status: 403 });
    }

    // Delete the image record (cascade will handle cleanup)
    const deleteResult = await query(
      `DELETE FROM trip_images
       WHERE id = $1 AND trip_id = $2
       RETURNING image_url`,
      [imageId, id]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Optionally delete from storage
    try {
      const imageUrl = deleteResult.rows[0].image_url;
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // itinerary-images/filename

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase.storage.from('user-uploads').remove([filePath]);
    } catch (storageError) {
      console.error('Failed to delete from storage (non-critical):', storageError);
    }

    // Reorder remaining images
    await query(
      `UPDATE trip_images
       SET display_order = sub.new_order
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) - 1 as new_order
         FROM trip_images
         WHERE trip_id = $1
       ) sub
       WHERE trip_images.id = sub.id`,
      [id]
    );

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image', details: error.message },
      { status: 500 }
    );
  }
}
