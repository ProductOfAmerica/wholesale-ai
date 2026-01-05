import type { RiskLevel, StrategyRecommendation } from '@wholesale-ai/shared';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Star,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StrategyCardProps {
  recommendation: StrategyRecommendation;
}

const riskConfig: Record<RiskLevel, { color: string; bg: string }> = {
  low: { color: 'text-emerald-600', bg: 'bg-emerald-100' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-100' },
  high: { color: 'text-red-600', bg: 'bg-red-100' },
};

const strategyNames: Record<string, string> = {
  assignment: 'Assignment',
  double_close: 'Double Close',
  wholetail: 'Wholetail',
  subject_to: 'Subject-To',
  morby_method: 'Morby Method',
  novation: 'Novation',
  seller_finance: 'Seller Finance',
};

export function StrategyCard({ recommendation }: StrategyCardProps) {
  const risk = riskConfig[recommendation.riskLevel];
  const strategyName =
    strategyNames[recommendation.strategy] || recommendation.strategy;

  return (
    <Card className="relative">
      {recommendation.rank === 1 && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-yellow-500 text-white">
            <Star className="mr-1 h-3 w-3" />
            RECOMMENDED
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{strategyName}</CardTitle>
          <div
            className={`rounded-full px-2 py-1 text-xs font-medium ${risk.bg} ${risk.color}`}
          >
            {recommendation.riskLevel.toUpperCase()} RISK
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-muted-foreground">Est. Profit</p>
              <p className="font-semibold">
                ${recommendation.estimatedProfit.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-muted-foreground">Timeline</p>
              <p className="font-semibold">{recommendation.timeToClose}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Pros</p>
          <div className="space-y-1">
            {recommendation.pros.slice(0, 3).map((pro) => (
              <div key={pro} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                <span>{pro}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Cons</p>
          <div className="space-y-1">
            {recommendation.cons.slice(0, 2).map((con) => (
              <div key={con} className="flex items-start gap-2 text-sm">
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                <span>{con}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Requirements
          </p>
          <div className="space-y-1">
            {recommendation.requirements.slice(0, 2).map((req) => (
              <div key={req} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                <span>{req}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
