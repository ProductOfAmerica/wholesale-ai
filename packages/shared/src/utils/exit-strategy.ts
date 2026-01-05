import type { DealStrategy } from '../types/deal.js';
import type {
  ExitStrategyAnalysis,
  StrategyInput,
  StrategyRecommendation,
  Tier1Result,
  Tier2Result,
  Tier3Result,
  TierRecommendation,
} from '../types/exit-strategy.js';

const LOW_RATE_THRESHOLD = 5;
const RETAIL_REPAIR_THRESHOLD = 15000;
const FLIP_CAPITAL_MINIMUM = 10000;
const SPREAD_THRESHOLD = 0.2;
const EQUITY_MINIMUM = 0.1;

function calculateTier1(input: StrategyInput): Tier1Result {
  const equityPercent = (input.arv - input.mortgageBalance) / input.arv;
  const spreadPercent =
    (input.arv - input.purchasePrice - input.repairs) / input.arv;

  let recommendation: TierRecommendation;
  let passesEquityTest = true;

  if (spreadPercent >= SPREAD_THRESHOLD) {
    recommendation = 'standard';
  } else if (
    equityPercent < EQUITY_MINIMUM &&
    input.interestRate > LOW_RATE_THRESHOLD
  ) {
    recommendation = 'pass';
    passesEquityTest = false;
  } else {
    recommendation = 'creative';
  }

  return {
    equityPercent: equityPercent * 100,
    spreadPercent: spreadPercent * 100,
    passesEquityTest,
    recommendation,
  };
}

function calculateTier2(input: StrategyInput): Tier2Result {
  const hasExistingDebt = input.mortgageBalance > 0;
  const isLowRate = input.interestRate < LOW_RATE_THRESHOLD;

  let recommendation: DealStrategy | null = null;

  if (hasExistingDebt && isLowRate) {
    recommendation = input.sellerNeedsCash ? 'morby_method' : 'subject_to';
  } else if (!hasExistingDebt) {
    recommendation = 'seller_finance';
  }

  return {
    hasExistingDebt,
    interestRate: input.interestRate,
    isLowRate,
    recommendation,
  };
}

function calculateTier3(input: StrategyInput): Tier3Result {
  const isRetailCondition =
    input.propertyCondition === 'excellent' ||
    input.propertyCondition === 'good';
  const wantsMarketValue = input.sellerMotivation === 'low';

  const recommendation: DealStrategy | null =
    input.repairs < RETAIL_REPAIR_THRESHOLD && isRetailCondition
      ? 'novation'
      : null;

  return {
    isRetailCondition,
    wantsMarketValue,
    recommendation,
  };
}

function buildRecommendation(
  strategy: DealStrategy,
  rank: number,
  input: StrategyInput
): StrategyRecommendation {
  const spread = input.arv - input.purchasePrice - input.repairs;

  const configs: Record<
    DealStrategy,
    Omit<StrategyRecommendation, 'rank' | 'estimatedProfit'>
  > = {
    assignment: {
      strategy: 'assignment',
      score: 90,
      pros: [
        'Fastest closing',
        'Lowest risk',
        'No capital required',
        'Simple transaction',
      ],
      cons: ['Lower profit margin', 'Buyer must qualify'],
      requirements: ['Assignable contract', 'Buyer lined up'],
      riskLevel: 'low',
      timeToClose: '2-4 weeks',
    },
    subject_to: {
      strategy: 'subject_to',
      score: 75,
      pros: [
        'Keep existing low rate',
        'Low down payment',
        'No new financing needed',
      ],
      cons: [
        'Due-on-sale clause risk',
        'Property management required',
        'Seller stays on loan',
      ],
      requirements: [
        'Seller trust',
        'Existing mortgage assumable',
        'Title company experience',
      ],
      riskLevel: 'medium',
      timeToClose: '2-3 weeks',
    },
    morby_method: {
      strategy: 'morby_method',
      score: 70,
      pros: [
        '$0 down possible',
        'Seller gets immediate cash',
        'Keep low rate mortgage',
      ],
      cons: [
        'Complex structure',
        'Requires education',
        'Seller must understand',
      ],
      requirements: [
        'Motivated seller',
        'Low rate existing loan',
        'Experienced title company',
      ],
      riskLevel: 'medium',
      timeToClose: '3-4 weeks',
    },
    novation: {
      strategy: 'novation',
      score: 65,
      pros: [
        'Access retail buyers',
        'Higher price possible',
        'Seller stays motivated',
      ],
      cons: [
        'Longer timeline',
        'Seller cooperation needed',
        'Market dependent',
      ],
      requirements: [
        'Retail-ready property',
        'Signed novation agreement',
        'Realtor partnership',
      ],
      riskLevel: 'medium',
      timeToClose: '60-90 days',
    },
    seller_finance: {
      strategy: 'seller_finance',
      score: 68,
      pros: [
        'Flexible terms',
        'No bank qualification',
        'Negotiable interest rate',
      ],
      cons: [
        'Seller must own free & clear',
        'Monthly payments continue',
        'Default risk',
      ],
      requirements: [
        'Free & clear property',
        'Seller willing to carry note',
        'Proper documentation',
      ],
      riskLevel: 'medium',
      timeToClose: '2-4 weeks',
    },
    double_close: {
      strategy: 'double_close',
      score: 60,
      pros: [
        'Highest profit potential',
        'Control the deal',
        'Privacy on assignment fee',
      ],
      cons: [
        'Capital intensive',
        'Two closings required',
        'Higher transaction costs',
      ],
      requirements: [
        'Transactional funding or cash',
        'Title company experience',
        'End buyer confirmed',
      ],
      riskLevel: 'high',
      timeToClose: '3-6 months',
    },
    wholetail: {
      strategy: 'wholetail',
      score: 55,
      pros: [
        'Access retail market',
        'Higher profit than wholesale',
        'Light rehab only',
      ],
      cons: ['Holding costs', 'Capital required', 'Market risk'],
      requirements: [
        '$10K+ liquid capital',
        'Light rehab capability',
        'Market knowledge',
      ],
      riskLevel: 'high',
      timeToClose: '3-6 months',
    },
  };

  const config = configs[strategy];
  let estimatedProfit = 0;

  switch (strategy) {
    case 'assignment':
      estimatedProfit = Math.min(spread * 0.3, 15000);
      break;
    case 'subject_to':
    case 'seller_finance':
      estimatedProfit = spread * 0.5;
      break;
    case 'morby_method':
      estimatedProfit = spread * 0.4;
      break;
    case 'novation':
      estimatedProfit = spread * 0.6;
      break;
    case 'double_close':
    case 'wholetail':
      estimatedProfit = spread * 0.8;
      break;
  }

  return {
    ...config,
    rank,
    estimatedProfit: Math.round(Math.max(0, estimatedProfit)),
  };
}

