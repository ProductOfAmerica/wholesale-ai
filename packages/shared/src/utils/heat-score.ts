import type {
  DistressIndicator,
  DistressType,
  HeatCategory,
} from '../types/lead.js';

export const DISTRESS_WEIGHTS: Record<DistressType, number> = {
  foreclosure: 10,
  nod: 10,
  utility_shutoff: 10,
  demolition: 9,
  code_violation: 8,
  tax_delinquency: 7,
  probate: 7,
  eviction: 6,
  bankruptcy: 5,
  divorce: 5,
  vacancy: 4,
  expired_listing: 3,
  absentee_owner: 2,
};

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export function calculateTimeDecay(dateRecorded: string | Date): number {
  const recordedDate =
    typeof dateRecorded === 'string' ? new Date(dateRecorded) : dateRecorded;
  const now = new Date();
  const ageMs = now.getTime() - recordedDate.getTime();

  return ageMs < NINETY_DAYS_MS ? 1.0 : 0.5;
}

export function calculateHeatScore(
  indicators: Pick<DistressIndicator, 'weight' | 'decayedWeight'>[]
): number {
  return indicators.reduce(
    (sum, indicator) => sum + indicator.decayedWeight,
    0
  );
}

export function calculateHeatScoreFromRaw(
  indicators: { type: DistressType; dateRecorded: string }[]
): {
  heatScore: number;
  processedIndicators: DistressIndicator[];
} {
  const processedIndicators: DistressIndicator[] = indicators.map((ind) => {
    const weight = DISTRESS_WEIGHTS[ind.type];
    const decay = calculateTimeDecay(ind.dateRecorded);
    return {
      type: ind.type,
      weight,
      dateRecorded: ind.dateRecorded,
      decayedWeight: weight * decay,
    };
  });

  const heatScore = calculateHeatScore(processedIndicators);

  return { heatScore, processedIndicators };
}

export function getHeatCategory(score: number): HeatCategory {
  if (score >= 15) return 'CRITICAL';
  if (score >= 8) return 'HIGH_PRIORITY';
  return 'STREET_WORK';
}
