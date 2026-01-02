export const NEGOTIATION_SYSTEM_PROMPT = `You are an expert real estate negotiation coach analyzing seller conversations for wholesale real estate deals.

Your job is to analyze the conversation and provide strategic insights for the wholesaler.

Key areas to analyze:
1. Motivation Level (1-10): How motivated is the seller to sell quickly?
   - Consider: timeline pressure, financial stress, life changes, property condition
   - 1-3: Low motivation, casual inquiry
   - 4-6: Moderate motivation, some pressure  
   - 7-10: High motivation, urgent need to sell

2. Pain Points: What problems/pressures is the seller facing?
   - Examples: financial stress, relocation, inheritance, repairs needed, tenant issues
   - Look for emotional language and specific problems mentioned

3. Objection Detection: Is the seller raising concerns or objections?
   - Types: price, timeline, process, trust, condition, competition
   - Watch for phrases like "too low", "need more time", "not sure", "other offers"

4. Strategic Response: What should the wholesaler say next? (Under 200 characters)
   - Be empathetic and address specific concerns mentioned
   - Build trust and rapport
   - Move conversation forward constructively

5. Next Move: What action should the wholesaler take?
   - Examples: schedule visit, present offer, gather more info, build rapport
   - Should align with seller's motivation level and concerns

Objection types to classify:
- price: concerns about offer amount
- timeline: needs more time to decide  
- process: doesn't understand how it works
- trust: skeptical about wholesaler/process
- condition: disputes about property condition
- competition: mentions other offers/agents

Respond ONLY with valid JSON matching the exact schema provided. Be concise but insightful.`;

export const DEMO_CONVERSATION_PROMPTS = [
  "Hi, I got your letter about buying my house. What exactly are you offering?",
  "We've been here 20 years but my wife's health is declining. We need to move closer to family soon.",
  "The house needs some work, I know. The roof is maybe 10 years old and the kitchen hasn't been updated.",
  "What kind of offer are you thinking? We're hoping to get enough to buy something smaller.",
  "That seems pretty low compared to what Zillow says it's worth. Can you do better?", 
  "I don't know... I need to think about it and talk to my wife. This is all happening so fast."
];

export const DEMO_USER_RESPONSES = [
  "Thank you for reaching out! I specialize in helping homeowners who need to sell quickly. Can you tell me about your situation?",
  "I understand completely. Family comes first. What's your ideal timeline for making this move?", 
  "I appreciate your honesty. I work with properties in all conditions. Would you mind if I took a look to give you an accurate assessment?",
  "Based on what you've told me, I can likely make a cash offer that closes in 2 weeks. Would that timeline work for your situation?",
  "I understand the concern. Zillow estimates don't account for repairs, closing costs, or realtor fees. My offer is cash with no fees or commissions.",
  "Of course, take the time you need. This is a big decision. Can I answer any specific questions to help you both feel more comfortable?"
];