import Anthropic from '@anthropic-ai/sdk';
import type { AISuggestion, CallSummary, TranscriptEntry } from '@wholesale-ai/shared';
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

interface ConversationContext {
  summary?: string;
  recentHistory: TranscriptEntry[];
}

const conversationContexts = new Map<string, ConversationContext>();

export function getConversationContext(socketId: string): ConversationContext {
  return conversationContexts.get(socketId) || { recentHistory: [] };
}

export function setConversationContext(socketId: string, context: ConversationContext): void {
  conversationContexts.set(socketId, context);
}

export function clearConversationContext(socketId: string): void {
  conversationContexts.delete(socketId);
}

const RECENT_TURNS_LIMIT = 6;
const SUMMARIZE_THRESHOLD = 10;

function formatConversationForPrompt(
  history: TranscriptEntry[],
  latestStatement: string,
  context?: ConversationContext
): string {
  if (context?.summary && history.length > RECENT_TURNS_LIMIT) {
    const recentHistory = history.slice(-RECENT_TURNS_LIMIT);
    const recentText = recentHistory
      .map((entry) => `${entry.speaker}: ${entry.text}`)
      .join('\n');
    return `Previous Context Summary:\n${context.summary}\n\nRecent Conversation:\n${recentText}\n\nLatest Statement: ${latestStatement}`;
  }

  const conversationText = history
    .map((entry) => `${entry.speaker}: ${entry.text}`)
    .join('\n');

  return `Conversation History:\n${conversationText}\n\nLatest Statement: ${latestStatement}`;
}

async function summarizeConversation(history: TranscriptEntry[]): Promise<string> {
  try {
    const anthropic = getClient();
    const conversationText = history
      .map((entry) => `${entry.speaker}: ${entry.text}`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Summarize this real estate negotiation conversation in 2-3 sentences, capturing key points, seller motivation, and any objections:\n\n${conversationText}`,
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  } catch (error) {
    console.error('Failed to summarize conversation:', error);
    return '';
  }
}

export async function updateConversationContext(
  socketId: string,
  fullHistory: TranscriptEntry[]
): Promise<void> {
  if (fullHistory.length < SUMMARIZE_THRESHOLD) return;
  
  const context = getConversationContext(socketId);
  const historyToSummarize = fullHistory.slice(0, -RECENT_TURNS_LIMIT);
  
  if (historyToSummarize.length > (context.recentHistory?.length || 0)) {
    const summary = await summarizeConversation(historyToSummarize);
    if (summary) {
      setConversationContext(socketId, {
        summary,
        recentHistory: fullHistory.slice(-RECENT_TURNS_LIMIT),
      });
      console.log(`Updated conversation context for ${socketId}`);
    }
  }
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

CRITICAL RULES:
- Keep suggested_response under 200 characters
- RECOGNIZE CLOSING SIGNALS: If the seller says goodbye ("take care", "thank you", "bye", "talk soon", etc.) or agrees to a deal, DO NOT suggest continuing the conversation
- When a deal is agreed upon and the call is ending, suggested_response should be a simple farewell like "Thanks! Talk soon." or "Perfect, bye!"
- Don't over-explain or prolong conversations unnecessarily
- Match the energy - if they're wrapping up, wrap up

Respond ONLY with valid JSON matching the exact schema provided.`;

const STREAMING_PROMPT = `You are a real estate wholesaler negotiation coach. Generate the EXACT words the wholesaler (user) should say next.

CONTEXT: The "user" is the wholesaler making the call. The "seller" is the property owner.

CRITICAL RULES:
1. Output ONLY the suggested words to say - no explanations, no quotes, no prefixes
2. Max 200 characters
3. NEVER repeat what the user already said
4. NEVER give generic responses - be specific to what the seller just said
5. If seller is hostile/firm on price: acknowledge their position, pivot to value or walk away gracefully
6. If seller says goodbye: just say "Thanks, take care!" or similar brief farewell
7. Match the conversation's energy and pace
8. Address the seller's LAST statement directly

BAD EXAMPLES (never do these):
- "I appreciate your position..." (too generic, overused)
- Repeating questions already asked
- Long-winded explanations

GOOD EXAMPLES:
- After hostile response: "Understood. If things change, I'm here. Best of luck."
- After price objection: "What if we could close in 48 hours with no inspections?"
- After goodbye: "Thanks! Take care."`;

export async function streamSuggestedResponse(
  history: TranscriptEntry[],
  latestStatement: string,
  onToken: (token: string) => void,
  socketId?: string
): Promise<string> {
  try {
    const anthropic = getClient();
    const context = socketId ? getConversationContext(socketId) : undefined;
    const conversationPrompt = formatConversationForPrompt(history, latestStatement, context);

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `${STREAMING_PROMPT}\n\n${conversationPrompt}`,
        },
      ],
    });

    let fullResponse = '';

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const token = event.delta.text;
        fullResponse += token;
        onToken(token);
      }
    }

    return fullResponse.trim();
  } catch (error) {
    console.error('Streaming error:', error);
    throw error;
  }
}

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

    const toolResult = response.content.find(
      (content) =>
        content.type === 'tool_use' && content.name === 'provide_analysis'
    );

    if (toolResult?.type === 'tool_use' && 'input' in toolResult) {
      const input = toolResult.input as Record<string, unknown>;
      if (
        typeof input.suggested_response === 'string' &&
        input.suggested_response.length > 200
      ) {
        input.suggested_response = `${input.suggested_response.substring(0, 197)}...`;
      }

      return AnalysisSchema.parse(input);
    } else {
      throw new Error('No analysis result found in response');
    }
  } catch (error) {
    console.error('AI Analysis Error:', error);

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

const SummarySchema = z.object({
  final_motivation_level: z.number().min(1).max(10),
  pain_points: z.array(z.string()),
  objections: z.array(z.string()),
  summary: z.string(),
  next_steps: z.string(),
});

const summaryTool = {
  name: 'provide_summary',
  description: 'Provide a structured summary of the completed call',
  input_schema: {
    type: 'object' as const,
    properties: {
      final_motivation_level: { type: 'number' as const, minimum: 1, maximum: 10 },
      pain_points: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Key pain points identified during the call',
      },
      objections: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Objections raised by the seller',
      },
      summary: {
        type: 'string' as const,
        description: 'Brief 2-3 sentence summary of the call',
      },
      next_steps: {
        type: 'string' as const,
        description: 'Recommended follow-up actions',
      },
    },
    required: ['final_motivation_level', 'pain_points', 'objections', 'summary', 'next_steps'],
  },
};

