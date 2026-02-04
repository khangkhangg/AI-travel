-- Migration: Add vision AI models for eKYC document verification
-- These models are cheap Chinese AI vision models that can analyze ID documents

-- Add model_type column to distinguish text vs vision models
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS model_type TEXT DEFAULT 'text'
  CHECK (model_type IN ('text', 'vision', 'multimodal'));

-- Add capabilities JSON column for future extensibility
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{}';

-- Insert vision AI models (cheap Chinese models for document verification)
INSERT INTO ai_models (name, display_name, provider, model_id, api_endpoint, is_active, is_default, priority, cost_per_1k_tokens, model_type, capabilities)
VALUES
  -- DeepSeek VL2: Best value - $0.14/M input tokens
  ('deepseek-vl2', 'DeepSeek VL2', 'deepseek', 'deepseek-vl2', 'https://api.deepseek.com/v1/chat/completions', true, false, 50, 0.00014, 'vision', '{"vision": true, "document_analysis": true, "ocr": true}'::jsonb),

  -- Qwen-VL Plus: Good alternative - ~$0.58/M tokens
  ('qwen-vl-plus', 'Qwen-VL Plus', 'alibaba', 'qwen-vl-plus', 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', true, false, 51, 0.00058, 'vision', '{"vision": true, "document_analysis": true, "ocr": true}'::jsonb),

  -- GLM-4V: Zhipu's vision model - ~$1.40/M tokens
  ('glm-4v', 'GLM-4V', 'zhipu', 'glm-4v', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', true, false, 52, 0.0014, 'vision', '{"vision": true, "document_analysis": true}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  model_id = EXCLUDED.model_id,
  api_endpoint = EXCLUDED.api_endpoint,
  cost_per_1k_tokens = EXCLUDED.cost_per_1k_tokens,
  model_type = EXCLUDED.model_type,
  capabilities = EXCLUDED.capabilities;

-- Add site_settings entries for eKYC configuration
INSERT INTO site_settings (key, value, updated_at)
VALUES
  ('ekyc_enabled', '"false"', NOW()),
  ('ekyc_model', '"deepseek-vl2"', NOW())
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookup of vision models
CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(model_type) WHERE model_type != 'text';
