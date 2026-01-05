import type { Condition, DealStrategy, Motivation } from './deal.js';

export const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const TierRecommendation = {
  STANDARD: 'standard',
  CREATIVE: 'creative',
  PASS: 'pass',
} as const;

export type TierRecommendation =
  (typeof TierRecommendation)[keyof typeof TierRecommendation];

export interface StrategyInput {
  arv: number;
  purchasePrice: number;
  repairs: number;
  mortgageBalance: number;
  interestRate: number;
  propertyCondition: Exclude<Condition, 'unknown'>;
  sellerMotivation: Exclude<Motivation, 'unknown'>;
  sellerNeedsCash: boolean;
  userLiquidCapital: number;
}

export interface StrategyRecommendation {
  strategy: DealStrategy;
  rank: number;
  score: number;
  pros: string[];
  cons: string[];
  requirements: string[];
  estimatedProfit: number;
  riskLevel: RiskLevel;
  timeToClose: string;
}

export interface Tier1Result {
  equityPercent: number;
  spreadPercent: number;
  passesEquityTest: boolean;
  recommendation: TierRecommendation;
}

export interface Tier2Result {
  hasExistingDebt: boolean;
  interestRate: number;
  isLowRate: boolean;
  recommendation: DealStrategy | null;
}

export interface Tier3Result {
  isRetailCondition: boolean;
  wantsMarketValue: boolean;
  recommendation: DealStrategy | null;
}

export interface ExitStrategyAnalysis {
  input: StrategyInput;
  tier1Result: Tier1Result;
  tier2Result: Tier2Result | null;
  tier3Result: Tier3Result | null;
  recommendations: StrategyRecommendation[];
  warnings: string[];
}
