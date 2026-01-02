'use client';

import { useEffect, useRef } from 'react';
import { TranscriptEntry } from '../types/transcription';

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
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Live Transcript</h2>
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        padding: '1rem', 
        height: '300px', 
        overflowY: 'auto',
        backgroundColor: '#f9f9f9'
      }}>
        {transcript.length === 0 ? (
          <div style={{ 
            color: '#666', 
            textAlign: 'center', 
            padding: '2rem 0',
            fontStyle: 'italic'
          }}>
            No transcript yet. Start a conversation to see transcription.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {transcript.map((entry, index) => (
              <div key={index}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: entry.speaker === 'user' ? '#dbeafe' : '#fed7aa',
                    color: entry.speaker === 'user' ? '#1d4ed8' : '#ea580c',
                    minWidth: 'fit-content'
                  }}>
                    {entry.speaker === 'user' ? 'You' : 'Seller'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#111827', 
                      wordWrap: 'break-word',
                      margin: 0
                    }}>
                      {entry.text}
                    </p>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280', 
                      marginTop: '0.25rem',
                      margin: '0.25rem 0 0 0'
                    }}>
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