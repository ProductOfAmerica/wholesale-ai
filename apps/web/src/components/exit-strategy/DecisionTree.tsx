import type {
  Tier1Result,
  Tier2Result,
  Tier3Result,
  TierRecommendation,
} from '@wholesale-ai/shared';
import { ArrowDown, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DecisionTreeProps {
  tier1: Tier1Result;
  tier2: Tier2Result | null;
  tier3: Tier3Result | null;
}

interface TierNodeProps {
  title: string;
  isActive: boolean;
  isPassed: boolean;
  details: string[];
  result: string;
}

function getNodeStyles(isPassed: boolean, isActive: boolean) {
  if (isPassed) {
    return {
      Icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50 border-emerald-200',
    };
  }
  if (isActive) {
    return {
      Icon: XCircle,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-50 border-red-200',
    };
  }
  return {
    Icon: Circle,
    iconColor: 'text-gray-300',
    bgColor: 'bg-gray-50 border-gray-200',
  };
}

function TierNode({
  title,
  isActive,
  isPassed,
  details,
  result,
}: TierNodeProps) {
  const { Icon, iconColor, bgColor } = getNodeStyles(isPassed, isActive);

  return (
    <div className={`rounded-lg border p-3 ${bgColor}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 ${iconColor}`} />
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {details.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
          <p className="mt-2 text-sm font-semibold">{result}</p>
        </div>
      </div>
    </div>
  );
}

const TIER1_RESULT_MAP: Record<TierRecommendation, string> = {
  standard: 'Standard wholesale path',
  pass: 'Consider passing on this deal',
  creative: 'Creative financing needed',
};

function buildTier2Details(tier2: Tier2Result | null): string[] {
  if (!tier2) return ['Not evaluated'];
  const debtStatus = tier2.hasExistingDebt
    ? 'Has existing debt'
    : 'Free & clear';
  const rateStatus = tier2.isLowRate
    ? 'Low rate - Sub-To viable'
    : 'Standard rate';
  return [debtStatus, `Interest rate: ${tier2.interestRate}%`, rateStatus];
}

function buildTier3Details(tier3: Tier3Result | null): string[] {
  if (!tier3) return ['Not evaluated'];
  const conditionStatus = tier3.isRetailCondition
    ? 'Retail-ready condition'
    : 'Needs work';
  const priceStatus = tier3.wantsMarketValue
    ? 'Seller wants full value'
    : 'Flexible on price';
  return [conditionStatus, priceStatus];
}

export function DecisionTree({ tier1, tier2, tier3 }: DecisionTreeProps) {
  const tier1Details = [
    `Equity: ${tier1.equityPercent.toFixed(1)}%`,
    `Spread: ${tier1.spreadPercent.toFixed(1)}%`,
  ];
  const tier1Result = TIER1_RESULT_MAP[tier1.recommendation];

  const tier2Active = tier1.recommendation === 'creative' && tier2 !== null;
  const tier2Details = buildTier2Details(tier2);
  const tier2Result = tier2?.recommendation
    ? `Recommended: ${tier2.recommendation.replace('_', ' ')}`
    : 'No specific recommendation';

  const tier3Active = tier1.recommendation === 'creative' && tier3 !== null;
  const tier3Details = buildTier3Details(tier3);
  const tier3Result = tier3?.recommendation
    ? 'Novation possible'
    : 'Novation not recommended';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Decision Path</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <TierNode
          title="Tier 1: Equity Test"
          isActive={true}
          isPassed={tier1.passesEquityTest}
          details={tier1Details}
          result={tier1Result}
        />

        <div className="flex justify-center">
          <ArrowDown
            className={`h-5 w-5 ${tier2Active ? 'text-gray-400' : 'text-gray-200'}`}
          />
        </div>

        <TierNode
          title="Tier 2: Debt Filter"
          isActive={tier2Active}
          isPassed={tier2Active && tier2?.recommendation !== null}
          details={tier2Details}
          result={tier2Active ? tier2Result : 'Skipped'}
        />

        <div className="flex justify-center">
          <ArrowDown
            className={`h-5 w-5 ${tier3Active ? 'text-gray-400' : 'text-gray-200'}`}
          />
        </div>

        <TierNode
          title="Tier 3: Condition Check"
          isActive={tier3Active}
          isPassed={tier3Active && tier3?.recommendation !== null}
          details={tier3Details}
          result={tier3Active ? tier3Result : 'Skipped'}
        />
      </CardContent>
    </Card>
  );
}
