'use client';

import type { NextStepSuggestion } from '@wholesale-ai/shared';
import { NextStepPriority, NextStepType } from '@wholesale-ai/shared';
import { ArrowRight, FileText, Play } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NextStepsPanelProps {
  suggestions: NextStepSuggestion[];
}

const typeIcons = {
  [NextStepType.VIDEO]: Play,
  [NextStepType.ACTION]: ArrowRight,
  [NextStepType.REVIEW]: FileText,
};

const priorityStyles = {
  [NextStepPriority.HIGH]: 'border-l-red-500',
  [NextStepPriority.MEDIUM]: 'border-l-yellow-500',
  [NextStepPriority.LOW]: 'border-l-slate-300',
};

export function NextStepsPanel({ suggestions }: NextStepsPanelProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Next Steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((suggestion) => {
          const Icon = typeIcons[suggestion.type];
          const borderStyle = priorityStyles[suggestion.priority];
          const key = `${suggestion.type}-${suggestion.title}`;

          const content = (
            <div
              className={`flex gap-3 rounded-md border border-l-4 bg-slate-50 p-3 transition-colors hover:bg-slate-100 ${borderStyle}`}
            >
              <div className="mt-0.5 flex-shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{suggestion.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {suggestion.description}
                </p>
              </div>
            </div>
          );

          if (suggestion.link) {
            return (
              <Link key={key} href={suggestion.link} className="block">
                {content}
              </Link>
            );
          }

          return <div key={key}>{content}</div>;
        })}
      </CardContent>
    </Card>
  );
}
