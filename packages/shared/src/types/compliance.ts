import type { DealStrategy } from './deal.js';

export const ComplianceCategory = {
  LICENSING: 'licensing',
  DISCLOSURE: 'disclosure',
  CONTRACT: 'contract',
  FORECLOSURE: 'foreclosure',
  CREATIVE_FINANCE: 'creative_finance',
  ASSIGNMENT: 'assignment',
} as const;

export type ComplianceCategory =
  (typeof ComplianceCategory)[keyof typeof ComplianceCategory];

export const ComplianceSeverity = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export type ComplianceSeverity =
  (typeof ComplianceSeverity)[keyof typeof ComplianceSeverity];

export const DisclosurePlacement = {
  CONTRACT: 'contract',
  SEPARATE_FORM: 'separate_form',
  VERBAL: 'verbal',
} as const;

export type DisclosurePlacement =
  (typeof DisclosurePlacement)[keyof typeof DisclosurePlacement];

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
}

export interface RequiredDisclosure {
  id: string;
  name: string;
  triggeredBy: (DealStrategy | string)[];
  content: string;
  placement: DisclosurePlacement;
}

export interface StrategyRestriction {
  strategy: DealStrategy;
  allowed: boolean;
  conditions: string | null;
  alternativeStrategy: DealStrategy | null;
  notes: string | null;
}

export interface StateCompliance {
  state: string;
  stateName: string;
  rules: ComplianceRule[];
  disclosures: RequiredDisclosure[];
  restrictions: StrategyRestriction[];
}

export interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  message: string;
  severity: ComplianceSeverity;
  remediation: string;
}

export interface ComplianceWarning {
  type: string;
  message: string;
  learnMoreUrl: string | null;
}

export interface ComplianceCheck {
  dealId: string | null;
  state: string;
  strategy: DealStrategy;
  passed: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  requiredDisclosures: RequiredDisclosure[];
  checkedAt: string;
}

export interface ComplianceCheckInput {
  state: string;
  strategy: DealStrategy;
  distressIndicators?: string[];
  dealsThisYear?: number;
  propertyInForeclosure?: boolean;
}
