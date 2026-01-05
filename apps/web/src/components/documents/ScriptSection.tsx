'use client';

import type { ScriptSection as ScriptSectionType } from '@wholesale-ai/shared';
import { ScriptSectionType as SectionTypeEnum } from '@wholesale-ai/shared';
import { ChevronDown, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScriptSectionProps {
  section: ScriptSectionType;
  variables: Record<string, string>;
}

const sectionColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  [SectionTypeEnum.OPENER]: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  [SectionTypeEnum.DISCOVERY]: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
  },
  [SectionTypeEnum.OBJECTION]: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
  [SectionTypeEnum.CLOSE]: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
  },
};

function replaceVariables(
  text: string,
  variables: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || `[${key}]`);
  }
  return result;
}

export function ScriptSectionComponent({
  section,
  variables,
}: ScriptSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const colors =
    sectionColors[section.type] || sectionColors[SectionTypeEnum.DISCOVERY];

  const handleCopy = async (text: string, index: number) => {
    const processed = replaceVariables(text, variables);
    await navigator.clipboard.writeText(processed);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={cn('rounded-lg border', colors.border, colors.bg)}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4"
      >
        <span className={cn('font-medium', colors.text)}>{section.name}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 transition-transform',
            colors.text,
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-2 px-4 pb-4">
          {section.notes && (
            <p className="mb-3 text-sm italic text-muted-foreground">
              {section.notes}
            </p>
          )}

          {section.lines.map((line, index) => (
            <div
              key={`${section.name}-line-${index}`}
              className="group flex items-start gap-2 rounded-md bg-white p-3"
            >
              <p className="flex-1 text-sm">
                {replaceVariables(line, variables)}
              </p>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleCopy(line, index)}
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy line</span>
              </Button>
              {copiedIndex === index && (
                <span className="text-xs text-green-600">Copied!</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
