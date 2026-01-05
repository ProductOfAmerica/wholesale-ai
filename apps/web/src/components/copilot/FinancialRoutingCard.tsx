'use client';

import { DealStrategy, type FinancialRouting } from '@wholesale-ai/shared';
import { CheckCircleIcon, TargetIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const STRATEGY_LABELS: Record<DealStrategy, string> = {
  [DealStrategy.ASSIGNMENT]: 'Assignment',
  [DealStrategy.DOUBLE_CLOSE]: 'Double Close',
  [DealStrategy.WHOLETAIL]: 'Wholetail',
  [DealStrategy.SUBJECT_TO]: 'Subject-To',
  [DealStrategy.MORBY_METHOD]: 'Morby Method',
  [DealStrategy.NOVATION]: 'Novation',
  [DealStrategy.SELLER_FINANCE]: 'Seller Finance',
};

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'bg-green-500';
  if (confidence >= 60) return 'bg-yellow-500';
  return 'bg-orange-500';
}

export interface FinancialRoutingCardProps {
  routing: FinancialRouting | null;
}

export function FinancialRoutingCard({ routing }: FinancialRoutingCardProps) {
  if (!routing) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TargetIcon className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-base text-blue-800">
            Recommended Strategy
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge className="text-sm bg-blue-600 hover:bg-blue-700">
            {STRATEGY_LABELS[routing.recommendedStrategy]}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {routing.confidence}% confident
            </span>
            <Progress
              value={routing.confidence}
              className={`w-16 h-2 ${getConfidenceColor(routing.confidence)}`}
            />
          </div>
        </div>

        {routing.reasoning.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-700">Reasoning:</div>
            <ul className="space-y-1">
              {routing.reasoning.map((reason) => (
                <li
                  key={reason}
                  className="text-xs text-gray-600 flex items-start gap-1.5"
                >
                  <CheckCircleIcon className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {routing.alternatives.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-blue-200">
            <div className="text-xs font-medium text-gray-700">
              Alternatives:
            </div>
            {routing.alternatives.map((alt) => (
              <div
                key={alt.strategy}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-600">
                  {STRATEGY_LABELS[alt.strategy]}
                </span>
                <span className="text-muted-foreground">
                  {alt.confidence}% - {alt.note}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
