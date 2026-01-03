'use client';

import type { AISuggestion } from '@wholesale-ai/shared';
import { AlertTriangleIcon, MessageSquareIcon } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AISuggestionsProps {
  suggestion: AISuggestion | null;
  loading?: boolean;
  initialScript?: string;
  streamingText?: string;
}

export function AISuggestions({
  suggestion,
  loading = false,
  initialScript,
  streamingText = '',
}: AISuggestionsProps) {
  const displayText = streamingText || suggestion?.suggested_response || initialScript;
  const isStreaming = loading && streamingText.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Suggested Response</CardTitle>
      </CardHeader>
      <CardContent>
        {!displayText && !loading ? (
          <div className="text-muted-foreground text-center py-4 italic text-sm">
            Waiting for conversation...
          </div>
        ) : (
          <div className="space-y-3">
            {suggestion?.objection_detected && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Objection: {suggestion.objection_type || 'General'}
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-200 bg-blue-50">
              <MessageSquareIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="text-base text-blue-800 leading-relaxed">
                  {displayText || (loading ? '...' : '')}
                  {isStreaming && <span className="animate-pulse">|</span>}
                </div>
              </AlertDescription>
            </Alert>

            {suggestion?.recommended_next_move && !isStreaming && (
              <div className="text-xs text-muted-foreground">
                Next: {suggestion.recommended_next_move}
              </div>
            )}

            {suggestion?.error && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {suggestion.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