const SUMMARY_PROMPT = `You are an expert real estate negotiation coach. Analyze this completed call transcript and provide a concise summary.

Focus on:
1. Final motivation level (1-10): How motivated is the seller to sell?
2. Pain points: What key problems/pressures did the seller mention?
3. Objections: What concerns or objections did they raise?
4. Summary: 2-3 sentence overview of how the call went
5. Next steps: What should the caller do next to move this deal forward?

Be concise and actionable.`;

export async function generateCallSummary(
  history: TranscriptEntry[],
  duration: number
): Promise<CallSummary> {
  try {
    const anthropic = getClient();

    const conversationText = history
      .map((entry) => `${entry.speaker}: ${entry.text}`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${SUMMARY_PROMPT}\n\nCall Duration: ${Math.floor(duration / 60)}m ${duration % 60}s\n\nTranscript:\n${conversationText}`,
        },
      ],
      tools: [summaryTool],
      tool_choice: { type: 'tool', name: 'provide_summary' },
    });

    const toolResult = response.content.find(
      (content) =>
        content.type === 'tool_use' && content.name === 'provide_summary'
    );

    if (toolResult?.type === 'tool_use' && 'input' in toolResult) {
      const validated = SummarySchema.parse(toolResult.input);
      return {
        duration,
        ...validated,
      };
    } else {
      throw new Error('No summary result found in response');
    }
  } catch (error) {
    console.error('Call Summary Error:', error);
    return {
      duration,
      final_motivation_level: 5,
      pain_points: [],
      objections: [],
      summary: 'Unable to generate summary.',
      next_steps: 'Follow up with the seller.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
