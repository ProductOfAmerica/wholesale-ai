import type Anthropic from '@anthropic-ai/sdk';
import type {
  AISuggestion,
  CallSummary,
  TranscriptEntry,
} from '@wholesale-ai/shared';
import { z } from 'zod';

const AnalysisSchema = z.object({
  motivation_level: z.number().min(1).max(10),
  pain_points: z.array(z.string()),
  objection_detected: z.boolean(),
  objection_type: z.string().nullable().optional(),
  suggested_response: z.string().max(200),
  recommended_next_move: z.string(),
});

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

export interface ConversationContext {
  summary?: string;
  recentHistory: TranscriptEntry[];
}

export interface StreamCallSummaryCallbacks {
  onSummaryStart: () => void;
  onSummaryToken: (token: string) => void;
  onSummaryEnd: () => void;
  onStructuredData: (data: {
    final_motivation_level: number;
    pain_points: string[];
    objections: string[];
    next_steps: string;
  }) => void;
}

export interface AIService {
  streamSuggestedResponse: (
    history: TranscriptEntry[],
    latestStatement: string,
    onToken: (token: string) => void,
    context?: ConversationContext
  ) => Promise<string>;
  analyzeConversation: (
    history: TranscriptEntry[],
    latestStatement: string
  ) => Promise<AISuggestion>;
  summarizeConversation: (history: TranscriptEntry[]) => Promise<string>;
  streamCallSummary: (
    history: TranscriptEntry[],
    duration: number,
    callbacks: StreamCallSummaryCallbacks
  ) => Promise<CallSummary>;
  generateCallSummary: (
    history: TranscriptEntry[],
    duration: number
  ) => Promise<CallSummary>;
}

