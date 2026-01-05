import type { Lead } from './lead.js';

export const DealGrade = {
  A: 'A',
  B: 'B',
  C: 'C',
  F: 'F',
} as const;

export type DealGrade = (typeof DealGrade)[keyof typeof DealGrade];

export const DealStrategy = {
  ASSIGNMENT: 'assignment',
  DOUBLE_CLOSE: 'double_close',
  WHOLETAIL: 'wholetail',
  SUBJECT_TO: 'subject_to',
  MORBY_METHOD: 'morby_method',
  NOVATION: 'novation',
  SELLER_FINANCE: 'seller_finance',
} as const;

export type DealStrategy = (typeof DealStrategy)[keyof typeof DealStrategy];

export const DealStatus = {
  ANALYZING: 'analyzing',
  OFFER_SENT: 'offer_sent',
  UNDER_CONTRACT: 'under_contract',
  IN_ESCROW: 'in_escrow',
  CLOSED: 'closed',
  DEAD: 'dead',
} as const;

export type DealStatus = (typeof DealStatus)[keyof typeof DealStatus];

export const Condition = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  UNKNOWN: 'unknown',
} as const;

export type Condition = (typeof Condition)[keyof typeof Condition];

export const Motivation = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  UNKNOWN: 'unknown',
} as const;

export type Motivation = (typeof Motivation)[keyof typeof Motivation];

export interface Comp {
  address: string;
  salePrice: number;
  saleDate: string;
  sqft: number;
  pricePerSqft: number;
  distance: number;
  adjustedValue: number;
}

export interface MAOBreakdown {
  arv: number;
  arvMultiplier: number;
  repairs: number;
  wholesaleFee: number;
  mao: number;
}

export interface RehabEstimate {
  low: number;
  medium: number;
  high: number;
  costPerSqft: number;
  condition: Condition;
}

export interface ProfitProjection {
  assignmentFee: number;
  estimatedProfit: number;
  roi: number;
  holdingCosts: number;
  closingCosts: number;
}

export interface DealAnalysis {
  arv: number;
  comps: Comp[];
  rehabEstimate: RehabEstimate;
  maoBreakdown: MAOBreakdown;
  grade: DealGrade;
  gradeReasons: string[];
  profitProjection: ProfitProjection;
  equityPercent: number;
  mortgageBalance: number | null;
}

export interface Deal {
  id: string;
  lead: Lead;
  analysis: DealAnalysis;
  offerPrice: number | null;
  askingPrice: number | null;
  status: DealStatus;
  strategy: DealStrategy;
  notes: string | null;
  assignedBuyerId: string | null;
  createdAt: string;
  updatedAt: string;
}
