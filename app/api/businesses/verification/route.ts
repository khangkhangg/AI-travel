import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - get verification status for current user's business
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's business
    const businessResult = await query(
      'SELECT id, ekyc_verified, ekyc_verified_at, verification_counts FROM businesses WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ error: 'No business found for this user' }, { status: 404 });
    }

    const business = businessResult.rows[0];

    // Get verification documents
    const documentsResult = await query(
      `SELECT document_type, status, created_at as uploaded_at, reviewed_at, rejection_reason
       FROM business_verification_documents
       WHERE business_id = $1
       ORDER BY created_at DESC`,
      [business.id]
    );

    return NextResponse.json({
      business_id: business.id,
      ekyc_verified: business.ekyc_verified,
      ekyc_verified_at: business.ekyc_verified_at,
      verification_counts: business.verification_counts,
      documents: documentsResult.rows.map(doc => ({
        document_type: doc.document_type,
        status: doc.status,
        uploaded_at: doc.uploaded_at,
        reviewed_at: doc.reviewed_at,
        rejection_reason: doc.rejection_reason,
      })),
    });
  } catch (error: any) {
    console.error('Failed to fetch verification status:', error);
    return NextResponse.json({ error: 'Failed to fetch verification status' }, { status: 500 });
  }
}

// POST - upload verification document
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's business
    const businessResult = await query(
      'SELECT id FROM businesses WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ error: 'No business found for this user' }, { status: 404 });
    }

    const businessId = businessResult.rows[0].id;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!documentType || !['business_license', 'owner_id'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be "business_license" or "owner_id"' },
        { status: 400 }
      );
    }

    // Validate file type (images and PDF)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Check if service role key is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'pdf';
    const fileName = `${businessId}-${documentType}-${Date.now()}.${fileExt}`;
    const filePath = `business-verification/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const bucketName = 'business-documents';

    // Try to ensure bucket exists (only works with service role key)
    if (serviceRoleKey) {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucketName);

      if (!bucketExists) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: false, // Verification documents should be private
          fileSizeLimit: 10 * 1024 * 1024,
          allowedMimeTypes: allowedTypes,
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

      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
        return NextResponse.json({
          error: 'Storage not configured. Please set up Supabase Storage:',
          details: '1. Go to Supabase Dashboard > Storage\n2. Create bucket named "business-documents"\n3. Set bucket to Private\n4. Add SUPABASE_SERVICE_ROLE_KEY to .env.local',
          needsSetup: true,
        }, { status: 500 });
      }

      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get signed URL (private bucket)
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

    const documentUrl = signedUrlData?.signedUrl || filePath;

    // Insert or update verification document record
    const result = await query(
      `INSERT INTO business_verification_documents (
        business_id, document_type, document_url, file_name, file_size, status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      ON CONFLICT (business_id, document_type)
      DO UPDATE SET
        document_url = $3,
        file_name = $4,
        file_size = $5,
        status = 'pending',
        reviewed_at = NULL,
        reviewed_by = NULL,
        rejection_reason = NULL,
        created_at = NOW()
      RETURNING *`,
      [businessId, documentType, documentUrl, file.name, file.size]
    );

    return NextResponse.json({
      document: {
        document_type: result.rows[0].document_type,
        status: result.rows[0].status,
        uploaded_at: result.rows[0].created_at,
        file_name: result.rows[0].file_name,
      },
      message: 'Document uploaded successfully. It will be reviewed shortly.',
    });
  } catch (error: any) {
    console.error('Failed to upload verification document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - remove a verification document
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('document_type');

    if (!documentType || !['business_license', 'owner_id'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Get user's business
    const businessResult = await query(
      'SELECT id FROM businesses WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const businessId = businessResult.rows[0].id;

    // Delete the document record
    const result = await query(
      'DELETE FROM business_verification_documents WHERE business_id = $1 AND document_type = $2 RETURNING id',
      [businessId, documentType]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Document removed successfully' });
  } catch (error: any) {
    console.error('Failed to delete verification document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
