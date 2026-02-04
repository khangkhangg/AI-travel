import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { getVisionProvider, isEkycEnabled, VisionAnalysisInput } from '@/lib/ai/vision-models';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/businesses/verification/analyze
 *
 * AI-powered document analysis for eKYC verification.
 * Analyzes uploaded business documents using vision AI models.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if eKYC is enabled
    const ekycEnabled = await isEkycEnabled();
    if (!ekycEnabled) {
      return NextResponse.json(
        { error: 'AI document verification is currently disabled' },
        { status: 403 }
      );
    }

    // Get user's business
    const businessResult = await query(
      'SELECT id FROM businesses WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No business found for this user' },
        { status: 404 }
      );
    }

    const businessId = businessResult.rows[0].id;

    // Parse request body
    const body = await request.json();
    const { documentType, documentId } = body;

    if (!documentType || !['business_license', 'owner_id'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be "business_license" or "owner_id"' },
        { status: 400 }
      );
    }

    // Get the document record
    const docResult = await query(
      `SELECT id, document_url, file_name, status
       FROM business_verification_documents
       WHERE business_id = $1 AND document_type = $2`,
      [businessId, documentType]
    );

    if (docResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found. Please upload the document first.' },
        { status: 404 }
      );
    }

    const document = docResult.rows[0];

    // Only allow analysis of pending documents
    if (document.status === 'approved') {
      return NextResponse.json(
        { error: 'Document has already been approved' },
        { status: 400 }
      );
    }

    // Fetch the document image from Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Extract file path from the signed URL or use the stored path
    let imageBuffer: ArrayBuffer;
    let imageType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';

    if (document.document_url.startsWith('http')) {
      // Fetch from signed URL
      const imageResponse = await fetch(document.document_url);
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch document image' },
          { status: 500 }
        );
      }
      imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type');
      if (contentType?.includes('png')) imageType = 'image/png';
      else if (contentType?.includes('webp')) imageType = 'image/webp';
    } else {
      // Download from storage path
      const { data, error } = await supabase.storage
        .from('business-documents')
        .download(document.document_url);

      if (error || !data) {
        return NextResponse.json(
          { error: 'Failed to download document from storage' },
          { status: 500 }
        );
      }

      imageBuffer = await data.arrayBuffer();
      if (document.file_name?.toLowerCase().endsWith('.png')) imageType = 'image/png';
      else if (document.file_name?.toLowerCase().endsWith('.webp')) imageType = 'image/webp';
    }

    // Convert to base64
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // Get the vision AI provider
    const visionProvider = await getVisionProvider();

    // Analyze the document
    const input: VisionAnalysisInput = {
      imageBase64,
      imageType,
      prompt: '', // Will use default prompt for document type
      documentType,
    };

    const analysisResult = await visionProvider.analyzeImage(input);

    if (!analysisResult.success) {
      return NextResponse.json(
        {
          error: 'Document analysis failed',
          details: analysisResult.error,
        },
        { status: 500 }
      );
    }

    // Store the analysis result
    await query(
      `UPDATE business_verification_documents
       SET ai_analysis = $1, ai_analyzed_at = NOW(), ai_model = $2
       WHERE id = $3`,
      [
        JSON.stringify({
          raw: analysisResult.content,
          parsed: analysisResult.parsed,
          tokensUsed: analysisResult.tokensUsed,
          responseTimeMs: analysisResult.responseTimeMs,
        }),
        analysisResult.model,
        document.id,
      ]
    );

    // If AI confidence is high enough, auto-approve (threshold: 80%)
    const autoApproveThreshold = 80;
    let autoApproved = false;

    if (
      analysisResult.parsed?.isValidDocument &&
      analysisResult.parsed.confidence >= autoApproveThreshold &&
      (!analysisResult.parsed.issues || analysisResult.parsed.issues.length === 0)
    ) {
      await query(
        `UPDATE business_verification_documents
         SET status = 'approved', reviewed_at = NOW(), reviewed_by = 'ai_auto'
         WHERE id = $1`,
        [document.id]
      );
      autoApproved = true;

      // Check if all documents are now approved for this business
      const allDocsResult = await query(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
         FROM business_verification_documents
         WHERE business_id = $1`,
        [businessId]
      );

      const { total, approved } = allDocsResult.rows[0];

      // If all required documents are approved, mark business as verified
      if (parseInt(total) >= 2 && parseInt(approved) >= 2) {
        await query(
          `UPDATE businesses
           SET ekyc_verified = true, ekyc_verified_at = NOW()
           WHERE id = $1`,
          [businessId]
        );
      }
    }

    return NextResponse.json({
      success: true,
      analysis: {
        isValidDocument: analysisResult.parsed?.isValidDocument || false,
        documentType: analysisResult.parsed?.documentType,
        confidence: analysisResult.parsed?.confidence || 0,
        extractedInfo: analysisResult.parsed?.extractedInfo,
        issues: analysisResult.parsed?.issues,
      },
      autoApproved,
      model: analysisResult.model,
      tokensUsed: analysisResult.tokensUsed,
      responseTimeMs: analysisResult.responseTimeMs,
    });
  } catch (error: any) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { error: 'Document analysis failed', details: error.message },
      { status: 500 }
    );
  }
}
