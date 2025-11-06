import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TripGenerationInput {
  startDate: string;
  endDate: string;
  numPeople: number;
  budgetPerPerson?: number;
  city?: string;
  budgetRange?: string;
  travelType: string[];
  ageRange?: string;
  description?: string;
}

export interface AIModelResponse {
  content: string;
  tokensUsed: number;
  responseTimeMs: number;
  model: string;
}

export interface AIModelProvider {
  generateItinerary(input: TripGenerationInput): Promise<AIModelResponse>;
}

// OpenAI Provider
class OpenAIProvider implements AIModelProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateItinerary(input: TripGenerationInput): Promise<AIModelResponse> {
    const startTime = Date.now();

    const prompt = this.buildPrompt(input);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner. Generate detailed travel itineraries in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const responseTimeMs = Date.now() - startTime;

    return {
      content: response.choices[0].message.content || '{}',
      tokensUsed: response.usage?.total_tokens || 0,
      responseTimeMs,
      model: this.model
    };
  }

  private buildPrompt(input: TripGenerationInput): string {
    return `Generate a detailed travel itinerary with the following requirements:

- Start Date: ${input.startDate}
- End Date: ${input.endDate}
- Number of People: ${input.numPeople}
${input.budgetPerPerson ? `- Budget per Person: $${input.budgetPerPerson}` : ''}
${input.city ? `- City: ${input.city}` : ''}
${input.budgetRange ? `- Budget Range: ${input.budgetRange}` : ''}
- Travel Type: ${input.travelType.join(', ')}
${input.ageRange ? `- Age Range: ${input.ageRange}` : ''}
${input.description ? `- Additional Details: ${input.description}` : ''}

Return a JSON object with this structure:
{
  "title": "Trip title",
  "summary": "Brief trip summary",
  "totalEstimatedCost": 1000,
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Activity name",
          "description": "Activity description",
          "location": {
            "name": "Location name",
            "address": "Full address",
            "googlePlaceId": "place_id_if_available"
          },
          "category": "food|attraction|activity|accommodation|transport",
          "estimatedCost": 50,
          "estimatedDuration": 120,
          "tips": "Helpful tips"
        }
      ]
    }
  ]
}`;
  }
}

// Anthropic Provider
class AnthropicProvider implements AIModelProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateItinerary(input: TripGenerationInput): Promise<AIModelResponse> {
    const startTime = Date.now();

    const prompt = this.buildPrompt(input);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseTimeMs = Date.now() - startTime;
    const content = response.content[0].type === 'text' ? response.content[0].text : '{}';

    return {
      content,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      responseTimeMs,
      model: this.model
    };
  }

  private buildPrompt(input: TripGenerationInput): string {
    return `You are an expert travel planner. Generate a detailed travel itinerary with the following requirements:

- Start Date: ${input.startDate}
- End Date: ${input.endDate}
- Number of People: ${input.numPeople}
${input.budgetPerPerson ? `- Budget per Person: $${input.budgetPerPerson}` : ''}
${input.city ? `- City: ${input.city}` : ''}
${input.budgetRange ? `- Budget Range: ${input.budgetRange}` : ''}
- Travel Type: ${input.travelType.join(', ')}
${input.ageRange ? `- Age Range: ${input.ageRange}` : ''}
${input.description ? `- Additional Details: ${input.description}` : ''}

Return ONLY a valid JSON object (no markdown, no explanation) with this structure:
{
  "title": "Trip title",
  "summary": "Brief trip summary",
  "totalEstimatedCost": 1000,
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Activity name",
          "description": "Activity description",
          "location": {
            "name": "Location name",
            "address": "Full address"
          },
          "category": "food|attraction|activity|accommodation|transport",
          "estimatedCost": 50,
          "estimatedDuration": 120,
          "tips": "Helpful tips"
        }
      ]
    }
  ]
}`;
  }
}

// Google Gemini Provider
class GoogleProvider implements AIModelProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async generateItinerary(input: TripGenerationInput): Promise<AIModelResponse> {
    const startTime = Date.now();

    const prompt = this.buildPrompt(input);
    const model = this.client.getGenerativeModel({ model: this.model });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseTimeMs = Date.now() - startTime;

