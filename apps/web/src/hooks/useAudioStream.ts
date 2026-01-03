'use client';

import { useCallback, useRef, useState } from 'react';

interface AudioStreamConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

interface AudioStreamState {
  isRecording: boolean;
  isConnected: boolean;
  error: string | null;
  audioLevel: number;
}

export function useAudioStream(
  config: AudioStreamConfig = {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
  },
) {
  const [state, setState] = useState<AudioStreamState>({
    isRecording: false,
    isConnected: false,
    error: null,
    audioLevel: 0,
  });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const onDataAvailable = useRef<((chunk: Blob) => void) | null>(null);

  // Helper functions for audio setup
  const clearErrors = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const requestMicrophoneAccess = useCallback(async (): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: config.sampleRate,
        channelCount: config.channelCount,
        echoCancellation: config.echoCancellation,
        noiseSuppression: config.noiseSuppression,
        autoGainControl: true,
      },
    });
  }, [config]);

  const createDataHandler = useCallback((onData: (chunk: Blob) => void) => {
    return (event: BlobEvent) => {
      if (event.data.size > 0) {
        onData(event.data);
      }
    };
  }, []);

  const createErrorHandler = useCallback(() => {
    return (event: Event) => {
      console.error('MediaRecorder error:', event);
      setState((prev) => ({
        ...prev,
        error: 'Recording error occurred',
        isRecording: false,
      }));
    };
  }, []);

  const setupMediaRecorder = useCallback((
    stream: MediaStream,
    onData: (chunk: Blob) => void,
  ): MediaRecorder => {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000,
    });

    mediaStreamRef.current = stream;
    onDataAvailable.current = onData;
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = createDataHandler(onData);
    mediaRecorder.onerror = createErrorHandler();

    return mediaRecorder;
  }, [createDataHandler, createErrorHandler]);

  // Set up audio level monitoring
  const setupAudioLevelMonitoring = useCallback(
    (stream: MediaStream) => {
      if (!audioContextRef.current) {
        const AudioContextConstructor =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;
        if (AudioContextConstructor) {
          audioContextRef.current = new AudioContextConstructor();
        }
      }

      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      analyserRef.current = analyser;

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

        setState((prev) => ({ ...prev, audioLevel: normalizedLevel }));

        if (state.isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    },
    [state.isRecording],
  );

  const setupAudioMonitoring = useCallback((stream: MediaStream) => {
    setupAudioLevelMonitoring(stream);
  }, [setupAudioLevelMonitoring]);

  const startMediaRecorder = useCallback((mediaRecorder: MediaRecorder) => {
    // Start recording with 100ms timeslice for low latency
    mediaRecorder.start(100);
  }, []);

  const updateRecordingState = useCallback((isRecording: boolean) => {
    setState((prev) => ({
      ...prev,
      isRecording,
      isConnected: isRecording,
    }));
  }, []);

  const handleRecordingError = useCallback((error: unknown) => {
    console.error('Error starting recording:', error);
    setState((prev) => ({
      ...prev,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to start recording',
      isRecording: false,
      isConnected: false,
    }));
  }, []);

  const startRecording = useCallback(
    async (onData?: (chunk: Blob) => void) => {
      try {
        clearErrors();
        const stream = await requestMicrophoneAccess();
        const mediaRecorder = setupMediaRecorder(stream, onData || (() => {}));
        
        setupAudioMonitoring(stream);
        startMediaRecorder(mediaRecorder);
        updateRecordingState(true);
      } catch (error) {
        handleRecordingError(error);
      }
    },
    [config],
  );

  const stopRecording = useCallback(() => {
    // Stop MediaRecorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRecording: false,
      isConnected: false,
      audioLevel: 0,
    }));

    onDataAvailable.current = null;
  }, []);

  // Clean up on unmount
  const cleanup = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cleanup,
  };
}
