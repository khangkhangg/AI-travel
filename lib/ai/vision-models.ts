/**
 * Vision AI Models for eKYC Document Verification
 *
 * Supports Chinese AI vision models for document analysis:
 * - DeepSeek VL2: Cheapest option at ~$0.14/M tokens
 * - Qwen-VL Plus: Good balance of cost and quality
 * - GLM-4V: Zhipu's vision model
 */

import { query } from '../db';

export interface VisionAnalysisInput {
  imageBase64: string;
  imageType: 'image/jpeg' | 'image/png' | 'image/webp';
  prompt: string;
  documentType?: 'business_license' | 'owner_id' | 'general';
}

export interface VisionAnalysisResult {
  success: boolean;
  content: string;
  parsed?: {
    isValidDocument: boolean;
    documentType?: string;
    extractedInfo?: Record<string, string>;
    confidence: number;
    issues?: string[];
  };
  tokensUsed: number;
  responseTimeMs: number;
  model: string;
  error?: string;
}

export interface VisionModelConfig {
  id: string;
  name: string;
  displayName: string;
  provider: 'deepseek' | 'alibaba' | 'zhipu';
  modelId: string;
  apiEndpoint: string;
  costPer1kTokens: number;
}

// Document analysis prompt templates
const DOCUMENT_PROMPTS = {
  business_license: `Analyze this business license document. Extract and verify:
1. Is this a valid business license/registration document?
2. Business name (if visible)
3. Registration/License number (if visible)
4. Issue date and expiry date (if visible)
5. Issuing authority (if visible)
6. Any signs of tampering or forgery

Return a JSON object with:
{
  "isValidDocument": true/false,
  "documentType": "business_license",
  "confidence": 0-100,
  "extractedInfo": {
    "businessName": "...",
    "registrationNumber": "...",
    "issueDate": "...",
    "expiryDate": "...",
    "issuingAuthority": "..."
  },
  "issues": ["list any concerns or issues"]
}`,

  owner_id: `Analyze this government-issued ID document. Extract and verify:
1. Is this a valid government-issued ID (passport, national ID, driver's license)?
2. Document type
3. Name on document (if visible)
4. ID number (partially - show only last 4 digits for privacy)
5. Expiry date (if applicable)
6. Any signs of tampering or forgery

Return a JSON object with:
{
  "isValidDocument": true/false,
  "documentType": "passport/national_id/drivers_license/other",
  "confidence": 0-100,
  "extractedInfo": {
    "documentType": "...",
    "name": "...",
    "idNumberLast4": "...",
    "expiryDate": "..."
  },
  "issues": ["list any concerns or issues"]
}`,

  general: `Analyze this document image. Describe what you see and extract any relevant text or information.
Return a JSON object with your analysis.`,
};

// Provider-specific API implementations
abstract class VisionProvider {
  protected apiKey: string;
  protected endpoint: string;
  protected modelId: string;

  constructor(apiKey: string, endpoint: string, modelId: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.modelId = modelId;
  }

  abstract analyzeImage(input: VisionAnalysisInput): Promise<VisionAnalysisResult>;

  protected getPrompt(input: VisionAnalysisInput): string {
    if (input.prompt) return input.prompt;
    return DOCUMENT_PROMPTS[input.documentType || 'general'];
  }

  protected parseResponse(content: string): VisionAnalysisResult['parsed'] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isValidDocument: parsed.isValidDocument ?? false,
          documentType: parsed.documentType,
          extractedInfo: parsed.extractedInfo,
          confidence: parsed.confidence ?? 0,
          issues: parsed.issues,
        };
      }
    } catch {
      // If JSON parsing fails, return basic result
    }
    return {
      isValidDocument: false,
      confidence: 0,
      issues: ['Could not parse AI response'],
    };
  }
}