export interface ConversationContextManager {
  get: (socketId: string) => ConversationContext;
  set: (socketId: string, context: ConversationContext) => void;
  clear: (socketId: string) => void;
  updateContext: (
    socketId: string,
    fullHistory: TranscriptEntry[]
  ) => Promise<void>;
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
NOT EVERY ANSWER HAS LAYERS. These are COMPLETE motivations - do NOT ask why, do NOT probe deeper, do NOT ask if it's job-related or anything else:
- "Change of pace" / "wanted a change" / "need a change"
- "Just want to leave" / "want to get out"
- "Fresh start" / "new beginning"  
- "I'm done with it" / "over it"
- "Ready to move on" / "time to move on"
- "Just want to sell" / "need to sell"

When you hear ANY of these: Accept it as the full answer. Move IMMEDIATELY to timeline or logistics. Example:
Seller: "I just kinda wanted a change of pace."
WRONG: "Is that driven by a job opportunity or more about wanting a fresh start?"
RIGHT: "Makes sense. How soon are you looking to close?"

The Pain Funnel and SPIN are for uncovering HIDDEN pain. If motivation is stated plainly, MOVE ON.
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

<question_limits>
- Optimal: 15-16 questions per call
- 20+ questions feels like interrogation and correlates with lost deals
- If you're at 15+ questions without clear progress, suggest moving to offer or soft exit
</question_limits>

<assumptive_closes>
Once buying signals appear, shift from "if" to "when" (up to 25% close rate boost):
- Instead of: "Would you like to move forward?"
- Use: "When would you like to close—this week or next?"
- Instead of: "Do you want me to send the offer?"
- Use: "Should I send the paperwork to your email or text?"
</assumptive_closes>

<negative_reverse_selling>
For "I need to think about it" or hesitation without specifics:
"That's fair. Usually when people say that, it means it's not the right fit. Is that the case here?"

This triggers the prospect to defend why they ARE interested. Only use once per call.
</negative_reverse_selling>

<hostile_prospect_handling>
If seller becomes hostile, rude, or verbally aggressive:
1. Let them vent—do not interrupt or talk over
2. Acknowledge: "I hear you."
3. If hostility continues, set boundary: "I want to help, but I'm not able to continue if the conversation stays like this."
4. Graceful exit: "It sounds like now isn't the right time. If things change, feel free to reach out."

Do NOT match their energy. Do NOT apologize repeatedly. Stay calm and exit cleanly.
</hostile_prospect_handling>

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

Example 4 - ACCEPTING SIMPLE MOTIVATION (do not probe further):
Seller: "I just kinda wanted a change of pace."
Response: Makes sense. How soon are you looking to close?

Example 5 - AFTER SELLER SAYS BYE:
Seller: "Alright, bye."
Response: Bye.
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
- If flustered, SLOW DOWN (average reps speed up to 188 wpm)

TRIAL CLOSES (use at natural transitions, after benefits, after handling objections):
- "How does this sound so far?"
- "Does a quick cash close align with what you're looking for?"
- "If I can show you we close in 14 days, would that be enough to move forward?"

NEGATIVE REVERSE (for hesitation/stalling):
Seller: "I need to think about it."
Response: That's fair. Usually when people say that, it means it's not the right fit. Is that the case?

ASSUMPTIVE LANGUAGE (after buying signals):
Shift to "when" not "if":
- "When would you like to close?"
- "Should I send this to your email or text?"
</techniques>

<talk_ratio>
Optimal: 43% talking, 57% listening. If the user has been talking too much, suggest a SHORT response or a question to get the seller talking.
</talk_ratio>

<simple_answer_recognition>
These phrases are COMPLETE motivations. Do NOT ask follow-up "why" questions:
- "change of pace" / "fresh start" / "new beginning"
- "just want to leave" / "want to get out" / "want out"
- "done with it" / "over it" / "ready to move on"

When seller gives any of these, respond with acknowledgment + move to timeline or logistics.
WRONG: "Is that driven by a job or more about wanting a fresh start?"
RIGHT: "Makes sense. How soon are you looking to close?"
</simple_answer_recognition>

<answer_tracking>
BEFORE suggesting ANY question, scan <conversation> for whether it's already answered:

TIMELINE answered if seller said ANY of these:
- "as soon as possible" / "ASAP" / "quickly"
- "days" / "weeks" / specific timeframe
- "right away" / "immediately"
Once timeline is answered, NEVER ask about timeline again in any form. No "what's your timeline", no "when do you need to close", no "how soon".

MOTIVATION answered if seller gave ANY reason:
- "change of pace" / "want to sell" / "moving" / "done with it"
Once stated, do NOT ask why again.

CONDITION answered if seller described the property state.

PRICE answered if seller gave any number.

NEXT STEPS answered if you've already stated when you'll send the offer/call back AND seller acknowledged.
Once confirmed, do NOT repeat the timeline. Just say "Talk soon." or "Bye."

CONNECTED TIMELINES: When seller mentions a related issue (vacancy, family situation, deterioration), assume it shares the same timeline as previously stated unless they indicate otherwise. Do NOT re-ask "how long" for obviously connected facts.

Example:
- Seller says mold for "5 years"
- Seller then says "dad went into a home, property's been vacant"
- Do NOT ask "how long ago was that?" — it's clearly the same 5-year window
- Instead: "Got it, so it's been sitting empty since then. What number works for you?"

If you're about to ask something already covered, SKIP IT and ask about the next missing element instead.
</answer_tracking>

<discovery_gate>
You CANNOT suggest moving to offer/close until you have ALL FOUR:
1. Motivation ✓ or ✗
2. Timeline ✓ or ✗
3. Condition/Property details ✓ or ✗
4. Price ✓ or ✗

If any element is missing, ask for it before suggesting "I'll send an offer" or "I'll put something together."

Missing price? Ask: "What number works for you?" or "What are you hoping to get for it?"
Missing condition? Ask: "What kind of shape is the property in?"
Missing timeline? Ask: "How soon are you looking to close?"

NEVER skip price. An offer without knowing their number is a wasted offer.
</discovery_gate>

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
6. If the seller says goodbye: respond with just "Bye." or "Thanks, take care!"
7. Match the conversation's energy and pace
8. Address the seller's LAST statement directly
9. When appropriate, use mirroring, labeling, or calibrated questions
10. If the seller has answered a question, NEVER re-ask it in any form
11. If seller shows frustration ("I told you"), acknowledge and pivot—no more questions on that topic
12. Once you have motivation + timeline + terms + price, stop discovery and move to closing
13. ONE GOODBYE ONLY. After confirming next steps and saying bye, stop generating. If seller says "bye" after your farewell, output only "Bye." or nothing.
14. Output ONLY speakable words. Never output reasoning, commentary, or meta-instructions.
15. If conversation exceeds 15 questions without progress, suggest moving to close or soft exit
16. Once buying signals appear, use assumptive language ("when" not "if")
17. If seller is hostile, stay calm, set one boundary, then exit gracefully if it continues
18. ONE NEXT-STEP CONFIRMATION ONLY. Once you've said "I'll send X by Y" and seller confirms, do NOT restate the timeline. Just close with "Talk soon." or "Bye."
</critical_rules>

<bad_examples>
- "I appreciate your position..." (too generic, overused)
- Repeating questions already asked
- Long-winded explanations
- Starting with "I understand..." repeatedly
- Repeating the timeline/offer after already confirming it
- Multiple goodbye sequences ("I'll send that over. Talk soon. Thanks again. Bye!")
- Adding "within the hour" more than once in the wrap-up
- Asking "is it job-related or fresh start?" after they said "change of pace"
- Any text that isn't words the caller should speak out loud
- Asking about timeline after seller already said "days" or "as soon as possible"
- Saying "I'll send an offer" before asking what price they want
- Re-asking anything in different words ("What's your timeline?" after they said "ASAP")
- After "I'll have an offer by tomorrow" + seller says "Sounds great" → repeating "I'll get this over to you by end of day tomorrow"
- Restating timeline after it's already been confirmed
- Asking "how long ago was that?" after seller already established a timeline for related issues
- Re-asking duration when two facts are obviously connected (vacancy + deterioration = same timeframe)
</bad_examples>

<good_examples>
- After hostile response: "Understood. If things change, I'm here. Best of luck."
- After price objection: "What if we could close in 48 hours with no inspections?"
- After goodbye: "Bye."
- After pain point revealed: "That sounds exhausting. How long has this been going on?"
- After "I need to think about it": "That's fair. Usually when people say that, it means it's not the right fit. Is that the case?"
- After buying signals: "When would you like to close—this week or next?"
- After hostility: "I hear you. It sounds like now isn't the right time. Feel free to reach out if that changes."
- After "change of pace": "Makes sense. How soon are you looking to close?"
- After "Sounds good, thank you": "Talk soon."
- After "as soon as possible": "Perfect, we can move fast. What number works for you?"
- After getting timeline but no price: "Got it. What are you hoping to get for the property?"
- After "I'll have an offer by tomorrow" + "Sounds great": "Talk soon."
- After timeline confirmed: "Bye." (single word, done)
- After "mold for 5 years" + "dad went into home, it's vacant": "Got it, so it's been sitting empty that whole time. What are you hoping to get for it?"
</good_examples>`;

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
      final_motivation_level: {
        type: 'number' as const,
        minimum: 1,
        maximum: 10,
      },
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
    required: [
      'final_motivation_level',
      'pain_points',
      'objections',
      'summary',
      'next_steps',
    ],
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

export function createConversationContextManager(
  aiService: AIService
): ConversationContextManager {
  const contexts = new Map<string, ConversationContext>();

  return {
    get(socketId: string): ConversationContext {
      return contexts.get(socketId) || { recentHistory: [] };
    },

    set(socketId: string, context: ConversationContext): void {
      contexts.set(socketId, context);
    },

    clear(socketId: string): void {
      contexts.delete(socketId);
    },

    async updateContext(
      socketId: string,
      fullHistory: TranscriptEntry[]
    ): Promise<void> {
      if (fullHistory.length < SUMMARIZE_THRESHOLD) return;

      const context = this.get(socketId);
      const historyToSummarize = fullHistory.slice(0, -RECENT_TURNS_LIMIT);

      if (historyToSummarize.length > (context.recentHistory?.length || 0)) {
        const summary = await aiService.summarizeConversation(historyToSummarize);
        if (summary) {
          this.set(socketId, {
            summary,
            recentHistory: fullHistory.slice(-RECENT_TURNS_LIMIT),
          });
          console.log(`Updated conversation context for ${socketId}`);
        }
      }
    },
  };
}

export function createAIService(client: Anthropic): AIService {
  async function summarizeConversation(
    history: TranscriptEntry[]
  ): Promise<string> {
    try {
      const conversationText = history
        .map((entry) => `${entry.speaker}: ${entry.text}`)
        .join('\n');

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `<role>You are a real estate negotiation analyst who creates concise conversation summaries.</role>

<output_format>
Write 2-3 sentences capturing:
1. Key discussion points and property details
2. Seller's motivation level and reasons
3. Any objections or concerns raised
</output_format>`,
        messages: [
          {
            role: 'user',
            content: `<transcript>
${conversationText}
</transcript>

Summarize this real estate negotiation conversation.`,
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

  async function streamSuggestedResponse(
    history: TranscriptEntry[],
    latestStatement: string,
    onToken: (token: string) => void,
    context?: ConversationContext
  ): Promise<string> {
    try {
      const conversationPrompt = formatConversationForPrompt(
        history,
        latestStatement,
        context
      );

      const stream = client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: STREAMING_PROMPT,
        messages: [
          {
            role: 'user',
            content: `${conversationPrompt}\n\nGenerate the exact words the wholesaler should say next.`,
          },
          {
            role: 'assistant',
            content: '',
          },
        ],
      });

      let fullResponse = '';

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
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

  async function analyzeConversation(
    history: TranscriptEntry[],
    latestStatement: string
  ): Promise<AISuggestion> {
    try {
      const conversationPrompt = formatConversationForPrompt(
        history,
        latestStatement
      );

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `${conversationPrompt}\n\nAnalyze this conversation and provide strategic insights using the provide_analysis tool.`,
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

  async function streamCallSummary(
    history: TranscriptEntry[],
    duration: number,
    callbacks: StreamCallSummaryCallbacks
  ): Promise<CallSummary> {
    const conversationText = history
      .map((entry) => `${entry.speaker}: ${entry.text}`)
      .join('\n');

    const userContent = `Call Duration: ${Math.floor(duration / 60)}m ${duration % 60}s

Transcript:
${conversationText}`;

    const streamingPromise = (async () => {
      const stream = client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `${SUMMARY_PROMPT}

Write a 2-3 sentence narrative summary of this call. Focus on what happened, how the seller responded, and the outcome. Do not use bullet points or structured format.`,
        messages: [
          {
            role: 'user',
            content: `${userContent}

Write a brief narrative summary of this call.`,
          },
        ],
      });

      callbacks.onSummaryStart();
      let streamedSummary = '';
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const token = event.delta.text;
          streamedSummary += token;
          callbacks.onSummaryToken(token);
        }
      }
      callbacks.onSummaryEnd();
      return streamedSummary.trim();
    })();

    const structuredPromise = (async () => {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SUMMARY_PROMPT,
        messages: [
          {
            role: 'user',
            content: `${userContent}

Analyze this completed call and provide structured data using the provide_summary tool.`,
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
        const data = SummarySchema.parse(toolResult.input);
        callbacks.onStructuredData({
          final_motivation_level: data.final_motivation_level,
          pain_points: data.pain_points,
          objections: data.objections,
          next_steps: data.next_steps,
        });
        return data;
      }
      throw new Error('No summary result found in response');
    })();

    const [streamedSummary, structuredData] = await Promise.all([
      streamingPromise,
      structuredPromise,
    ]);

    return {
      duration,
      ...structuredData,
      summary: streamedSummary,
    };
  }

  async function generateCallSummary(
    history: TranscriptEntry[],
    duration: number
  ): Promise<CallSummary> {
    try {
      return await streamCallSummary(history, duration, {
        onSummaryStart: () => {},
        onSummaryToken: () => {},
        onSummaryEnd: () => {},
        onStructuredData: () => {},
      });
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

  return {
    streamSuggestedResponse,
    analyzeConversation,
    summarizeConversation,
    streamCallSummary,
    generateCallSummary,
  };
}
