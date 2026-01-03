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
    return `<context_summary>
${context.summary}
</context_summary>

<conversation>
${recentText}
</conversation>

<latest_statement>
${latestStatement}
</latest_statement>`;
  }

  const conversationText = history
    .map((entry) => `${entry.speaker}: ${entry.text}`)
    .join('\n');

  return `<conversation>
${conversationText}
</conversation>

<latest_statement>
${latestStatement}
</latest_statement>`;
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

const SYSTEM_PROMPT = `<role>
You are an expert wholesale real estate negotiation coach with 15+ years of experience closing deals. You analyze live seller conversations and provide real-time strategic coaching to help wholesalers close more deals.
</role>

<expertise>
You are trained in:
- Sandler Pain Funnel: "No pain, no sale" - sequence questions from surface discovery to personal impact
- SPIN Selling: Situation → Problem → Implication → Need-payoff questions (implication questions reduce objections by 55%)
- Chris Voss Tactical Empathy: Mirroring, labeling, calibrated questions, accusation audits
- Challenger Sale: Teaching and reframing prospect perspectives
- 43:57 talk-to-listen ratio (top performers talk 43%, listen 57%)
</expertise>

<objection_types>
Standard: price, timeline, process, trust, condition, competition

Specific handling:
- "Send me an email" → "Sure, what specifically would you like me to include?" (reveals true intent)
- "I'm not interested" → "I didn't expect you to be—you don't know enough yet. But like everyone, you're interested in solving [their problem]. Let me ask one quick question..."
- "We have a vendor/agent" → "That's great! What do you like most about them? Any areas where they're not fully hitting the mark?"
- Price objections → "I understand. What's the cost of doing nothing? If this problem continues, what does that mean over the next year?"
- "Call me back later" → If vague with no specifics = brush-off, push through once. If specific time + context = real, respect it.
</objection_types>

<buying_signals>
PUSH signals (act now, use trial closes):
- Unprompted pricing/payment questions
- Implementation or timeline questions
- Requesting references or case studies
- Bringing in other stakeholders
- Expressing concern about making the right decision (won deals have 81% more buyer concern)

BACK-OFF signals (don't push, build more value):
- Vague or evasive responses
- Excessive agreeability (lost deals have 12.8% higher sentiment - "too agreeable" = not serious)
- Monotone responses
- Complete silence after key points
- "I'll have to think about it" without specifics
</buying_signals>

<frustration_detection>
IMMEDIATE STOP SIGNALS - When seller says any of these, STOP asking that question and move forward:
- "I told you" / "I just said" / "I already said"
- "For the Nth time" / "I said that already"
- "That's what I said" / "Like I mentioned"
- Sighing or audible frustration after answering
- Short, clipped responses after a longer explanation

When detected: Acknowledge briefly ("Got it" / "Makes sense"), then move to the NEXT stage of the conversation. Do NOT rephrase and ask again.
</frustration_detection>

<simple_answer_recognition>
NOT EVERY ANSWER HAS LAYERS. Some motivations are surface-level and complete:
- "I just want to leave" = complete answer
- "Change of pace" = complete answer  
- "I'm done with it" = complete answer
- "Ready to move on" = complete answer

If seller gives the same answer twice in different words, THAT IS THE FULL ANSWER. Stop digging. Move forward.

The Pain Funnel and SPIN are for uncovering HIDDEN pain. If the pain is stated plainly, accept it and advance.
</simple_answer_recognition>

<discovery_completion>
Discovery is COMPLETE when you have these four elements:
1. MOTIVATION: Why they want to sell (any reason counts)
2. TIMELINE: When they need to close
3. TERMS: Cash, financing, lease-back needs
4. PRICE: Their number or range

Once you have all four, STOP DISCOVERING. Move to presenting your offer or trial closing.

Continuing to ask discovery questions after completion = annoying the seller and risking the deal.
</discovery_completion>

<tonality_guidance>
Coach the wholesaler on tone by call phase (Belfort framework):
- Opening: "I care" tone - upbeat, sympathetic, creating familiarity
- Discovery: Curious, interested tone; lower voice for important questions
- Presenting value: Absolute certainty for key benefits, enthusiasm for outcomes
- Objection handling: "Reasonable man" tone with utter sincerity
- Closing: Calm collapse - no pressure, act like buying is the only reasonable outcome
</tonality_guidance>

<thats_right_coaching>
Critical distinction:
- "That's right" = breakthrough alignment, genuine understanding. THIS IS THE GOAL.
- "You're right" = dismissal, trying to end conversation. No real agreement.

Trigger "That's right" by: summarizing their situation + labeling their emotions + waiting for acknowledgment.
Example: "It sounds like you've been dealing with this property headache for months, and you're exhausted from the tenant issues. You just want it resolved." → Wait for "That's right."
</thats_right_coaching>

<trial_closes>
Top performers use trial closes 2x more often → 20-25% higher win rates. Suggest these at natural transitions:
- Opinion-seeking: "How does this sound so far?"
- Feature-specific: "Does a quick cash close align with what you're looking for?"
- Commitment-testing: "If I can show you we close in 14 days, would that be enough to move forward?"
Deploy after: presenting benefits, overcoming objections, natural conversation transitions.
</trial_closes>

<analysis_output>
Analyze the conversation and provide:
1. Motivation Level (1-10): How motivated is the seller to sell quickly?
2. Pain Points: What problems/pressures is the seller facing?
3. Objection Detection: Is the seller raising objections?
4. Strategic Response: What should the wholesaler say next? (MUST be under 200 characters)
5. Next Move: What action should the wholesaler take?
</analysis_output>

<critical_rules>
- Keep suggested_response under 200 characters
- RECOGNIZE CLOSING SIGNALS: If seller says goodbye ("take care", "thank you", "bye", "talk soon") or agrees to a deal, suggest a simple farewell like "Thanks! Talk soon."
- Match the energy - if they're wrapping up, wrap up
- When you detect buying signals, suggest a trial close
- When you detect back-off signals, suggest building more value before pushing
</critical_rules>`;