// DeepSeek VL2 Provider
class DeepSeekVLProvider extends VisionProvider {
  async analyzeImage(input: VisionAnalysisInput): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    const prompt = this.getPrompt(input);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${input.imageType};base64,${input.imageBase64}`,
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const responseTimeMs = Date.now() - startTime;

      return {
        success: true,
        content,
        parsed: this.parseResponse(content),
        tokensUsed: data.usage?.total_tokens || 0,
        responseTimeMs,
        model: this.modelId,
      };
    } catch (error: any) {
      return {
        success: false,
        content: '',
        tokensUsed: 0,
        responseTimeMs: Date.now() - startTime,
        model: this.modelId,
        error: error.message,
      };
    }
  }
}

// Alibaba Qwen-VL Provider
class QwenVLProvider extends VisionProvider {
  async analyzeImage(input: VisionAnalysisInput): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    const prompt = this.getPrompt(input);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelId,
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  {
                    image: `data:${input.imageType};base64,${input.imageBase64}`,
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          },
          parameters: {
            max_tokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Qwen API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const content = data.output?.choices?.[0]?.message?.content?.[0]?.text ||
                      data.output?.text || '';
      const responseTimeMs = Date.now() - startTime;

      return {
        success: true,
        content,
        parsed: this.parseResponse(content),
        tokensUsed: data.usage?.total_tokens || 0,
        responseTimeMs,
        model: this.modelId,
      };
    } catch (error: any) {
      return {
        success: false,
        content: '',
        tokensUsed: 0,
        responseTimeMs: Date.now() - startTime,
        model: this.modelId,
        error: error.message,
      };
    }
  }
}

// Zhipu GLM-4V Provider
class GLM4VProvider extends VisionProvider {
  async analyzeImage(input: VisionAnalysisInput): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    const prompt = this.getPrompt(input);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${input.imageType};base64,${input.imageBase64}`,
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`GLM API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const responseTimeMs = Date.now() - startTime;

      return {
        success: true,
        content,
        parsed: this.parseResponse(content),
        tokensUsed: data.usage?.total_tokens || 0,
        responseTimeMs,
        model: this.modelId,
      };
    } catch (error: any) {
      return {
        success: false,
        content: '',
        tokensUsed: 0,
        responseTimeMs: Date.now() - startTime,
        model: this.modelId,
        error: error.message,
      };
    }
  }
}

// Factory function to get vision model provider
export async function getVisionProvider(modelName?: string): Promise<VisionProvider> {
  // If no model specified, get from site settings
  if (!modelName) {
    const settingResult = await query(
      "SELECT value FROM site_settings WHERE key = 'ekyc_model'"
    );
    modelName = settingResult.rows[0]?.value?.replace(/"/g, '') || 'deepseek-vl2';
  }

  // Get model config from database
  const result = await query(
    "SELECT * FROM ai_models WHERE name = $1 AND model_type = 'vision' AND is_active = true",
    [modelName]
  );

  if (result.rows.length === 0) {
    throw new Error(`Vision model ${modelName} not found or not active`);
  }

  const modelConfig = result.rows[0];

  // Get API key from environment based on provider
  const apiKeyMap: Record<string, string | undefined> = {
    siliconflow: process.env.SILICONFLOW_API_KEY,
    alibaba: process.env.ALIBABA_API_KEY,
    zhipu: process.env.ZHIPU_API_KEY,
  };

  const apiKey = apiKeyMap[modelConfig.provider];
  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${modelConfig.provider}`);
  }

  // Create appropriate provider instance
  // SiliconFlow uses OpenAI-compatible format, same as DeepSeek's format
  switch (modelConfig.provider) {
    case 'siliconflow':
      return new DeepSeekVLProvider(apiKey, modelConfig.api_endpoint, modelConfig.model_id);
    case 'alibaba':
      return new QwenVLProvider(apiKey, modelConfig.api_endpoint, modelConfig.model_id);
    case 'zhipu':
      return new GLM4VProvider(apiKey, modelConfig.api_endpoint, modelConfig.model_id);
    default:
      throw new Error(`Unsupported vision provider: ${modelConfig.provider}`);
  }
}

// Check if eKYC is enabled
export async function isEkycEnabled(): Promise<boolean> {
  try {
    const result = await query(
      "SELECT value FROM site_settings WHERE key = 'ekyc_enabled'"
    );
    return result.rows[0]?.value === 'true' || result.rows[0]?.value === '"true"';
  } catch {
    return false;
  }
}

// Get all available vision models
export async function getVisionModels(): Promise<VisionModelConfig[]> {
  const result = await query(
    "SELECT id, name, display_name, provider, model_id, api_endpoint, cost_per_1k_tokens FROM ai_models WHERE model_type = 'vision' AND is_active = true ORDER BY priority"
  );

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    provider: row.provider,
    modelId: row.model_id,
    apiEndpoint: row.api_endpoint,
    costPer1kTokens: parseFloat(row.cost_per_1k_tokens),
  }));
}

// Test if an API key is valid for a given provider
export async function testVisionApiKey(
  provider: string,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  // Simple test image (1x1 white pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  // Note: DeepSeek VL2 requires SiliconFlow API, not DeepSeek's direct API
  const testEndpoints: Record<string, { url: string; model: string; format: 'openai' | 'alibaba' }> = {
    siliconflow: { url: 'https://api.siliconflow.cn/v1/chat/completions', model: 'deepseek-ai/deepseek-vl2', format: 'openai' },
    alibaba: { url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', model: 'qwen-vl-plus', format: 'alibaba' },
    zhipu: { url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4v', format: 'openai' },
  };

  const config = testEndpoints[provider];
  if (!config) {
    return { success: false, message: `Unknown provider: ${provider}. Use siliconflow, alibaba, or zhipu.` };
  }

  try {
    let response: Response;

    if (config.format === 'alibaba') {
      response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  { image: `data:image/png;base64,${testImageBase64}` },
                  { text: 'What color is this image? Reply with one word.' },
                ],
              },
            ],
          },
          parameters: { max_tokens: 10 },
        }),
      });
    } else {
      // OpenAI-compatible format (SiliconFlow, Zhipu)
      response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:image/png;base64,${testImageBase64}` } },
                { type: 'text', text: 'What color is this image? Reply with one word.' },
              ],
            },
          ],
          max_tokens: 10,
        }),
      });
    }

    if (response.ok) {
      return { success: true, message: 'API key is valid and working' };
    }

    const errorData = await response.text();

    // Check for specific auth errors
    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'Invalid API key or unauthorized access' };
    }

    return { success: false, message: `API error: ${response.status} - ${errorData.slice(0, 100)}` };
  } catch (error: any) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}
