'use client';

import type { TranscriptEntry } from '@wholesale-ai/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface DeepgramConfig {
  model: string;
  encoding: string;
  sampleRate: number;
}

interface DeepgramTranscriptProxy {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudio: (audioData: Blob) => void;
  isConnected: boolean;
  error: string | null;
  transcript: string;
  finalTranscript: string;
  currentSpeaker: number | null;
  turnId: string | null;
  clearTranscript: () => void;
  setOnTranscriptUpdate: (callback: (entry: TranscriptEntry) => void) => void;
}

export function useDeepgramTranscriptProxy(
  socket: Socket | null,
  config: DeepgramConfig,
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

  const connect = useCallback(async (): Promise<void> => {
    if (!socket) {
      throw new Error('Socket not available');
    }

    return new Promise((resolve, reject) => {
      console.log('Connecting to Deepgram via Socket.io proxy...');

      setError(null);

      // Set up event listeners
      const handleConnected = () => {
        console.log('Deepgram connected via proxy');
        setIsConnected(true);
        resolve();
      };

      const handleError = (errorData: { error: string }) => {
        console.error('Deepgram proxy error:', errorData.error);
        setError(errorData.error);
        setIsConnected(false);
        reject(new Error(errorData.error));
      };

      const handleDisconnected = (data: { code: number; reason: string }) => {
        console.log('Deepgram disconnected via proxy:', data.code, data.reason);
        setIsConnected(false);
      };

      const handleMessage = (message: {
        type: string;
        channel?: { alternatives?: { transcript?: string }[] };
        is_final?: boolean;
        data?: { speaker?: number; turn_id?: string };
      }) => {
        console.log('Deepgram message via proxy:', message.type);

        if (message.type === 'Results') {
          const transcript = message.channel?.alternatives?.[0]?.transcript;
          if (transcript) {
            if (message.is_final) {
              setFinalTranscript(transcript);
              setTranscript('');
            } else {
              setTranscript(transcript);
            }
          }
        } else if (message.type === 'TurnInfo') {
          setCurrentSpeaker(message.data?.speaker || null);
          setTurnId(message.data?.turn_id || null);
        }
      };

      socket.once('deepgram_connected', handleConnected);
      socket.on('deepgram_error', handleError);
      socket.on('deepgram_disconnected', handleDisconnected);
      socket.on('deepgram_message', handleMessage);

      // Start connection
      socket.emit('deepgram_connect', {
        model: config.model,
        encoding: config.encoding,
        sampleRate: config.sampleRate,
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }, [socket, config, isConnected]);

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
    (audioData: Blob) => {
      if (!socket || !isConnected) {
        console.warn('Cannot send audio: not connected');
        return;
      }

      audioData
        .arrayBuffer()
        .then((buffer) => {
          socket.emit('deepgram_audio', buffer);
        })
        .catch((err) => {
          console.error('Error converting audio blob:', err);
        });
    },
    [socket, isConnected],
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
    [],
  );

  // Listen for transcript updates from the server (processed Deepgram results)
  useEffect(() => {
    if (!socket) return;

    const handleTranscriptUpdate = (entry: TranscriptEntry) => {
      console.log('Transcript update from proxy:', entry);
      if (onTranscriptUpdateRef.current) {
        onTranscriptUpdateRef.current(entry);
      }
    };

    socket.on('transcript_update', handleTranscriptUpdate);

    return () => {
      socket.off('transcript_update', handleTranscriptUpdate);
    };
  }, [socket]);

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
