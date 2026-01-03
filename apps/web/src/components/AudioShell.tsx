'use client';

import type { AISuggestion, TranscriptEntry } from '@wholesale-ai/shared';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { AISuggestions } from '@/components/AISuggestions';
import { AudioControls } from '@/components/AudioControls';
import { AudioLevelBars, AudioVisualizer } from '@/components/AudioVisualizer';
import { LiveTranscript } from '@/components/LiveTranscript';
import { MotivationGauge } from '@/components/MotivationGauge';
import { useAudioStream } from '@/hooks/useAudioStream';
import { useDeepgramTranscriptProxy } from '@/hooks/useDeepgramTranscriptProxy';

// Environment warning components
function WarningIcon() {
  return (
    <svg
      className="w-5 h-5 text-yellow-600"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <title>Warning</title>
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WarningHeader() {
  return (
    <div className="flex items-center gap-2">
      <WarningIcon />
      <span className="text-yellow-800 font-medium">
        Environment Setup Required
      </span>
    </div>
  );
}

function WarningContent() {
  return (
    <p className="mt-2 text-yellow-700 text-sm">
      Waiting for Socket.io connection to enable real-time audio transcription
      via WebSocket proxy.
    </p>
  );
}

function EnvironmentWarning({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <WarningHeader />
      <WarningContent />
    </div>
  );
}

export function AudioShell() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentSuggestion, setCurrentSuggestion] =
    useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  // Audio stream hook
  const audioStream = useAudioStream({
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
  });

  // Deepgram transcript proxy hook (via Socket.io)
  const deepgramTranscript = useDeepgramTranscriptProxy(socket, {
    model: 'flux-general-en',
    encoding: 'linear16',
    sampleRate: 16000,
  });

  // Socket.io connection
  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socketInstance = io(socketUrl);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socketInstance.on('connection_ready', () => {
      console.log('Call connection ready');
    });

    socketInstance.on('transcript_update', (data: TranscriptEntry) => {
      console.log('Transcript update from server:', data);
      setTranscript((prev) => [...prev, data]);

      if (data.speaker === 'seller') {
        setAiLoading(true);
      }
    });

    socketInstance.on('ai_suggestion', (data: AISuggestion) => {
      console.log('AI suggestion:', data);
      setCurrentSuggestion(data);
      setAiLoading(false);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Handle Deepgram transcripts
  useEffect(() => {
    deepgramTranscript.setOnTranscriptUpdate((entry: TranscriptEntry) => {
      console.log('Deepgram transcript:', entry);

      // Add to local transcript
      setTranscript((prev) => [...prev, entry]);

      // Send to server for AI analysis
      if (socket && entry.text.trim()) {
        socket.emit('transcript_update', entry);

        if (entry.speaker === 'seller' || entry.speaker.includes('speaker_')) {
          setAiLoading(true);
        }
      }
    });
  }, [socket, deepgramTranscript]);

  // Start call with real audio
  const handleStartRealAudioCall = useCallback(async () => {
    if (!socket || !connected) {
      alert('Socket.io connection is required. Please wait for connection.');
      return;
    }

    try {
      setIsCallActive(true);
      setTranscript([]);
      setCurrentSuggestion(null);
      setAiLoading(false);

      // Connect to Deepgram via Socket.io proxy (no client-side API key needed)
      await deepgramTranscript.connect();

      // Start audio recording and stream to Deepgram via Socket.io proxy
      await audioStream.startRecording((audioChunk: Blob) => {
        deepgramTranscript.sendAudio(audioChunk);
      });

      // Notify server that call started
      socket.emit('start_call');

      console.log('Real audio call started successfully via secure proxy');
    } catch (error) {
      console.error('Failed to start real audio call:', error);
      alert(
        `Failed to start call: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsCallActive(false);
    }
  }, [socket, connected, deepgramTranscript, audioStream]);

  // End call
  const handleEndCall = useCallback(() => {
    setIsCallActive(false);

    // Stop audio recording
    audioStream.stopRecording();

    // Disconnect from Deepgram
    deepgramTranscript.disconnect();

    // Clear transcripts
    deepgramTranscript.clearTranscript();

    // Notify server
    if (socket) {
      socket.emit('end_call');
    }

    console.log('Call ended');
  }, [audioStream, deepgramTranscript, socket]);

  // Handle start/stop recording
  const handleStartRecording = useCallback(() => {
    if (!isCallActive) {
      handleStartRealAudioCall();
    }
  }, [isCallActive, handleStartRealAudioCall]);

  const handleStopRecording = useCallback(() => {
    if (isCallActive) {
      handleEndCall();
    }
  }, [isCallActive, handleEndCall]);

  // Environment check - now we just need Socket.io connection
  const hasRequiredEnvVars = connected;

  return (
    <>
      {/* Environment Warning */}
      <EnvironmentWarning show={!hasRequiredEnvVars} />

      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-base font-medium">
              Socket: {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
            <div className="text-base font-medium">
              Deepgram:{' '}
              {deepgramTranscript.isConnected
                ? '🟢 Connected'
                : '🔴 Disconnected'}
            </div>
            <div className="text-base font-medium">
              Call: {isCallActive ? '🎙️ Active' : '⏸️ Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="mb-6">
        <AudioControls
          isRecording={audioStream.isRecording}
          isConnected={
            audioStream.isConnected && deepgramTranscript.isConnected
          }
          audioLevel={audioStream.audioLevel}
          error={audioStream.error || deepgramTranscript.error}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />
      </div>

      {/* Audio Visualization */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <AudioVisualizer
          audioLevel={audioStream.audioLevel}
          isRecording={audioStream.isRecording}
          width={300}
          height={80}
        />
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Audio Level Bars
          </h3>
          <div className="flex items-center justify-center">
            <AudioLevelBars
              audioLevel={audioStream.audioLevel}
              isRecording={audioStream.isRecording}
              barCount={25}
            />
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Live Transcript</h2>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  Loading transcript...
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="h-32 flex items-center justify-center text-gray-500">
                  Loading motivation gauge...
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">AI Suggestions</h2>
                <div className="h-80 flex items-center justify-center text-gray-500">
                  Loading AI suggestions...
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Live Transcript */}
          <div className="lg:col-span-2">
            <LiveTranscript transcript={transcript} />
          </div>

          {/* Right Column: AI Analysis */}
          <div className="space-y-6">
            {/* Motivation Gauge */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <MotivationGauge
                level={currentSuggestion?.motivation_level || 0}
                animated={true}
              />
            </div>

            {/* AI Suggestions */}
            <AISuggestions suggestion={currentSuggestion} loading={aiLoading} />
          </div>
        </div>
      </Suspense>

      {/* Real-Time Transcript Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">
          Live Deepgram Transcript
        </h3>

        {/* Interim transcript */}
        {deepgramTranscript.transcript && (
          <div className="mb-2 p-2 bg-blue-100 rounded text-blue-700 italic">
            <span className="text-xs text-blue-600">Interim:</span>{' '}
            {deepgramTranscript.transcript}
          </div>
        )}

        {/* Final transcript */}
        {deepgramTranscript.finalTranscript && (
          <div className="p-2 bg-white rounded text-gray-800 border">
            <span className="text-xs text-green-600">Final:</span>{' '}
            {deepgramTranscript.finalTranscript}
          </div>
        )}

        {/* Speaker info */}
        {deepgramTranscript.currentSpeaker !== null && (
          <div className="mt-2 text-sm text-blue-600">
            Current Speaker: {deepgramTranscript.currentSpeaker}
            {deepgramTranscript.turnId && (
              <span className="ml-2">Turn ID: {deepgramTranscript.turnId}</span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
