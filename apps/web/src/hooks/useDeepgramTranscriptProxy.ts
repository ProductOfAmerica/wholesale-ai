'use client';

import type { LiveTranscriptionEvent } from '@deepgram/sdk';
import type { TranscriptEntry } from '@wholesale-ai/shared';
import { useCallback, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface DeepgramConfig {
  model: string;
  encoding: string;
  sampleRate: number;
}

type DeepgramMessage = (LiveTranscriptionEvent | { type: string }) & {
  is_final?: boolean;
  channel?: LiveTranscriptionEvent['channel'];
  data?: { speaker?: number; turn_id?: string };
};

interface DeepgramHandlers {
  handleConnected: (resolve?: () => void) => void;
  handleError: (
    errorData: { error: string },
    reject?: (error: Error) => void
  ) => void;
  handleDisconnected: (data: { code: number; reason: string }) => void;
  handleMessage: (message: DeepgramMessage) => void;
}

interface DeepgramTranscriptProxy {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudio: (audioData: ArrayBuffer) => void;
  isConnected: boolean;
  error: string | null;
  transcript: string;
  finalTranscript: string;
  currentSpeaker: number | null;
  turnId: string | null;
  clearTranscript: () => void;
  setOnTranscriptUpdate: (callback: (entry: TranscriptEntry) => void) => void;
}

// Helper functions for Deepgram connection
function processTranscriptResult(message: DeepgramMessage): {
  transcript?: string;
  isFinal: boolean;
} {
  if (message.type !== 'Results') return { isFinal: false };

  const transcript = message.channel?.alternatives?.[0]?.transcript;
  if (!transcript) return { isFinal: false };

  return {
    transcript,
    isFinal: message.is_final || false,
  };
}

function processTurnInfo(message: DeepgramMessage): {
  speaker?: number;
  turnId?: string;
} {
  if (message.type !== 'TurnInfo') return {};

  return {
    speaker: message.data?.speaker,
    turnId: message.data?.turn_id,
  };
}

function setupDeepgramConnection(
  socket: Socket,
  config: DeepgramConfig,
  handlers: DeepgramHandlers
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Set up event listeners
    socket.once('deepgram_connected', () => handlers.handleConnected(resolve));
    socket.on('deepgram_error', (errorData: { error: string }) =>
      handlers.handleError(errorData, reject)
    );
    socket.on('deepgram_disconnected', handlers.handleDisconnected);
    socket.on('deepgram_message', handlers.handleMessage);

    // Start connection
    socket.emit('deepgram_connect', {
      model: config.model,
      encoding: config.encoding,
      sampleRate: config.sampleRate,
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 10000);
  });
}

export function useDeepgramTranscriptProxy(
  socket: Socket | null,
  config: DeepgramConfig
): DeepgramTranscriptProxy {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [currentSpeaker, setCurrentSpeaker] = useState<number | null>(null);
  const [turnId, setTurnId] = useState<string | null>(null);
  const onTranscriptUpdateRef = useRef<
    ((entry: TranscriptEntry) => void) | null
  >(null);

  const createDeepgramHandlers = useCallback((): DeepgramHandlers => {
    const handleConnected = (resolve?: () => void) => {
      console.log('Deepgram connected via proxy');
      setIsConnected(true);
      resolve?.();
    };

    const handleError = (
      errorData: { error: string },
      reject?: (error: Error) => void
    ) => {
      console.error('Deepgram proxy error:', errorData.error);
      setError(errorData.error);
      setIsConnected(false);
      reject?.(new Error(errorData.error));
    };

    const handleDisconnected = (data: { code: number; reason: string }) => {
      console.log('Deepgram disconnected via proxy:', data.code, data.reason);
      setIsConnected(false);
    };

    const handleMessage = (message: DeepgramMessage) => {
      console.log('Deepgram message via proxy:', message.type);

      const transcriptResult = processTranscriptResult(message);
      if (transcriptResult.transcript) {
        if (transcriptResult.isFinal) {
          setFinalTranscript(transcriptResult.transcript);
          setTranscript('');
        } else {
          setTranscript(transcriptResult.transcript);
        }
      }

      const turnInfo = processTurnInfo(message);
      if (turnInfo.speaker !== undefined) {
        setCurrentSpeaker(turnInfo.speaker || null);
      }
      if (turnInfo.turnId !== undefined) {
        setTurnId(turnInfo.turnId || null);
      }
    };

    return {
      handleConnected,
      handleError,
      handleDisconnected,
      handleMessage,
    };
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    if (!socket) {
      throw new Error('Socket not available');
    }

    console.log('Connecting to Deepgram via Socket.io proxy...');
    setError(null);

    const handlers = createDeepgramHandlers();
    return setupDeepgramConnection(socket, config, handlers);
  }, [socket, config, createDeepgramHandlers]);

  const disconnect = useCallback(() => {
    if (socket && isConnected) {
      console.log('Disconnecting from Deepgram proxy...');
      socket.emit('end_call'); // This will close the Deepgram connection on server
      setIsConnected(false);
      setTranscript('');
      setFinalTranscript('');
      setCurrentSpeaker(null);
      setTurnId(null);
      setError(null);
    }
  }, [socket, isConnected]);

  const sendAudio = useCallback(
    (audioData: ArrayBuffer) => {
      if (!socket) {
        console.warn('Cannot send audio: socket not available');
        return;
      }

      socket.emit('deepgram_audio', audioData);
    },
    [socket]
  );

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setCurrentSpeaker(null);
    setTurnId(null);
  }, []);

  const setOnTranscriptUpdate = useCallback(
    (callback: (entry: TranscriptEntry) => void) => {
      onTranscriptUpdateRef.current = callback;
    },
    []
  );

  // Note: We don't listen for transcript_update here to avoid duplicates
  // The AudioShell component handles transcript_update events directly

  return {
    connect,
    disconnect,
    sendAudio,
    isConnected,
    error,
    transcript,
    finalTranscript,
    currentSpeaker,
    turnId,
    clearTranscript,
    setOnTranscriptUpdate,
  };
}
