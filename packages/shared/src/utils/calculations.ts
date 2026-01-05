import type {
  Condition,
  DealGrade,
  MAOBreakdown,
  Motivation,
  RehabEstimate,
} from '../types/deal.js';

export interface DealGradeResult {
  grade: DealGrade;
  score: number;
  reasons: string[];
}

export function calculateMAO(
  arv: number,
  repairs: number,
  wholesaleFee: number,
  arvMultiplier = 0.7
): MAOBreakdown {
  const mao = arv * arvMultiplier - repairs - wholesaleFee;
  return {
    arv,
    arvMultiplier,
    repairs,
    wholesaleFee,
    mao: Math.max(0, mao),
  };
}

export function calculateEquityPercent(
  arv: number,
  mortgageBalance: number | null
): number {
  if (mortgageBalance === null || arv <= 0) return 0;
  const equity = arv - mortgageBalance;
  return Math.max(0, (equity / arv) * 100);
}

export function calculateDealGrade(
  equityPercent: number,
  motivation: Motivation,
  condition: Condition
): DealGradeResult {
  const reasons: string[] = [];
  let score = 0;

  if (equityPercent >= 30) {
    score += 40;
    reasons.push('High equity (30%+)');
  } else if (equityPercent >= 20) {
    score += 25;
    reasons.push('Moderate equity (20-30%)');
  } else if (equityPercent >= 10) {
    score += 10;
    reasons.push('Low equity (10-20%)');
  } else {
    reasons.push('Very low equity (<10%)');
  }

  switch (motivation) {
    case 'high':
      score += 35;
      reasons.push('Highly motivated seller');
      break;
    case 'medium':
      score += 20;
      reasons.push('Moderately motivated seller');
      break;
    case 'low':
      score += 5;
      reasons.push('Low motivation');
      break;
    case 'unknown':
      score += 10;
      reasons.push('Motivation unknown');
      break;
  }

  switch (condition) {
    case 'excellent':
    case 'good':
      score += 25;
      reasons.push(`Property in ${condition} condition`);
      break;
    case 'fair':
      score += 15;
      reasons.push('Property in fair condition');
      break;
    case 'poor':
      score += 10;
      reasons.push('Property in poor condition (higher rehab)');
      break;
    case 'unknown':
      score += 12;
      reasons.push('Property condition unknown');
      break;
  }

  let grade: DealGrade;
  if (score >= 80) {
    grade = 'A';
  } else if (score >= 60) {
    grade = 'B';
  } else if (score >= 40) {
    grade = 'C';
  } else {
    grade = 'F';
  }

  return { grade, score, reasons };
}

const REHAB_COST_PER_SQFT: Record<Condition, { min: number; max: number }> = {
  excellent: { min: 0, max: 10 },
  good: { min: 10, max: 30 },
  fair: { min: 25, max: 55 },
  poor: { min: 45, max: 85 },
  unknown: { min: 25, max: 55 },
};

export function calculateRehabEstimate(
  sqft: number,
  condition: Condition
): RehabEstimate {
  const costs = REHAB_COST_PER_SQFT[condition];
  const costPerSqft = (costs.min + costs.max) / 2;

  return {
    low: Math.round(sqft * costs.min),
    medium: Math.round(sqft * costPerSqft),
    high: Math.round(sqft * costs.max),
    costPerSqft,
    condition,
  };
}

export function calculateDSCR(
  monthlyRent: number,
  vacancyRate: number,
  piti: number,
  managementPercent: number,
  maintenancePercent: number
): number {
  const effectiveRent = monthlyRent * (1 - vacancyRate);
  const managementCost = monthlyRent * managementPercent;
  const maintenanceCost = monthlyRent * maintenancePercent;
  const totalExpenses = piti + managementCost + maintenanceCost;

  if (totalExpenses <= 0) return 0;
  return effectiveRent / totalExpenses;
}