function generateRecommendations(
  input: StrategyInput,
  tier1: Tier1Result,
  tier2: Tier2Result | null,
  tier3: Tier3Result | null
): StrategyRecommendation[] {
  const recommendations: StrategyRecommendation[] = [];

  if (tier1.recommendation === 'standard' && tier1.spreadPercent >= 20) {
    recommendations.push(buildRecommendation('assignment', 1, input));
  }

  if (tier2?.recommendation) {
    const rank = recommendations.length + 1;
    recommendations.push(
      buildRecommendation(tier2.recommendation, rank, input)
    );
  }

  if (
    tier3?.recommendation &&
    !recommendations.some((r) => r.strategy === 'novation')
  ) {
    const rank = recommendations.length + 1;
    recommendations.push(buildRecommendation('novation', rank, input));
  }

  if (tier1.recommendation === 'creative' && recommendations.length === 0) {
    if (!tier2?.hasExistingDebt) {
      recommendations.push(buildRecommendation('seller_finance', 1, input));
    }
  }

  if (input.userLiquidCapital >= FLIP_CAPITAL_MINIMUM) {
    const hasDoubleClose = recommendations.some(
      (r) => r.strategy === 'double_close'
    );
    if (!hasDoubleClose) {
      const rank = recommendations.length + 1;
      recommendations.push(buildRecommendation('double_close', rank, input));
    }
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

function generateWarnings(
  input: StrategyInput,
  tier1: Tier1Result,
  recommendations: StrategyRecommendation[]
): string[] {
  const warnings: string[] = [];

  if (tier1.recommendation === 'pass') {
    warnings.push(
      'Deal has low equity and high interest rate - consider passing'
    );
  }

  if (input.interestRate > 8) {
    warnings.push(
      `High interest rate (${input.interestRate}%) makes Subject-To less attractive`
    );
  }

  if (input.userLiquidCapital < FLIP_CAPITAL_MINIMUM) {
    warnings.push(
      'Flip/Double-Close strategies hidden due to insufficient capital'
    );
  }

  if (recommendations.length === 0) {
    warnings.push('No viable exit strategies found for this deal');
  }

  if (tier1.equityPercent < 15) {
    warnings.push('Low equity position - creative financing may be required');
  }

  return warnings;
}

export function analyzeExitStrategy(
  input: StrategyInput
): ExitStrategyAnalysis {
  const tier1Result = calculateTier1(input);

  let tier2Result: Tier2Result | null = null;
  let tier3Result: Tier3Result | null = null;

  if (tier1Result.recommendation === 'creative') {
    tier2Result = calculateTier2(input);
    tier3Result = calculateTier3(input);
  }

  const recommendations = generateRecommendations(
    input,
    tier1Result,
    tier2Result,
    tier3Result
  );

  const warnings = generateWarnings(input, tier1Result, recommendations);

  return {
    input,
    tier1Result,
    tier2Result,
    tier3Result,
    recommendations,
    warnings,
  };
}
