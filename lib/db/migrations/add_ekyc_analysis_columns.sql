-- Add columns for AI-powered eKYC document analysis

-- Add AI analysis columns to verification documents table
ALTER TABLE business_verification_documents
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
  ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ai_model TEXT;

-- Add index for finding documents pending AI analysis
CREATE INDEX IF NOT EXISTS idx_verification_docs_pending_analysis
  ON business_verification_documents(status, ai_analyzed_at)
  WHERE status = 'pending' AND ai_analyzed_at IS NULL;
