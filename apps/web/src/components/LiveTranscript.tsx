'use client';

import type { TranscriptEntry } from '@wholesale-ai/shared';
import { useEffect, useRef } from 'react';

interface LiveTranscriptProps {
  transcript: TranscriptEntry[];
}

export function LiveTranscript({ transcript }: LiveTranscriptProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Live Transcript</h2>
      <div className="border border-gray-300 rounded-lg p-4 h-80 overflow-y-auto bg-gray-50">
        {transcript.length === 0 ? (
          <div className="text-gray-600 text-center py-8 italic">
            No transcript yet. Start a conversation to see transcription.
          </div>
        ) : (
          <div className="space-y-3">
            {transcript.map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`}>
                <div className="flex items-start gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium min-w-fit ${
                      entry.speaker === 'user'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {entry.speaker === 'user' ? 'You' : 'Seller'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 break-words">
                      {entry.text}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
