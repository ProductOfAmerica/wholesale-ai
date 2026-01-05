import type { Condition, DealStrategy, Motivation } from './deal.js';
import type { TranscriptEntry } from './transcription.js';

export const TimelineUrgency = {
  IMMEDIATE: 'immediate',
  THIRTY_DAYS: '30_days',
  SIXTY_DAYS: '60_days',
  NINETY_PLUS_DAYS: '90_plus_days',
  FLEXIBLE: 'flexible',
  UNKNOWN: 'unknown',
} as const;

export type TimelineUrgency =
  (typeof TimelineUrgency)[keyof typeof TimelineUrgency];

export const PriceExpectation = {
  REALISTIC: 'realistic',
  SLIGHTLY_HIGH: 'slightly_high',
  UNREALISTIC: 'unrealistic',
  FLEXIBLE: 'flexible',
  UNKNOWN: 'unknown',
} as const;

export type PriceExpectation =
  (typeof PriceExpectation)[keyof typeof PriceExpectation];

export interface TCPMAnalysis {
  timeline: {
    urgency: TimelineUrgency;
    targetDate: string | null;
    notes: string | null;
  };
  condition: {
    assessment: Condition;
    majorIssues: string[];
    notes: string | null;
  };
  price: {
    expectation: PriceExpectation;
    askingPrice: number | null;
    flexibility: number;
    notes: string | null;
  };
  motivation: {
    level: Motivation;
    reasons: string[];
    notes: string | null;
  };
  overallScore: number;
  recommendation: string;
}

export interface AfterActionReport {
  id: string;
  dealId: string;
  outcome: 'closed' | 'lost' | 'dead';
  actualSalePrice: number | null;
  actualProfit: number | null;
  daysToClose: number | null;
  lessonsLearned: string[];
  whatWorked: string[];
  whatDidntWork: string[];
  sellerFeedback: string | null;
  buyerFeedback: string | null;
  createdAt: string;
}

export const CopilotSuggestionType = {
  QUESTION: 'question',
  SCRIPT: 'script',
  ALERT: 'alert',
  STRATEGY: 'strategy',
} as const;

export type CopilotSuggestionType =
  (typeof CopilotSuggestionType)[keyof typeof CopilotSuggestionType];

export const CopilotPriority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type CopilotPriority =
  (typeof CopilotPriority)[keyof typeof CopilotPriority];

export const TCPMCategory = {
  TIMELINE: 'timeline',
  CONDITION: 'condition',
  PRICE: 'price',
  MOTIVATION: 'motivation',
  GENERAL: 'general',
} as const;

export type TCPMCategory = (typeof TCPMCategory)[keyof typeof TCPMCategory];

export interface CopilotSuggestion {
  type: CopilotSuggestionType;
  priority: CopilotPriority;
  content: string;
  reasoning: string;
  category: TCPMCategory;
}

export interface FinancialRoutingAlternative {
  strategy: DealStrategy;
  confidence: number;
  note: string;
}

export interface FinancialRouting {
  recommendedStrategy: DealStrategy;
  confidence: number;
  reasoning: string[];
  alternatives: FinancialRoutingAlternative[];
}

export interface AIDecisionLogEntry {
  timestamp: number;
  decision: string;
  reasoning: string;
}

export interface CallSessionAAR {
  tcpmSummary: {
    timeline: string;
    condition: string;
    price: string;
    motivation: string;
  };
  aiDecisions: AIDecisionLogEntry[];
  nextSteps: string[];
}

export interface CallSession {
  id: string;
  leadId: string | null;
  dealId: string | null;
  startedAt: number;
  endedAt: number | null;
  transcript: TranscriptEntry[];
  tcpmAnalysis: TCPMAnalysis | null;
  suggestions: CopilotSuggestion[];
  financialRouting: FinancialRouting | null;
  afterActionReport: CallSessionAAR | null;
}
