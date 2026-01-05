import type { PipelineStage } from '@wholesale-ai/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PipelineChartProps {
  stages: PipelineStage[];
}

export function PipelineChart({ stages }: PipelineChartProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Pipeline Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage) => {
            const widthPercent = (stage.count / maxCount) * 100;
            return (
              <div key={stage.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.name}</span>
                  <span className="text-muted-foreground">
                    {stage.count} leads
                    {stage.value > 0 && (
                      <span className="ml-2 text-green-600">
                        ${(stage.value / 1000).toFixed(0)}k
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
