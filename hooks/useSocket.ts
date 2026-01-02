'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { TranscriptEntry, AISuggestion } from '../types/transcription';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io();
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

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const startCall = () => {
    if (socket) {
      socket.emit('start_call');
    }
  };

  const endCall = () => {
    if (socket) {
      socket.emit('end_call');
    }
  };

  const simulateSpeech = (speaker: string, text: string) => {
    if (socket && text.trim()) {
      socket.emit('simulate_speech', {
        speaker,
        text: text.trim()
      });
    }
  };

  const onTranscriptUpdate = (callback: (data: TranscriptEntry) => void) => {
    if (socket) {
      socket.on('transcript_update', callback);
      return () => socket.off('transcript_update', callback);
    }
    return () => {};
  };

  const onAISuggestion = (callback: (data: AISuggestion) => void) => {
    if (socket) {
      socket.on('ai_suggestion', callback);
      return () => socket.off('ai_suggestion', callback);
    }
    return () => {};
  };

  return {
    socket,
    connected,
    startCall,
    endCall,
    simulateSpeech,
    onTranscriptUpdate,
    onAISuggestion
  };
}