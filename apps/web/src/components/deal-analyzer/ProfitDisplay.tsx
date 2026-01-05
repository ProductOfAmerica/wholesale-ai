import type { ProfitProjection } from '@wholesale-ai/shared';
import { formatCurrency, formatPercent } from '@wholesale-ai/shared';
import { DollarSign, Percent, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfitDisplayProps {
  profit: ProfitProjection;
}

export function ProfitDisplay({ profit }: ProfitDisplayProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Profit Projection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-emerald-50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Your Fee</span>
            </div>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {formatCurrency(profit.assignmentFee)}
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Buyer Profit</span>
            </div>
            <p className="mt-1 text-xl font-bold text-blue-700">
              {formatCurrency(profit.estimatedProfit)}
            </p>
          </div>

          <div className="rounded-lg bg-purple-50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600">
              <Percent className="h-4 w-4" />
              <span className="text-sm font-medium">Buyer ROI</span>
            </div>
            <p className="mt-1 text-xl font-bold text-purple-700">
              {formatPercent(profit.roi)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>Holding Costs: {formatCurrency(profit.holdingCosts)}</span>
          <span>Closing Costs: {formatCurrency(profit.closingCosts)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
