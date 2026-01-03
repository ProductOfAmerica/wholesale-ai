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
  }
) {
  const [state, setState] = useState<AudioStreamState>({
    isRecording: false,
    isConnected: false,
    error: null,
    audioLevel: 0,
  });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const onDataCallbackRef = useRef<((chunk: ArrayBuffer) => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const clearErrors = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const floatTo16BitPCM = useCallback(
    (float32Array: Float32Array): ArrayBuffer => {
      const buffer = new ArrayBuffer(float32Array.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
      return buffer;
    },
    []
  );

  const startRecording = useCallback(
    async (onData?: (chunk: ArrayBuffer) => void) => {
      try {
        console.log('🎤 Starting audio recording (PCM linear16)...');
        clearErrors();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: config.sampleRate,
            channelCount: config.channelCount,
            echoCancellation: config.echoCancellation,
            noiseSuppression: config.noiseSuppression,
            autoGainControl: true,
          },
        });

        console.log('🎤 Microphone access granted');
        mediaStreamRef.current = stream;
        onDataCallbackRef.current = onData || null;

        const AudioContextConstructor =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;

        if (!AudioContextConstructor) {
          throw new Error('AudioContext not supported');
        }

        const audioContext = new AudioContextConstructor({
          sampleRate: config.sampleRate,
        });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        // Create analyser for audio level monitoring
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        // Use ScriptProcessorNode to capture raw PCM
        // Buffer size 4096 at 16kHz = ~256ms chunks
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = floatTo16BitPCM(inputData);

          if (onDataCallbackRef.current) {
            onDataCallbackRef.current(pcmData);
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        console.log(
          '🎤 PCM capture started, sample rate:',
          audioContext.sampleRate
        );

        // Start audio level monitoring
        const updateAudioLevel = () => {
          if (!analyserRef.current) return;

          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          );
          analyserRef.current.getByteFrequencyData(dataArray);

          const average =
            dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const normalizedLevel = Math.min(average / 128, 1);

          setState((prev) => ({ ...prev, audioLevel: normalizedLevel }));

          if (audioContextRef.current?.state === 'running') {
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          }
        };
        updateAudioLevel();

        setState((prev) => ({
          ...prev,
          isRecording: true,
          isConnected: true,
          error: null,
        }));

        console.log('🎤 Recording state updated to true');
      } catch (error) {
        console.error('🎤 Failed to start recording:', error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to start recording',
          isRecording: false,
          isConnected: false,
        }));
      }
    },
    [config, clearErrors, floatTo16BitPCM]
  );

  const stopRecording = useCallback(() => {
    console.log('🎤 Stopping recording...');

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }

    analyserRef.current = null;
    onDataCallbackRef.current = null;

    setState((prev) => ({
      ...prev,
      isRecording: false,
      isConnected: false,
      audioLevel: 0,
    }));

    console.log('🎤 Recording stopped');
  }, []);

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
