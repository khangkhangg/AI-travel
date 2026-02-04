import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/businesses/[id]/upload
 * Upload logo or verification documents for a business
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: businessId } = await params;

    // Verify business exists
    const businessCheck = await query(
      'SELECT id FROM businesses WHERE id = $1',
      [businessId]
    );

    if (businessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string; // 'logo', 'business_license', 'owner_id'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!uploadType || !['logo', 'business_license', 'owner_id'].includes(uploadType)) {
      return NextResponse.json(
        { error: 'Invalid upload type. Must be logo, business_license, or owner_id' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for documents)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
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
    const fileName = `${businessId}-${uploadType}-${Date.now()}.${fileExt}`;
    const folderPath = uploadType === 'logo' ? 'business-logos' : 'business-verification';
    const filePath = `${folderPath}/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const bucketName = 'user-uploads';

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

    // Update database based on upload type
    if (uploadType === 'logo') {
      await query(
        'UPDATE businesses SET logo_url = $1, updated_at = NOW() WHERE id = $2',
        [publicUrl, businessId]
      );

      return NextResponse.json({
        success: true,
        url: publicUrl,
        type: 'logo',
        message: 'Logo uploaded successfully',
      });
    } else {
      // For verification documents, insert/update in business_verification_documents
      const existingDoc = await query(
        'SELECT id FROM business_verification_documents WHERE business_id = $1 AND document_type = $2',
        [businessId, uploadType]
      );

      if (existingDoc.rows.length > 0) {
        // Update existing document
        await query(
          `UPDATE business_verification_documents
           SET document_url = $1, status = 'pending', rejection_reason = NULL, reviewed_at = NULL, updated_at = NOW()
           WHERE business_id = $2 AND document_type = $3`,
          [publicUrl, businessId, uploadType]
        );
      } else {
        // Insert new document
        await query(
          `INSERT INTO business_verification_documents (business_id, document_type, document_url, status)
           VALUES ($1, $2, $3, 'pending')`,
          [businessId, uploadType, publicUrl]
        );
      }

      return NextResponse.json({
        success: true,
        url: publicUrl,
        type: uploadType,
        message: 'Document uploaded successfully',
      });
    }
  } catch (error: any) {
    console.error('Failed to upload file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}
