import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query, getClient } from '@/lib/db';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/businesses/[id]/verify
 * Review verification documents (approve/reject)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: businessId } = await params;
    const body = await request.json();
    const { documentType, action, rejectionReason } = body;

    if (!documentType || !['business_license', 'owner_id'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a document' },
        { status: 400 }
      );
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Update the document status
      const docResult = await client.query(
        `UPDATE business_verification_documents
         SET status = $1, reviewed_at = NOW(), rejection_reason = $2
         WHERE business_id = $3 AND document_type = $4
         RETURNING *`,
        [
          action === 'approve' ? 'approved' : 'rejected',
          action === 'reject' ? rejectionReason : null,
          businessId,
          documentType,
        ]
      );

      if (docResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      // Check if both documents are now approved
      const allDocsResult = await client.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
           COUNT(*) as total_count
         FROM business_verification_documents
         WHERE business_id = $1`,
        [businessId]
      );

      const { approved_count, total_count } = allDocsResult.rows[0];
      const allApproved = parseInt(approved_count) >= 2;

      // Update business eKYC status if both documents are approved
      if (allApproved) {
        await client.query(
          `UPDATE businesses
           SET ekyc_verified = true, ekyc_verified_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [businessId]
        );
      } else {
        // If a document was rejected, reset eKYC status
        await client.query(
          `UPDATE businesses
           SET ekyc_verified = false, ekyc_verified_at = NULL, updated_at = NOW()
           WHERE id = $1`,
          [businessId]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        document: docResult.rows[0],
        businessVerified: allApproved,
        message: action === 'approve'
          ? 'Document approved successfully'
          : 'Document rejected',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Failed to verify document:', error);
    return NextResponse.json(
      { error: 'Failed to verify document', details: error.message },
      { status: 500 }
    );
  }
}
