import type {
  CallScript,
  DocumentTemplate,
  EmailTemplate,
  TemplatesResponse,
} from '@wholesale-ai/shared';
import {
  DocumentType,
  EmailCategory,
  FieldType,
  ScriptSectionType,
} from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

const contracts: DocumentTemplate[] = [
  {
    id: 'assignment-contract',
    name: 'Assignment of Contract',
    type: DocumentType.ASSIGNMENT_CONTRACT,
    description: 'Standard assignment contract for wholesale deals',
    stateSpecific: false,
    content: `<h1>Assignment of Contract</h1>
<p>This Assignment Agreement is made on <strong>{{date}}</strong></p>
<p><strong>Assignor:</strong> {{assignorName}}</p>
<p><strong>Assignee:</strong> {{assigneeName}}</p>
<p><strong>Property Address:</strong> {{propertyAddress}}</p>
<p><strong>Original Purchase Price:</strong> \${{purchasePrice}}</p>
<p><strong>Assignment Fee:</strong> \${{assignmentFee}}</p>
<p>The Assignor hereby assigns all rights, title, and interest in the Purchase Agreement dated {{originalContractDate}} to the Assignee.</p>`,
    fields: [
      { name: 'date', label: 'Date', type: FieldType.DATE, required: true },
      {
        name: 'assignorName',
        label: 'Assignor Name',
        type: FieldType.TEXT,
        required: true,
      },
      {
        name: 'assigneeName',
        label: 'Assignee Name',
        type: FieldType.TEXT,
        required: true,
      },
      {
        name: 'propertyAddress',
        label: 'Property Address',
        type: FieldType.ADDRESS,
        required: true,
      },
      {
        name: 'purchasePrice',
        label: 'Purchase Price',
        type: FieldType.CURRENCY,
        required: true,
      },
      {
        name: 'assignmentFee',
        label: 'Assignment Fee',
        type: FieldType.CURRENCY,
        required: true,
      },
      {
        name: 'originalContractDate',
        label: 'Original Contract Date',
        type: FieldType.DATE,
        required: true,
      },
    ],
  },
  {
    id: 'letter-of-intent',
    name: 'Letter of Intent',
    type: DocumentType.LETTER_OF_INTENT,
    description: 'Non-binding LOI for initial offers',
    stateSpecific: false,
    content: `<h1>Letter of Intent</h1>
<p>Date: {{date}}</p>
<p>Dear {{sellerName}},</p>
<p>This Letter of Intent outlines our interest in purchasing the property located at:</p>
<p><strong>{{propertyAddress}}</strong></p>
<p><strong>Proposed Purchase Price:</strong> \${{offerPrice}}</p>
<p><strong>Earnest Money Deposit:</strong> \${{earnestMoney}}</p>
<p><strong>Proposed Closing Date:</strong> {{closingDate}}</p>
<p><strong>Inspection Period:</strong> {{inspectionPeriod}} days</p>
<p>This letter is non-binding and subject to further due diligence.</p>
<p>Sincerely,<br/>{{buyerName}}</p>`,
    fields: [
      { name: 'date', label: 'Date', type: FieldType.DATE, required: true },
      {
        name: 'sellerName',
        label: 'Seller Name',
        type: FieldType.TEXT,
        required: true,
      },
      {
        name: 'propertyAddress',
        label: 'Property Address',
        type: FieldType.ADDRESS,
        required: true,
      },
      {
        name: 'offerPrice',
        label: 'Offer Price',
        type: FieldType.CURRENCY,
        required: true,
      },
      {
        name: 'earnestMoney',
        label: 'Earnest Money',
        type: FieldType.CURRENCY,
        required: true,
        defaultValue: '1000',
      },
      {
        name: 'closingDate',
        label: 'Closing Date',
        type: FieldType.DATE,
        required: true,
      },
      {
        name: 'inspectionPeriod',
        label: 'Inspection Period (days)',
        type: FieldType.NUMBER,
        required: true,
        defaultValue: '14',
      },
      {
        name: 'buyerName',
        label: 'Buyer Name',
        type: FieldType.TEXT,
        required: true,
      },
    ],
  },
  {
    id: 'proof-of-funds',
    name: 'Proof of Funds Letter',
    type: DocumentType.PROOF_OF_FUNDS,
    description: 'POF letter template for seller confidence',
    stateSpecific: false,
    content: `<h1>Proof of Funds Letter</h1>
<p>Date: {{date}}</p>
<p>To Whom It May Concern,</p>
<p>This letter serves as verification that <strong>{{buyerName}}</strong> has available funds in the amount of <strong>\${{fundAmount}}</strong> for the purpose of purchasing real estate.</p>
<p>These funds are readily available and can be verified upon request.</p>
<p><strong>Property of Interest:</strong> {{propertyAddress}}</p>
<p>Please feel free to contact us for verification.</p>
<p>Sincerely,<br/>{{fundingSource}}</p>`,
    fields: [
      { name: 'date', label: 'Date', type: FieldType.DATE, required: true },
      {
        name: 'buyerName',
        label: 'Buyer Name',
        type: FieldType.TEXT,
        required: true,
      },
      {
        name: 'fundAmount',
        label: 'Available Funds',
        type: FieldType.CURRENCY,
        required: true,
      },
      {
        name: 'propertyAddress',
        label: 'Property Address',
        type: FieldType.ADDRESS,
        required: true,
      },
      {
        name: 'fundingSource',
        label: 'Funding Source',
        type: FieldType.TEXT,
        required: true,
      },
    ],
  },
];

