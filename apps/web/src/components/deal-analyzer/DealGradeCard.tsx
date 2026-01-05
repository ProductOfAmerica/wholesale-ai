import type { DealGrade } from '@wholesale-ai/shared';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DealGradeCardProps {
  grade: DealGrade;
  reasons: string[];
}

const gradeConfig: Record<
  DealGrade,
  { color: string; bg: string; label: string }
> = {
  A: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Excellent' },
  B: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Good' },
  C: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Marginal' },
  F: { color: 'text-red-600', bg: 'bg-red-100', label: 'Pass' },
};

export function DealGradeCard({ grade, reasons }: DealGradeCardProps) {
  const config = gradeConfig[grade];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Deal Grade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-lg ${config.bg}`}
          >
            <span className={`text-3xl font-bold ${config.color}`}>
              {grade}
            </span>
          </div>
          <div>
            <p className={`text-lg font-semibold ${config.color}`}>
              {config.label}
            </p>
            <p className="text-sm text-muted-foreground">Deal Quality</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {reasons.map((reason) => (
            <div key={reason} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