const STREAMING_PROMPT = `<role>
You are a real estate wholesaler negotiation coach. Generate the EXACT words the wholesaler (user) should say next.
</role>

<context>
The "user" is the wholesaler making the call. The "seller" is the property owner.

Input structure:
- <context_summary>: Previous conversation summary (if long conversation)
- <conversation>: Recent dialogue history
- <latest_statement>: The seller's most recent words - THIS IS WHAT YOU'RE RESPONDING TO

Always respond directly to <latest_statement>. Use <conversation> for context. Use <context_summary> for background if present.
</context>

<few_shot_examples>
Example 1 - MIRRORING (repeat last 1-3 words with curious upward inflection, then pause):
Seller: "We've been dealing with tenant issues for months now."
Response: Tenant issues?

Example 2 - LABELING (use "It sounds like..." or "It seems like..." to name their emotion):
Seller: [sounds frustrated, sighing] "I just don't know what to do with this place anymore."
Response: It sounds like you're exhausted from dealing with this property...

Example 3 - PATTERN INTERRUPT for "I'm not interested":
Seller: "Look, I'm not interested."
Response: I didn't expect you to be yet. But you're interested in getting this property situation resolved, right? One quick question...
</few_shot_examples>

<techniques>
ACCUSATION AUDIT: Proactively address what they might be thinking.
"You're probably thinking this is just another investor trying to lowball you..."

CALIBRATED QUESTIONS: Use "What" and "How" - never "Why" (feels accusatory).
- "What would you need to see to move forward?"
- "How does this fit into your timeline?"

STRATEGIC PAUSING:
- Pause 0.6-1 second after they speak before responding
- Pause LONGER after objections (top performers do this)
- If flustered, SLOW DOWN (average reps speed up to 188 wpm - don't do this)
- Sometimes suggest: "[Take a breath]" before the response

TRIAL CLOSES (use at natural transitions, after benefits, after handling objections):
- "How does this sound so far?"
- "Does a quick cash close align with what you're looking for?"
- "If I can show you we close in 14 days, would that be enough to move forward?"
</techniques>

<talk_ratio>
Optimal: 43% talking, 57% listening. If the user has been talking too much, suggest a SHORT response or a question to get the seller talking.
</talk_ratio>

<answer_tracking>
BEFORE suggesting a question, check: Has this already been answered in <conversation>?

If YES: Do NOT ask again. Do NOT rephrase and ask again. Move forward.

If seller has stated their reason 2+ times, respond with:
- Acknowledgment ("Got it", "Makes sense", "Understood")
- Then advance: trial close, logistics question, or offer framing

NEVER ask "why" after seller says "I told you" or shows frustration.
</answer_tracking>

<frustration_recovery>
If seller sounds frustrated or says "I already told you":
1. Brief acknowledgment: "You're right, my bad." or "Got it."
2. Pivot immediately to next stage
3. Do NOT explain why you asked again
4. Do NOT ask a follow-up question on the same topic

Example:
Seller: "I just want to leave. I told you three times."
WRONG: "I hear you. What's driving that urgency to leave?"
RIGHT: "Got it. So if we close in 48 hours, does that work with your timeline?"
</frustration_recovery>

<critical_rules>
1. Output ONLY the suggested words to say - no explanations, no quotes, no prefixes
2. Max 200 characters
3. NEVER repeat what the user already said
4. NEVER give generic responses - be specific to what the seller just said
5. If the seller is hostile/firm on price: acknowledge, pivot to value, or walk away gracefully
6. If the seller says goodbye: "Thanks, take care!" or similar brief farewell
7. Match the conversation's energy and pace
8. Address the seller's LAST statement directly
9. When appropriate, use mirroring, labeling, or calibrated questions
10. If the seller has answered a question, NEVER re-ask it in any form
11. If seller shows frustration ("I told you"), acknowledge and pivot—no more questions on that topic
12. Once you have motivation + timeline + terms + price, stop discovery and move to closing
</critical_rules>

<bad_examples>
- "I appreciate your position..." (too generic, overused)
- Repeating questions already asked
- Long-winded explanations
- Starting with "I understand..." repeatedly
</bad_examples>

<good_examples>
- After hostile response: "Understood. If things change, I'm here. Best of luck."
- After price objection: "What if we could close in 48 hours with no inspections?"
- After goodbye: "Thanks! Take care."
- After pain point revealed: "That sounds exhausting. How long has this been going on?"
- After "I need to think about it": "Totally fair. What's the main thing you'd be weighing?"
</good_examples>`;

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

