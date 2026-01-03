import Anthropic from '@anthropic-ai/sdk';
import type { AISuggestion, TranscriptEntry } from '@wholesale-ai/shared';
import { z } from 'zod';

// Zod schema for structured response
const AnalysisSchema = z.object({
  motivation_level: z.number().min(1).max(10),
  pain_points: z.array(z.string()),
  objection_detected: z.boolean(),
  objection_type: z.string().nullable().optional(),
  suggested_response: z.string().max(200),
  recommended_next_move: z.string(),
});

// Tool schema for Anthropic
const analysisResultTool = {
  name: 'provide_analysis',
  description: 'Provide structured analysis of the negotiation conversation',
  input_schema: {
    type: 'object' as const,
    properties: {
      motivation_level: { type: 'number' as const, minimum: 1, maximum: 10 },
      pain_points: {
        type: 'array' as const,
        items: { type: 'string' as const },
      },
      objection_detected: { type: 'boolean' as const },
      objection_type: {
        type: 'string' as const,
        description: 'Type of objection if detected',
      },
      suggested_response: { type: 'string' as const, maxLength: 200 },
      recommended_next_move: { type: 'string' as const },
    },
    required: [
      'motivation_level',
      'pain_points',
      'objection_detected',
      'suggested_response',
      'recommended_next_move',
    ],
  },
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    console.log(
      'Initializing Anthropic client with API key:',
      `${apiKey.substring(0, 20)}...`
    );

    client = new Anthropic({
      apiKey,
    });
  }
  return client;
}

function formatConversationForPrompt(
  history: TranscriptEntry[],
  latestStatement: string
): string {
  const conversationText = history
    .map((entry) => `${entry.speaker}: ${entry.text}`)
    .join('\n');

  return `Conversation History:\n${conversationText}\n\nLatest Statement: ${latestStatement}`;
}

const SYSTEM_PROMPT = `You are an expert real estate negotiation coach analyzing seller conversations for wholesale real estate deals.

Your job is to analyze the conversation and provide strategic insights for the wholesaler.

Key areas to analyze:
1. Motivation Level (1-10): How motivated is the seller to sell quickly?
2. Pain Points: What problems/pressures is the seller facing?
3. Objection Detection: Is the seller raising objections?
4. Strategic Response: What should the wholesaler say next? (MUST be under 200 characters)
5. Next Move: What action should the wholesaler take?

Objection types include: price, timeline, process, trust, condition, competition

CRITICAL: Keep suggested_response under 200 characters. Be concise and direct.

Respond ONLY with valid JSON matching the exact schema provided.`;

export async function analyzeConversation(
  history: TranscriptEntry[],
  latestStatement: string
): Promise<AISuggestion> {
  try {
    const anthropic = getClient();

    const conversationPrompt = formatConversationForPrompt(
      history,
      latestStatement
    );

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${SYSTEM_PROMPT}\n\nAnalyze this conversation and provide strategic insights using the provide_analysis tool:\n\n${conversationPrompt}`,
        },
      ],
      tools: [analysisResultTool],
      tool_choice: { type: 'tool', name: 'provide_analysis' },
    });

    // Extract the tool result from the response
    const toolResult = response.content.find(
      (content) =>
        content.type === 'tool_use' && content.name === 'provide_analysis'
    );

    if (toolResult?.type === 'tool_use' && 'input' in toolResult) {
      // Ensure suggested_response is within character limit
      const input = toolResult.input as Record<string, unknown>;
      if (
        typeof input.suggested_response === 'string' &&
        input.suggested_response.length > 200
      ) {
        input.suggested_response = `${input.suggested_response.substring(0, 197)}...`;
        console.log(
          'Truncated suggested_response to fit 200 char limit:',
          input.suggested_response
        );
      }

      // Validate with Zod before returning
      return AnalysisSchema.parse(input);
    } else {
      throw new Error('No analysis result found in response');
    }
  } catch (error) {
    console.error('AI Analysis Error:', error);

    // Return fallback response with error info
    return {
      motivation_level: 5,
      pain_points: [],
      objection_detected: false,
      objection_type: null,
      suggested_response: 'Continue the conversation naturally.',
      recommended_next_move: 'Keep building rapport',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
