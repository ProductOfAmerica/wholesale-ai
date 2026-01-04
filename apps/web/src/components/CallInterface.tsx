'use client';

import type {
  AISuggestion,
  CallSummary,
  TranscriptEntry,
} from '@wholesale-ai/shared';
import { ClipboardCopyIcon, DownloadIcon, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AISuggestions } from '@/components/AISuggestions';
import { AudioLevelBars } from '@/components/AudioVisualizer';
import { ConfigSheet } from '@/components/ConfigSheet';
import { LiveTranscript } from '@/components/LiveTranscript';
import { MotivationGauge } from '@/components/MotivationGauge';
import { PhoneDialer } from '@/components/PhoneDialer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMicCapture } from '@/hooks/useMicCapture';
import { useSocket } from '@/hooks/useSocket';
import { type CallStatus, useTwilioCall } from '@/hooks/useTwilioCall';
import { debug } from '@/lib/utils';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function ConnectionStatus({
  socketConnected,
  deviceReady,
  callStatus,
}: {
  socketConnected: boolean;
  deviceReady: boolean;
  callStatus: CallStatus;
}) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
        />
        <span className={socketConnected ? 'text-green-700' : 'text-red-700'}>
          {socketConnected ? 'Server Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${deviceReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}
        />
        <span className={deviceReady ? 'text-green-700' : 'text-yellow-700'}>
          {deviceReady ? 'Phone Ready' : 'Initializing...'}
        </span>
      </div>

      {callStatus !== 'idle' && (
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              callStatus === 'connected'
                ? 'bg-green-500 animate-pulse'
                : callStatus === 'ringing'
                  ? 'bg-yellow-500 animate-pulse'
                  : callStatus === 'initiating'
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-400'
            }`}
          />
          <span className="text-gray-700 capitalize">{callStatus}</span>
        </div>
      )}
    </div>
  );
}

function ActiveCallHeader({
  phoneNumber,
  duration,
  onEndCall,
  audioLevel,
}: {
  phoneNumber: string;
  duration: number;
  onEndCall: () => void;
  audioLevel: number;
}) {
  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm opacity-80 mb-1">Call in Progress</div>
          <div className="text-2xl font-bold">{phoneNumber}</div>
          <div className="text-3xl font-mono mt-2">
            {formatDuration(duration)}
          </div>
        </div>

        <Button
          onClick={onEndCall}
          className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-200 hover:scale-105"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <title>End Call</title>
            <path d="M3.26 11.602C3.942 8.327 6.793 6 10 6c3.207 0 6.058 2.327 6.74 5.602a.75.75 0 00.99.542l2.52-.84a.75.75 0 00.474-.958A12.01 12.01 0 0010 4a12.01 12.01 0 00-10.724 6.346.75.75 0 00.474.958l2.52.84a.75.75 0 00.99-.542zM17.5 15.5a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM15.5 13a.75.75 0 000-1.5h-11a.75.75 0 000 1.5h11z" />
          </svg>
        </Button>
      </div>

      <div className="mt-4">
        <AudioLevelBars
          audioLevel={audioLevel}
          isRecording={true}
          barCount={30}
        />
      </div>
    </div>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: main call UI has inherent complexity with multiple call states
export function CallInterface() {
  const { socket, connected, onReconnect } = useSocket();
  const {
    callState,
    deviceReady,
    startCall,
    endCall,
    resetCall,
    reassociateCall,
  } = useTwilioCall(socket);
  const { audioLevel, startCapture, stopCapture } = useMicCapture();

  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentSuggestion, setCurrentSuggestion] =
    useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [initialScript, setInitialScript] = useState<string>('');
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryTextLoading, setSummaryTextLoading] = useState(false);
  const [structuredDataLoading, setStructuredDataLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string>('');

  useEffect(() => {
    onReconnect(reassociateCall);
  }, [onReconnect, reassociateCall]);

  useEffect(() => {
    if (!socket) return;

    socket.on('transcript_update', (data: TranscriptEntry) => {
      debug.log('Transcript update:', data);
      setTranscript((prev) => [...prev, data]);

      if (data.speaker === 'seller') {
        setAiLoading(true);
        setStreamingText('');
      }
    });

    socket.on('ai_suggestion_start', () => {
      setStreamingText('');
      setAiLoading(true);
    });

    socket.on('ai_suggestion_token', (token: string) => {
      setStreamingText((prev) => prev + token);
    });

    socket.on('ai_suggestion_end', () => {
      setAiLoading(false);
    });

    socket.on('ai_suggestion', (data: AISuggestion) => {
      debug.log('AI suggestion:', data);
      setCurrentSuggestion(data);
      setAiLoading(false);
    });

    socket.on('twilio_stream_started', () => {
      debug.log('Audio stream started for transcription');
    });

    return () => {
      socket.off('transcript_update');
      socket.off('ai_suggestion_start');
      socket.off('ai_suggestion_token');
      socket.off('ai_suggestion_end');
      socket.off('ai_suggestion');
      socket.off('twilio_stream_started');
    };
  }, [socket]);

  useEffect(() => {
    if (callState.status === 'connected') {
      startCapture();
    } else if (
      callState.status === 'ended' ||
      callState.status === 'error' ||
      callState.status === 'idle'
    ) {
      stopCapture();
    }

    return () => {
      stopCapture();
    };
  }, [callState.status, startCapture, stopCapture]);

  const handleStartCall = useCallback(
    async (phoneNumber: string) => {
      setTranscript([]);
      setCurrentSuggestion(null);
      setCallSummary(null);
      setAiLoading(false);
      await startCall(phoneNumber);
    },
    [startCall]
  );

  const handleEndCall = useCallback(async () => {
    endCall();

    if (transcript.length === 0) return;

    setSummaryLoading(true);
    setSummaryTextLoading(true);
    setStructuredDataLoading(true);

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      const response = await fetch(`${serverUrl}/twilio/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          duration: callState.duration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get summary');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);

              switch (currentEvent) {
                case 'summary_start':
                  setSummaryLoading(false);
                  setSummaryTextLoading(false);
                  setCallSummary((prev) => ({
                    duration: prev?.duration ?? callState.duration,
                    final_motivation_level: prev?.final_motivation_level ?? 0,
                    pain_points: prev?.pain_points ?? [],
                    objections: prev?.objections ?? [],
                    summary: '',
                    next_steps: prev?.next_steps ?? '',
                  }));
                  break;

                case 'summary_token':
                  setCallSummary((prev) =>
                    prev
                      ? { ...prev, summary: prev.summary + parsed }
                      : {
                          duration: callState.duration,
                          final_motivation_level: 0,
                          pain_points: [],
                          objections: [],
                          summary: parsed,
                          next_steps: '',
                        }
                  );
                  break;

                case 'structured_data':
                  setStructuredDataLoading(false);
                  setCallSummary((prev) =>
                    prev
                      ? { ...prev, ...parsed }
                      : {
                          duration: callState.duration,
                          summary: '',
                          ...parsed,
                        }
                  );
                  break;

                case 'done':
                  setCallSummary(parsed);
                  setSummaryLoading(false);
                  setSummaryTextLoading(false);
                  setStructuredDataLoading(false);
                  break;

                case 'error':
                  console.error('SSE error:', parsed.error);
                  break;
              }
            } catch {
              // Non-JSON data, skip
            }
            currentEvent = '';
          }
        }
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummaryLoading(false);
      setSummaryTextLoading(false);
      setStructuredDataLoading(false);
    }
  }, [endCall, transcript, callState.duration]);

  const handleNewCall = useCallback(() => {
    resetCall();
    setTranscript([]);
    setCurrentSuggestion(null);
    setCallSummary(null);
  }, [resetCall]);

  const isCallActive =
    callState.status === 'initiating' ||
    callState.status === 'ringing' ||
    callState.status === 'connected';

  const copyTranscript = useCallback(() => {
    const text = transcript
      .map(
        (t) =>
          `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.speaker}: ${t.text}`
      )
      .join('\n');
    navigator.clipboard.writeText(text).catch(console.error);
  }, [transcript]);

  const saveTranscript = useCallback(() => {
    const data = {
      phoneNumber: callState.phoneNumber,
      duration: callState.duration,
      date: new Date().toISOString(),
      transcript,
      summary: callSummary,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-${callState.phoneNumber}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcript, callState.phoneNumber, callState.duration, callSummary]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between">
        <ConnectionStatus
          socketConnected={connected}
          deviceReady={deviceReady}
          callStatus={callState.status}
        />
        <ConfigSheet
          onConfigChange={(config) => setInitialScript(config.initialScript)}
        />
      </div>

      {callState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <title>Error</title>
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Error: {callState.error}</span>
          </div>
          <Button
            onClick={handleNewCall}
            variant="outline"
            className="mt-3"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      )}

      {callState.status === 'idle' && (
        <PhoneDialer
          onCall={handleStartCall}
          disabled={!connected || !deviceReady}
        />
      )}

      {isCallActive && callState.phoneNumber && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActiveCallHeader
              phoneNumber={callState.phoneNumber}
              duration={callState.duration}
              onEndCall={handleEndCall}
              audioLevel={audioLevel}
            />
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <MotivationGauge
              level={currentSuggestion?.motivation_level || 0}
              animated={true}
            />
          </div>
        </div>
      )}

      {callState.status === 'ended' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Call Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summaryLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Analyzing call...
                    </p>
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ) : callSummary ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="text-2xl font-mono">
                        {formatDuration(callState.duration)}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      {summaryTextLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : (
                        <p className="text-sm">{callSummary.summary}</p>
                      )}
                    </div>

                    {structuredDataLoading ? (
                      <div className="space-y-4">
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                        </div>
                        <div>
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ) : (
                      <>
                        {callSummary.pain_points.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2">
                              Pain Points
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {callSummary.pain_points.map((point) => (
                                <Badge key={point} variant="secondary">
                                  {point}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {callSummary.objections.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2">
                              Objections
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {callSummary.objections.map((obj) => (
                                <Badge key={obj} variant="destructive">
                                  {obj}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-sm font-medium mb-2">Next Steps</div>
                          <p className="text-sm text-muted-foreground">
                            {callSummary.next_steps}
                          </p>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-2xl font-mono">
                      {formatDuration(callState.duration)}
                    </span>
                  </div>
                )}

                <Button onClick={handleNewCall} className="w-full mt-4">
                  Start New Call
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <MotivationGauge
              level={
                callSummary?.final_motivation_level ||
                currentSuggestion?.motivation_level ||
                0
              }
              animated={true}
            />
          </div>
        </div>
      )}

      {(isCallActive || callState.status === 'ended') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-2">
              <LiveTranscript transcript={transcript} />
              {transcript.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyTranscript}>
                    <ClipboardCopyIcon className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveTranscript}>
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Save JSON
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <AISuggestions
              suggestion={currentSuggestion}
              loading={aiLoading}
              initialScript={initialScript}
              streamingText={streamingText}
            />
          </div>
        </div>
      )}

      {callState.status === 'idle' && (
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            How It Works
          </h3>
          <ol className="space-y-2 text-blue-700">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              Enter the phone number you want to call
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              Click the Call button to initiate a WebRTC call via Twilio
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              The AI will transcribe and analyze the conversation in real-time
            </li>
            <li className="flex gap-2">
              <span className="font-bold">4.</span>
              Get live suggestions to help with your negotiation
            </li>
          </ol>

          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Ensure your Twilio account is configured
              with a verified phone number. For testing, you may need to verify
              the destination number in your Twilio console.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
