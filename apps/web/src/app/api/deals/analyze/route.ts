import type {
  Comp,
  DealAnalysis,
  ProfitProjection,
} from '@wholesale-ai/shared';
import {
  analyzeRequestSchema,
  calculateDealGrade,
  calculateEquityPercent,
  calculateMAO,
  calculateRehabEstimate,
} from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

function generateMockComps(_address: string): Comp[] {
  const basePrice = 250000 + Math.random() * 150000;
  const baseSqft = 1400 + Math.random() * 400;

  return [
    {
      address: `${Math.floor(Math.random() * 9000 + 1000)} Oak St`,
      salePrice: Math.round(basePrice * (0.95 + Math.random() * 0.1)),
      saleDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      sqft: Math.round(baseSqft * (0.95 + Math.random() * 0.1)),
      pricePerSqft: 0,
      distance: 0.3 + Math.random() * 0.2,
      adjustedValue: 0,
    },
    {
      address: `${Math.floor(Math.random() * 9000 + 1000)} Maple Ave`,
      salePrice: Math.round(basePrice * (0.9 + Math.random() * 0.2)),
      saleDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      sqft: Math.round(baseSqft * (0.9 + Math.random() * 0.2)),
      pricePerSqft: 0,
      distance: 0.5 + Math.random() * 0.3,
      adjustedValue: 0,
    },
    {
      address: `${Math.floor(Math.random() * 9000 + 1000)} Pine Rd`,
      salePrice: Math.round(basePrice * (0.85 + Math.random() * 0.3)),
      saleDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      sqft: Math.round(baseSqft * (0.85 + Math.random() * 0.3)),
      pricePerSqft: 0,
      distance: 0.7 + Math.random() * 0.5,
      adjustedValue: 0,
    },
  ].map((comp) => ({
    ...comp,
    pricePerSqft: Math.round(comp.salePrice / comp.sqft),
    adjustedValue: comp.salePrice,
  }));
}

function calculateARV(comps: Comp[]): { arv: number; confidence: number } {
  if (comps.length === 0) return { arv: 0, confidence: 0 };

  const weights = comps.map((_, i) => 1 / (i + 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const weightedSum = comps.reduce(
    (sum, comp, i) => sum + comp.adjustedValue * weights[i],
    0
  );

  const arv = Math.round(weightedSum / totalWeight);
  const spread =
    (Math.max(...comps.map((c) => c.adjustedValue)) -
      Math.min(...comps.map((c) => c.adjustedValue))) /
    arv;
  const confidence = Math.max(0, Math.min(100, 100 - spread * 200));

  return { arv, confidence: Math.round(confidence) };
}

function calculateProfitProjection(
  arv: number,
  mao: number,
  wholesaleFee: number,
  repairs: number
): ProfitProjection {
  const buyerPurchasePrice = mao + wholesaleFee;
  const holdingCosts = Math.round(arv * 0.03);
  const closingCosts = Math.round(arv * 0.05);
  const estimatedProfit =
    arv - buyerPurchasePrice - repairs - holdingCosts - closingCosts;
  const totalInvestment =
    buyerPurchasePrice + repairs + holdingCosts + closingCosts;
  const roi =
    totalInvestment > 0 ? (estimatedProfit / totalInvestment) * 100 : 0;

  return {
    assignmentFee: wholesaleFee,
    estimatedProfit: Math.round(estimatedProfit),
    roi: Math.round(roi * 10) / 10,
    holdingCosts,
    closingCosts,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      address,
      mortgageBalance,
      condition,
      motivation,
      wholesaleFee,
      sqft,
    } = parsed.data;

    const comps = generateMockComps(address);
    const { arv } = calculateARV(comps);
    const rehabEstimate = calculateRehabEstimate(sqft, condition);
    const repairs = rehabEstimate.medium;
    const maoBreakdown = calculateMAO(arv, repairs, wholesaleFee);
    const equityPercent = calculateEquityPercent(arv, mortgageBalance ?? null);
    const gradeResult = calculateDealGrade(
      equityPercent,
      motivation,
      condition
    );
    const profitProjection = calculateProfitProjection(
      arv,
      maoBreakdown.mao,
      wholesaleFee,
      repairs
    );

    const analysis: DealAnalysis = {
      arv,
      comps,
      rehabEstimate,
      maoBreakdown,
      grade: gradeResult.grade,
      gradeReasons: gradeResult.reasons,
      profitProjection,
      equityPercent,
      mortgageBalance: mortgageBalance ?? null,
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Deal analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
