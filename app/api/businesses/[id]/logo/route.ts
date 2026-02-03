import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// POST - Upload business logo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: businessId } = await params;

    // Verify ownership
    const businessCheck = await query(
      'SELECT user_id FROM businesses WHERE id = $1',
      [businessId]
    );

    if (businessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (businessCheck.rows[0].user_id !== authUser.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
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

    // Check if service role key is available for admin operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `business-${businessId}-${Date.now()}.${fileExt}`;
    const filePath = `business-logos/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const bucketName = 'user-uploads';

    // Try to ensure bucket exists (only works with service role key)
    if (serviceRoleKey) {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucketName);

      if (!bucketExists) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        });

        if (createBucketError && !createBucketError.message.includes('already exists')) {
          console.error('Create bucket error:', createBucketError);
        }
      }
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
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

    // Update business logo_url in database
    await query(
      `UPDATE businesses SET logo_url = $2, updated_at = NOW() WHERE id = $1`,
      [businessId, publicUrl]
    );

    return NextResponse.json({
      logoUrl: publicUrl,
      message: 'Logo uploaded successfully',
    });
  } catch (error: any) {
    console.error('Failed to upload logo:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove logo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: businessId } = await params;

    // Verify ownership
    const businessCheck = await query(
      'SELECT user_id FROM businesses WHERE id = $1',
      [businessId]
    );

    if (businessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (businessCheck.rows[0].user_id !== authUser.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Update business logo_url to null
    await query(
      `UPDATE businesses SET logo_url = NULL, updated_at = NOW() WHERE id = $1`,
      [businessId]
    );

    return NextResponse.json({
      message: 'Logo removed successfully',
    });
  } catch (error: any) {
    console.error('Failed to remove logo:', error);
    return NextResponse.json(
      { error: 'Failed to remove logo', details: error.message },
      { status: 500 }
    );
  }
}
