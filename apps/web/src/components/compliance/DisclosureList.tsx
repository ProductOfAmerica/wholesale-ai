'use client';

import type { RequiredDisclosure } from '@wholesale-ai/shared';
import { Check, ChevronDown, ChevronRight, Copy, FileText } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DisclosureListProps {
  disclosures: RequiredDisclosure[];
}

export function DisclosureList({ disclosures }: DisclosureListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (disclosures.length === 0) {
    return null;
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const placementLabel = (placement: string) => {
    switch (placement) {
      case 'contract':
        return 'In Contract';
      case 'separate_form':
        return 'Separate Form';
      case 'verbal':
        return 'Verbal';
      default:
        return placement;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Required Disclosures
          <Badge variant="secondary">{disclosures.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {disclosures.map((disclosure) => {
          const isExpanded = expandedIds.has(disclosure.id);
          const isCopied = copiedId === disclosure.id;

          return (
            <div
              key={disclosure.id}
              className="rounded-lg border bg-muted/50 p-3"
            >
              <button
                type="button"
                onClick={() => toggleExpanded(disclosure.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{disclosure.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {placementLabel(disclosure.placement)}
                </Badge>
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-2">
                  <div className="rounded bg-background p-3 text-sm">
                    {disclosure.content}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(disclosure.id, disclosure.content)
                    }
                    className="gap-1"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Text
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
