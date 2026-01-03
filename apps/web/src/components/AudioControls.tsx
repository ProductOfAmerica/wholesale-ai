'use client';

import { useCallback, useState } from 'react';

// Styling utility functions
function getRecordingButtonStyles(isRecording: boolean, hasError: boolean): string {
  const baseStyles = `
    relative flex items-center justify-center w-12 h-12 rounded-full
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    text-white
  `;
  
  const recordingStyles = isRecording
    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 animate-pulse'
    : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500';
    
  const errorStyles = hasError ? 'opacity-50 cursor-not-allowed' : '';
  
  return `${baseStyles} ${recordingStyles} ${errorStyles}`;
}

function getMuteButtonStyles(isMuted: boolean, isRecording: boolean): string {
  const baseStyles = `
    flex items-center justify-center w-10 h-10 rounded-full
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    text-gray-700
  `;
  
  const muteStyles = isMuted
    ? 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500'
    : 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-500';
    
  const disabledStyles = !isRecording ? 'opacity-50 cursor-not-allowed' : '';
  
  return `${baseStyles} ${muteStyles} ${disabledStyles}`;
}

function getAudioLevelColor(audioLevel: number): string {
  if (audioLevel > 0.8) return 'bg-red-500';
  if (audioLevel > 0.5) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getConnectionStatusStyles(isConnected: boolean): {
  dotStyles: string;
  textStyles: string;
} {
  return {
    dotStyles: `
      w-2 h-2 rounded-full
      ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
    `,
    textStyles: `text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`,
  };
}

interface AudioControlsProps {
  isRecording: boolean;
  isConnected: boolean;
  audioLevel: number;
  error: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  className?: string;
}

export function AudioControls({
  isRecording,
  isConnected,
  audioLevel,
  error,
  onStartRecording,
  onStopRecording,
  className = '',
}: AudioControlsProps) {
  const [isMuted, setIsMuted] = useState(false);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  }, [isRecording, onStartRecording, onStopRecording]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return (
    <div className={`audio-controls ${className}`}>
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        {/* Recording Button */}
        <button
          type="button"
          onClick={handleToggleRecording}
          disabled={!!error}
          className={getRecordingButtonStyles(isRecording, !!error)}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? (
            // Stop icon
            <div className="w-4 h-4 bg-white rounded-sm" />
          ) : (
            // Microphone icon
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <title>Microphone</title>
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Mute Button */}
        <button
          type="button"
          onClick={handleToggleMute}
          disabled={!isRecording}
          className={getMuteButtonStyles(isMuted, isRecording)}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            // Muted microphone icon
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <title>Muted Microphone</title>
              <path
                fillRule="evenodd"
                d="M18.293 2.293a1 1 0 010 1.414L16.586 5.414A7 7 0 0119 12a1 1 0 11-2 0 5.001 5.001 0 00-1.536-3.536l-1.414 1.414A3 3 0 0115 12v1a3 3 0 01-4.95 2.263L8.636 16.677A7.001 7.001 0 0115 19a1 1 0 110 2H5a1 1 0 110-2 7.001 7.001 0 006.93-6H9a1 1 0 110-2h3v-2.07A3.001 3.001 0 018 7V4a3 3 0 014.464-2.617L3.707 3.293a1 1 0 111.414-1.414l13 13a1 1 0 01-1.414 1.414L12.464 12.05A2.993 2.993 0 0013 11V7a1 1 0 10-2 0v4a1 1 0 01-1 1H8a1 1 0 010-2h1V7a1 1 0 012 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            // Normal microphone icon (smaller)
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <title>Microphone</title>
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Audio Level Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Level:</span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 rounded-full ${getAudioLevelColor(audioLevel)}`}
              style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-8">
            {Math.round(audioLevel * 100)}%
          </span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={getConnectionStatusStyles(isConnected).dotStyles} />
          <span className={getConnectionStatusStyles(isConnected).textStyles}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <title>Error</title>
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-700 font-medium">
              Recording...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
