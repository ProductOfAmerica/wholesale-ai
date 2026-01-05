import type { Comp } from '@wholesale-ai/shared';
import { formatCurrency, formatDate } from '@wholesale-ai/shared';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompListProps {
  comps: Comp[];
  arv: number;
  confidence?: number;
}

export function CompList({ comps, arv, confidence = 80 }: CompListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Comparable Sales</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">ARV: {formatCurrency(arv)}</Badge>
            <Badge
              className={
                confidence >= 80
                  ? 'bg-emerald-100 text-emerald-700'
                  : confidence >= 60
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }
            >
              {confidence}% confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {comps.map((comp) => (
            <div
              key={`${comp.address}-${comp.saleDate}`}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{comp.address}</span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{comp.sqft.toLocaleString()} sqft</span>
                  <span>{formatDate(comp.saleDate)}</span>
                  <span>{comp.distance.toFixed(1)} mi away</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatCurrency(comp.salePrice)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(comp.pricePerSqft)}/sqft
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