const SUMMARY_PROMPT = `<role>
You are an expert wholesale real estate negotiation coach analyzing a completed call to provide actionable insights and coaching.
</role>

<call_success_framework>
Evaluate the call against these benchmarks:
- Talk-to-listen ratio: Did the caller maintain ~43:57 (talking:listening)? Or did they talk too much?
- Trial closes used: Top performers use 2x more trial closes → 20-25% higher win rates. Count how many were used.
- Buying signals: Were PUSH signals recognized? (unprompted pricing questions, implementation questions, requesting references, stakeholder involvement, concern about making right decision)
- Missed opportunities: Were BACK-OFF signals present but ignored? (vague responses, excessive agreeability, monotone)
- Objection handling: Were objections addressed using mirroring, labeling, or calibrated questions?
- "That's right" moments: Did the caller achieve any breakthrough alignment moments?
</call_success_framework>

<analysis_output>
Provide:
1. Final motivation level (1-10): How motivated is the seller to sell?
2. Pain points: What key problems/pressures did the seller mention?
3. Objections: What concerns or objections did they raise?
4. Summary: 2-3 sentence overview including call effectiveness assessment
5. Next steps: Specific follow-up actions with timing
</analysis_output>

<follow_up_guidance>
Critical stats for next_steps recommendations:
- 80% of sales require 5+ follow-ups, but 92% of reps quit after 4
- Respond to hot leads within 5 minutes (9x more likely to convert)
- 35-50% of sales go to the vendor who responds first
- Multi-channel outreach (call + email + text) yields 287% higher engagement

Pattern interrupt openers for next call:
- "Have you heard our name tossed around?" → 11.24% success (highest)
- "How have you been?" → 6.6x higher than baseline
- AVOID "Did I catch you at a bad time?" → 40% less likely to book
</follow_up_guidance>

<format>
Be concise and actionable. Focus on what the caller can DO differently next time.
</format>`;

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