const emails: EmailTemplate[] = [
  {
    id: 'initial-contact',
    name: 'Initial Contact',
    category: EmailCategory.INITIAL_CONTACT,
    subject: 'Interested in Your Property at {{propertyAddress}}',
    body: `Hi {{sellerName}},

I hope this message finds you well. My name is {{myName}} and I came across your property at {{propertyAddress}}.

I'm a local real estate investor and I'm currently looking for properties in your area. I wanted to reach out to see if you might be interested in discussing a potential sale.

I buy properties in any condition and can close quickly - often in as little as 2-3 weeks. There are no agent fees or commissions involved.

Would you be open to a brief conversation to discuss your situation?

Best regards,
{{myName}}
{{phoneNumber}}`,
    variables: ['sellerName', 'propertyAddress', 'myName', 'phoneNumber'],
  },
  {
    id: 'cash-offer',
    name: 'Cash Offer',
    category: EmailCategory.OFFER,
    subject: 'Cash Offer for {{propertyAddress}}',
    body: `Hi {{sellerName}},

Thank you for taking the time to speak with me about your property at {{propertyAddress}}.

Based on our conversation and my analysis, I'd like to make you a cash offer of \${{offerAmount}}.

Here's what I can offer:
- Close in {{closingDays}} days or on your timeline
- No realtor fees or commissions
- We handle all closing costs
- Buy the property as-is, no repairs needed

This is a firm, no-obligation offer. If you'd like to discuss or have any questions, please don't hesitate to reach out.

Looking forward to hearing from you.

Best regards,
{{myName}}
{{phoneNumber}}`,
    variables: [
      'sellerName',
      'propertyAddress',
      'offerAmount',
      'closingDays',
      'myName',
      'phoneNumber',
    ],
  },
  {
    id: 'follow-up',
    name: 'Follow Up',
    category: EmailCategory.FOLLOW_UP,
    subject: 'Following Up - {{propertyAddress}}',
    body: `Hi {{sellerName}},

I wanted to follow up on my previous message about your property at {{propertyAddress}}.

I understand life gets busy, but I wanted to reiterate my interest. I'm still prepared to make a fair cash offer and can work around your timeline.

If your situation has changed or you'd like to chat, I'm here. No pressure at all - just want to make sure you know the option is available.

Hope to hear from you soon.

Best,
{{myName}}
{{phoneNumber}}`,
    variables: ['sellerName', 'propertyAddress', 'myName', 'phoneNumber'],
  },
];

