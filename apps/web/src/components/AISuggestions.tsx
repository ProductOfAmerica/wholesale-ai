'use client';

import type { AISuggestion } from '@wholesale-ai/shared';
import { AlertTriangleIcon, MessageSquareIcon, TargetIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface AISuggestionsProps {
  suggestion: AISuggestion | null;
  loading?: boolean;
}

export function AISuggestions({
  suggestion,
  loading = false,
}: AISuggestionsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-12" />
            <Skeleton className="h-20" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {!suggestion ? (
            <div className="text-muted-foreground text-center py-8 italic">
              No AI suggestions yet. Start simulating speech to get insights.
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {/* Motivation Level */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Motivation Level</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl font-bold ${
                          suggestion.motivation_level >= 7
                            ? 'text-green-600'
                            : suggestion.motivation_level >= 4
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {suggestion.motivation_level}
                      </span>
                      <span className="text-muted-foreground text-sm">/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Objection Alert */}
              {suggestion.objection_detected && (
                <Alert variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Objection Detected:</strong>{' '}
                    {suggestion.objection_type || 'General'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Pain Points */}
              {suggestion.pain_points.length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm font-medium mb-3">Pain Points</div>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.pain_points.map((point) => (
                        <Badge key={point} variant="secondary">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggested Response */}
              <Alert className="border-blue-200 bg-blue-50">
                <MessageSquareIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium text-blue-800 mb-2">
                    Suggested Response
                  </div>
                  <div className="text-sm text-blue-700 italic">
                    "{suggestion.suggested_response}"
                  </div>
                </AlertDescription>
              </Alert>

              {/* Recommended Next Move */}
              <Alert className="border-green-200 bg-green-50">
                <TargetIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium text-green-800 mb-2">
                    Next Move
                  </div>
                  <div className="text-sm text-green-700">
                    {suggestion.recommended_next_move}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Error Display */}
              {suggestion.error && (
                <Alert variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    Analysis error: {suggestion.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
