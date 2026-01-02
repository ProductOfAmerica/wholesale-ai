import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

export interface ConversationHistory {
  speaker: string;
  text: string;
  timestamp: number;
}

export interface AnalysisResult {
  motivation_level: number;
  pain_points: string[];
  objection_detected: boolean;
  objection_type?: string | null;
  suggested_response: string;
  recommended_next_move: string;
  error?: string;
}

// Zod schema for structured response
const AnalysisSchema = z.object({
  motivation_level: z.number().min(1).max(10),
  pain_points: z.array(z.string()),
  objection_detected: z.boolean(),
  objection_type: z.string().nullable().optional(),
  suggested_response: z.string().max(200),
  recommended_next_move: z.string()
});

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return client;
}

function formatConversationForPrompt(history: ConversationHistory[], latestStatement: string): string {
  const conversationText = history
    .map(entry => `${entry.speaker}: ${entry.text}`)
    .join('\n');
  
  return `Conversation History:\n${conversationText}\n\nLatest Statement: ${latestStatement}`;
}

const SYSTEM_PROMPT = `You are an expert real estate negotiation coach analyzing seller conversations for wholesale real estate deals.

Your job is to analyze the conversation and provide strategic insights for the wholesaler.

Key areas to analyze:
1. Motivation Level (1-10): How motivated is the seller to sell quickly?
2. Pain Points: What problems/pressures is the seller facing?
3. Objection Detection: Is the seller raising objections?
4. Strategic Response: What should the wholesaler say next?
5. Next Move: What action should the wholesaler take?

Objection types include: price, timeline, process, trust, condition, competition

Respond ONLY with valid JSON matching the exact schema provided.`;

export async function analyzeConversation(
  history: ConversationHistory[], 
  latestStatement: string
): Promise<AnalysisResult> {
  try {
    const openai = getClient();
    
    const conversationPrompt = formatConversationForPrompt(history, latestStatement);
    
    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Analyze this conversation and provide strategic insights:\n\n${conversationPrompt}`
        }
      ],
      response_format: zodResponseFormat(AnalysisSchema, 'negotiation_analysis'),
      temperature: 0.3,
      max_tokens: 500
    });

    const message = completion.choices[0]?.message;
    
    if (message?.parsed) {
      return message.parsed;
    } else if (message?.refusal) {
      throw new Error(`Model refused to respond: ${message.refusal}`);
    } else {
      throw new Error('No valid response from OpenAI');
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
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}