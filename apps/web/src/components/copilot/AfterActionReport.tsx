'use client';

import type { CallSessionAAR } from '@wholesale-ai/shared';
import {
  BrainIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DollarSignIcon,
  HeartIcon,
  WrenchIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export interface AfterActionReportProps {
  aar: CallSessionAAR | null;
}

export function AfterActionReport({ aar }: AfterActionReportProps) {
  if (!aar) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ClipboardListIcon className="h-5 w-5" />
          After Action Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">TCPM Summary</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Timeline:</span>{' '}
                <span className="text-muted-foreground">
                  {aar.tcpmSummary.timeline || 'Not discussed'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <WrenchIcon className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Condition:</span>{' '}
                <span className="text-muted-foreground">
                  {aar.tcpmSummary.condition || 'Not discussed'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <DollarSignIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Price:</span>{' '}
                <span className="text-muted-foreground">
                  {aar.tcpmSummary.price || 'Not discussed'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <HeartIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Motivation:</span>{' '}
                <span className="text-muted-foreground">
                  {aar.tcpmSummary.motivation || 'Not discussed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {aar.aiDecisions.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <BrainIcon className="h-4 w-4" />
                AI Decision Log
              </div>
              <div className="space-y-2">
                {aar.aiDecisions.map((decision, idx) => (
                  <div
                    key={`${decision.timestamp}-${idx}`}
                    className="text-sm bg-gray-50 rounded p-2"
                  >
                    <div className="font-medium">{decision.decision}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {decision.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {aar.nextSteps.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="text-sm font-medium mb-2">Next Steps</div>
              <ul className="space-y-1.5">
                {aar.nextSteps.map((step) => (
                  <li key={step} className="flex items-start gap-2 text-sm">
                    <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