const scripts: CallScript[] = [
  {
    id: 'initial-seller-call',
    name: 'Initial Seller Call',
    scenario: 'First contact with a potential seller - using TCPM framework',
    sections: [
      {
        name: 'Opener',
        type: ScriptSectionType.OPENER,
        lines: [
          'Hi, is this {{sellerName}}?',
          'This is {{myName}} calling about the property at {{propertyAddress}}.',
          "I'm a local investor looking for properties in your area. Do you have a moment to chat?",
        ],
        notes:
          'Keep it warm and casual. Build rapport before diving into business.',
      },
      {
        name: 'Timeline Discovery',
        type: ScriptSectionType.DISCOVERY,
        lines: [
          'So {{sellerName}}, can you tell me a bit about your situation with the property?',
          "What's prompting you to consider selling?",
          "Is there a specific timeline you're working with?",
          'How soon would you ideally like to close?',
        ],
        notes:
          'TCPM - Timeline: Understand urgency. More urgency = more motivation.',
      },
      {
        name: 'Condition Discovery',
        type: ScriptSectionType.DISCOVERY,
        lines: [
          'Tell me about the property itself. How long have you owned it?',
          'What condition is it in? Any major repairs needed?',
          'When was the roof/HVAC/plumbing last updated?',
          'Is the property currently occupied?',
        ],
        notes: 'TCPM - Condition: Assess repair costs and property state.',
      },
      {
        name: 'Price Discovery',
        type: ScriptSectionType.DISCOVERY,
        lines: [
          "Have you thought about what you'd like to get for the property?",
          'How did you arrive at that number?',
          "Are you open to creative solutions if the numbers don't quite work traditionally?",
        ],
        notes:
          'TCPM - Price: Understand expectations. Gap = negotiation opportunity.',
      },
      {
        name: 'Motivation Deep Dive',
        type: ScriptSectionType.DISCOVERY,
        lines: [
          "It sounds like there's a lot going on. What would solving this situation mean for you?",
          "What happens if you don't sell in the next few months?",
          'Is there anything else affecting your decision to sell?',
        ],
        notes: 'TCPM - Motivation: This is the key. Find the pain point.',
      },
      {
        name: 'Common Objections',
        type: ScriptSectionType.OBJECTION,
        lines: [
          '"I need to think about it" → "Absolutely, take your time. What specifically do you need to think through? Maybe I can help provide some clarity."',
          '"Your offer is too low" → "I understand. Help me understand what number would work for you, and let\'s see if we can find middle ground."',
          '"I want to list with an agent" → "That\'s an option. Just keep in mind agent fees, repairs, showings, and 3-6 month timeline. Sometimes investors make more sense for certain situations."',
        ],
        notes: 'Handle with empathy. Never be pushy.',
      },
      {
        name: 'Close',
        type: ScriptSectionType.CLOSE,
        lines: [
          "Based on everything you've shared, I'd love to take a look at the property. When would be a good time?",
          "I'll put together some numbers and get back to you within 24 hours with an offer.",
          "Thank you for your time, {{sellerName}}. I'll be in touch soon!",
        ],
        notes: 'Always end with a clear next step.',
      },
    ],
  },
  {
    id: 'objection-handling',
    name: 'Objection Handling',
    scenario: 'Common seller objections and responses',
    sections: [
      {
        name: 'Price Objections',
        type: ScriptSectionType.OBJECTION,
        lines: [
          '"That\'s not enough" → "I understand this isn\'t what you hoped for. Can you share what number would work? I want to make sure we\'re on the same page."',
          '"Zillow says it\'s worth more" → "Zillow estimates are a starting point, but they don\'t account for condition or market realities. Have you had an appraisal done?"',
          '"I owe more than that" → "I hear you. We have options for that - have you considered a short sale or creative financing?"',
        ],
      },
      {
        name: 'Timing Objections',
        type: ScriptSectionType.OBJECTION,
        lines: [
          '"I\'m not ready to sell yet" → "No problem. When do you think you might be ready? I\'d be happy to follow up then."',
          '"I need to talk to my spouse/family" → "Absolutely, that makes sense. Would it help if I joined a call to answer their questions?"',
          '"Let me think about it" → "Of course. What specifically are you weighing? I want to make sure you have all the info you need."',
        ],
      },
      {
        name: 'Trust Objections',
        type: ScriptSectionType.OBJECTION,
        lines: [
          '"How do I know you\'re legit?" → "Great question. I\'d be happy to provide references from past sellers, my business info, and we use a title company for all transactions."',
          '"I\'ve heard bad things about investors" → "I understand the concern. Not all investors are the same. I focus on creating win-win situations. Would you like to speak with a past seller?"',
        ],
      },
      {
        name: 'Competition Objections',
        type: ScriptSectionType.OBJECTION,
        lines: [
          '"I want to list with an agent" → "That\'s a valid option. Just consider: agent fees (6%), repairs, 60+ showings, 3-6 month timeline. With me: no fees, as-is, close in 2 weeks. What matters most to you?"',
          '"Another investor offered more" → "That\'s great you have options. Just make sure to verify they can actually close. Ask for proof of funds and references."',
        ],
      },
    ],
  },
];

export async function GET() {
  const response: TemplatesResponse = {
    contracts,
    emails,
    scripts,
  };

  return NextResponse.json(response);
}