    return {
      content: response.text(),
      tokensUsed: 0, // Gemini doesn't provide token usage in the same way
      responseTimeMs,
      model: this.model
    };
  }

  private buildPrompt(input: TripGenerationInput): string {
    return `You are an expert travel planner. Generate a detailed travel itinerary in JSON format with the following requirements:

- Start Date: ${input.startDate}
- End Date: ${input.endDate}
- Number of People: ${input.numPeople}
${input.budgetPerPerson ? `- Budget per Person: $${input.budgetPerPerson}` : ''}
${input.city ? `- City: ${input.city}` : ''}
${input.budgetRange ? `- Budget Range: ${input.budgetRange}` : ''}
- Travel Type: ${input.travelType.join(', ')}
${input.ageRange ? `- Age Range: ${input.ageRange}` : ''}
${input.description ? `- Additional Details: ${input.description}` : ''}

Return ONLY valid JSON with the structure described.`;
  }
}

// Generic HTTP Provider for Chinese models
class HTTPProvider implements AIModelProvider {
  private apiKey: string;
  private endpoint: string;
  private model: string;

  constructor(apiKey: string, endpoint: string, model: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.model = model;
  }

  async generateItinerary(input: TripGenerationInput): Promise<AIModelResponse> {
    const startTime = Date.now();

    const prompt = this.buildPrompt(input);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert travel planner. Generate detailed travel itineraries in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const responseTimeMs = Date.now() - startTime;

    return {
      content: data.choices?.[0]?.message?.content || data.output?.text || '{}',
      tokensUsed: data.usage?.total_tokens || 0,
      responseTimeMs,
      model: this.model
    };
  }

  private buildPrompt(input: TripGenerationInput): string {
    return `Generate a detailed travel itinerary in JSON format with the following requirements:

- Start Date: ${input.startDate}
- End Date: ${input.endDate}
- Number of People: ${input.numPeople}
${input.budgetPerPerson ? `- Budget per Person: $${input.budgetPerPerson}` : ''}
${input.city ? `- City: ${input.city}` : ''}
${input.budgetRange ? `- Budget Range: ${input.budgetRange}` : ''}
- Travel Type: ${input.travelType.join(', ')}
${input.ageRange ? `- Age Range: ${input.ageRange}` : ''}
${input.description ? `- Additional Details: ${input.description}` : ''}`;
  }
}

// Factory function to create appropriate provider
export async function getAIProvider(modelName: string): Promise<AIModelProvider> {
  const { query } = await import('../db');

  const result = await query(
    'SELECT * FROM ai_models WHERE name = $1 AND is_active = true',
    [modelName]
  );

  if (result.rows.length === 0) {
    throw new Error(`AI model ${modelName} not found or not active`);
  }

  const modelConfig = result.rows[0];

  switch (modelConfig.provider) {
    case 'openai':
      return new OpenAIProvider(
        process.env.OPENAI_API_KEY!,
        modelConfig.model_id
      );

    case 'anthropic':
      return new AnthropicProvider(
        process.env.ANTHROPIC_API_KEY!,
        modelConfig.model_id
      );

    case 'google':
      return new GoogleProvider(
        process.env.GOOGLE_API_KEY!,
        modelConfig.model_id
      );

    case 'deepseek':
      return new HTTPProvider(
        process.env.DEEPSEEK_API_KEY!,
        modelConfig.api_endpoint || 'https://api.deepseek.com/v1/chat/completions',
        modelConfig.model_id
      );

    case 'alibaba':
      return new HTTPProvider(
        process.env.ALIBABA_API_KEY!,
        modelConfig.api_endpoint || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        modelConfig.model_id
      );

    case 'baidu':
      return new HTTPProvider(
        process.env.BAIDU_API_KEY!,
        modelConfig.api_endpoint || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
        modelConfig.model_id
      );

    case 'zhipu':
      return new HTTPProvider(
        process.env.ZHIPU_API_KEY!,
        modelConfig.api_endpoint || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        modelConfig.model_id
      );

    case 'moonshot':
      return new HTTPProvider(
        process.env.MOONSHOT_API_KEY!,
        modelConfig.api_endpoint || 'https://api.moonshot.cn/v1/chat/completions',
        modelConfig.model_id
      );

    default:
      throw new Error(`Unsupported AI provider: ${modelConfig.provider}`);
  }
}

export async function getDefaultAIModel(): Promise<string> {
  const { query } = await import('../db');

  const result = await query(
    'SELECT name FROM ai_models WHERE is_default = true AND is_active = true LIMIT 1'
  );

  if (result.rows.length === 0) {
    // Fallback to highest priority active model
    const fallback = await query(
      'SELECT name FROM ai_models WHERE is_active = true ORDER BY priority ASC LIMIT 1'
    );
    return fallback.rows[0]?.name || 'gpt-4-turbo';
  }

  return result.rows[0].name;
}
