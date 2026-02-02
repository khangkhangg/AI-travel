import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// POST - Upload avatar image
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Check if service role key is available for admin operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Create Supabase client - use service role if available for storage operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

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
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);

      // Check for common errors and provide helpful messages
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
        return NextResponse.json({
          error: 'Storage not configured. Please set up Supabase Storage:',
          details: '1. Go to Supabase Dashboard > Storage\n2. Create bucket named "user-uploads"\n3. Set bucket to Public\n4. Add SUPABASE_SERVICE_ROLE_KEY to .env.local for auto-setup',
          needsSetup: true,
        }, { status: 500 });
      }

      if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
        return NextResponse.json({
          error: 'Storage policy error. Please configure storage policies:',
          details: '1. Go to Supabase Dashboard > Storage > user-uploads > Policies\n2. Add a policy to allow authenticated users to upload\n3. Or add SUPABASE_SERVICE_ROLE_KEY to .env.local',
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

    // Update user's avatar_url in database
    await query(
      `UPDATE users SET avatar_url = $2, updated_at = NOW() WHERE id = $1 RETURNING avatar_url`,
      [authUser.id, publicUrl]
    );

    return NextResponse.json({
      avatarUrl: publicUrl,
      message: 'Avatar uploaded successfully',
    });
  } catch (error: any) {
    console.error('Failed to upload avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user's avatar_url to null
    await query(
      `UPDATE users SET avatar_url = NULL, updated_at = NOW() WHERE id = $1`,
      [authUser.id]
    );

    return NextResponse.json({
      message: 'Avatar removed successfully',
    });
  } catch (error: any) {
    console.error('Failed to remove avatar:', error);
    return NextResponse.json(
      { error: 'Failed to remove avatar', details: error.message },
      { status: 500 }
    );
  }
}
