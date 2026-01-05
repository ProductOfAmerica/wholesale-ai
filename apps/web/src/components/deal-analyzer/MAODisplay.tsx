import type { MAOBreakdown } from '@wholesale-ai/shared';
import { formatCurrency } from '@wholesale-ai/shared';
import { ArrowDown, Equal, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MAODisplayProps {
  breakdown: MAOBreakdown;
}

export function MAODisplay({ breakdown }: MAODisplayProps) {
  const { arv, arvMultiplier, repairs, wholesaleFee, mao } = breakdown;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">MAO Calculation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">ARV</span>
          <span className="font-medium">{formatCurrency(arv)}</span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4" />
            <span>× {(arvMultiplier * 100).toFixed(0)}%</span>
          </span>
          <span className="font-medium">
            {formatCurrency(arv * arvMultiplier)}
          </span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-2">
            <Minus className="h-4 w-4" />
            <span>Repairs</span>
          </span>
          <span className="font-medium text-red-600">
            -{formatCurrency(repairs)}
          </span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-2">
            <Minus className="h-4 w-4" />
            <span>Wholesale Fee</span>
          </span>
          <span className="font-medium text-red-600">
            -{formatCurrency(wholesaleFee)}
          </span>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <Equal className="h-4 w-4" />
              <span>MAO</span>
            </span>
            <span className="text-xl font-bold text-emerald-600">
              {formatCurrency(mao)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
