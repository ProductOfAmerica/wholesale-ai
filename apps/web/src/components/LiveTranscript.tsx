'use client';

import type { TranscriptEntry } from '@wholesale-ai/shared';
import { useEffect, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LiveTranscriptProps {
  transcript: TranscriptEntry[];
}

export function LiveTranscript({ transcript }: LiveTranscriptProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 pr-4">
          {transcript.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 italic">
              No transcript yet. Start a conversation to see transcription.
            </div>
          ) : (
            <div className="space-y-4">
              {transcript.map((entry, index) => (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className="flex items-start gap-3"
                >
                  <Badge
                    variant={entry.speaker === 'user' ? 'default' : 'secondary'}
                    className="min-w-fit"
                  >
                    {entry.speaker === 'user' ? 'You' : 'Seller'}
                  </Badge>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm break-words">{entry.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
