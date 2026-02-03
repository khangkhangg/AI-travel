'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Upload,
  FileText,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface VerificationDocument {
  id: string;
  documentType: 'business_license' | 'owner_id';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

interface BusinessVerificationPanelProps {
  businessId: string;
  ekycStatus: 'pending' | 'verified' | 'rejected' | null;
}

export default function BusinessVerificationPanel({ businessId, ekycStatus }: BusinessVerificationPanelProps) {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<'business_license' | 'owner_id' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/businesses/verification');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (documentType: 'business_license' | 'owner_id', file: File) => {
    setUploading(documentType);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetch('/api/businesses/verification', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload document');
      }

      await fetchVerificationStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/businesses/verification?id=${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchVerificationStatus();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const getDocument = (type: 'business_license' | 'owner_id') =>
    documents.find((d) => d.documentType === type);

  const businessLicense = getDocument('business_license');
  const ownerId = getDocument('owner_id');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
            <Check className="w-3 h-3" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
            <X className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getOverallStatusBanner = () => {
    if (ekycStatus === 'verified') {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-emerald-900">Verified Business</h4>
            <p className="text-sm text-emerald-700 mt-1">
              Your business has been verified. Customers will see a verification badge on your profile.
            </p>
          </div>
        </div>
      );
    }

    if (ekycStatus === 'pending') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900">Verification In Progress</h4>
            <p className="text-sm text-amber-700 mt-1">
              We're reviewing your documents. This usually takes 1-2 business days.
            </p>
          </div>
        </div>
      );
    }

    if (ekycStatus === 'rejected') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900">Verification Rejected</h4>
            <p className="text-sm text-red-700 mt-1">
              One or more of your documents were rejected. Please review the feedback and resubmit.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-900">Get Verified</h4>
          <p className="text-sm text-blue-700 mt-1">
            Upload your business license and owner ID to get verified and build trust with customers.
          </p>
        </div>
      </div>
    );
  };

  const renderDocumentCard = (
    type: 'business_license' | 'owner_id',
    title: string,
    description: string,
    document?: VerificationDocument
  ) => (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        {document && getStatusBadge(document.status)}
      </div>

      {document ? (
        <div className="space-y-3">
          {/* Document preview */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Document uploaded</span>
            </div>
            {document.status !== 'approved' && (
              <button
                onClick={() => handleDelete(document.id)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          {/* Rejection reason */}
          {document.status === 'rejected' && document.rejectionReason && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-red-700">
                <strong>Reason:</strong> {document.rejectionReason}
              </p>
            </div>
          )}

          {/* Re-upload for rejected documents */}
          {document.status === 'rejected' && (
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors text-sm font-medium text-gray-700">
              {uploading === type ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload New Document
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(type, file);
                }}
                className="hidden"
                disabled={uploading !== null}
              />
            </label>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors">
          {uploading === type ? (
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-gray-400" />
          )}
          <span className="text-sm text-gray-600">
            {uploading === type ? 'Uploading...' : 'Click to upload'}
          </span>
          <span className="text-xs text-gray-400">PNG, JPG or PDF up to 10MB</span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(type, file);
            }}
            className="hidden"
            disabled={uploading !== null}
          />
        </label>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Verification</h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Upload Failed</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Overall Status Banner */}
        {getOverallStatusBanner()}

        {/* Documents */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Required Documents</h3>

          {renderDocumentCard(
            'business_license',
            'Business License',
            'Official business registration or license document',
            businessLicense
          )}

          {renderDocumentCard(
            'owner_id',
            'Owner ID',
            'Government-issued ID of the business owner',
            ownerId
          )}
        </div>

        {/* Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">1.</span>
              Upload both required documents
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">2.</span>
              Our team reviews your documents (1-2 business days)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">3.</span>
              Once approved, your business will display a verified badge
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
