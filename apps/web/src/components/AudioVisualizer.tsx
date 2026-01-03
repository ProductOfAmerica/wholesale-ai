'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

interface AudioVisualizerProps {
  audioLevel: number;
  isRecording: boolean;
  width?: number;
  height?: number;
  className?: string;
}

function useAudioColors(audioLevel: number) {
  return useMemo(
    () => ({
      strokeColor:
        audioLevel > 0.7 ? '#ef4444' : audioLevel > 0.4 ? '#f59e0b' : '#10b981',
      fillColor:
        audioLevel > 0.7 ? '#ef4444' : audioLevel > 0.4 ? '#f59e0b' : '#10b981',
    }),
    [audioLevel]
  );
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  dataPoints: number[],
  width: number,
  height: number,
  time: number
) {
  const centerY = height / 2;
  ctx.beginPath();

  for (let i = 0; i < dataPoints.length; i++) {
    const x = width / 2 + (i - dataPoints.length / 2) * 2;
    const amplitude = dataPoints[i] * (height / 3);
    const y = centerY + Math.sin(time + i * 0.1) * amplitude;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}

function drawLevelIndicator(
  ctx: CanvasRenderingContext2D,
  audioLevel: number,
  width: number,
  height: number,
  fillColor: string
) {
  ctx.fillStyle = fillColor;
  const centerY = height / 2;
  const indicatorHeight = audioLevel * height * 0.8;
  ctx.fillRect(width - 20, centerY - indicatorHeight / 2, 15, indicatorHeight);
}

function drawStaticLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
}

export function AudioVisualizer({
  audioLevel,
  isRecording,
  width = 300,
  height = 60,
  className = '',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const waveDataRef = useRef<number[]>([]);
  const timeRef = useRef(0);

  const colors = useAudioColors(audioLevel);

  const updateWaveData = useCallback(() => {
    waveDataRef.current.push(audioLevel);
    if (waveDataRef.current.length > width / 2) {
      waveDataRef.current.shift();
    }
  }, [audioLevel, width]);

  const clearWaveData = useCallback(() => {
    waveDataRef.current = [];
    timeRef.current = 0;
  }, []);

  const drawRecordingVisualization = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      updateWaveData();

      ctx.strokeStyle = colors.strokeColor;
      ctx.lineWidth = 2;

      drawWaveform(ctx, waveDataRef.current, width, height, timeRef.current);
      drawLevelIndicator(ctx, audioLevel, width, height, colors.fillColor);

      timeRef.current += 0.1;
    },
    [audioLevel, colors, width, height, updateWaveData]
  );

  const drawInactiveVisualization = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawStaticLine(ctx, width, height);
      clearWaveData();
    },
    [width, height, clearWaveData]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const draw = () => {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, width, height);

      if (isRecording) {
        drawRecordingVisualization(ctx);
        animationFrameRef.current = requestAnimationFrame(draw);
      } else {
        drawInactiveVisualization(ctx);
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isRecording,
    width,
    height,
    drawRecordingVisualization,
    drawInactiveVisualization,
  ]);

  return (
    <div className={`audio-visualizer ${className}`}>
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Audio Input</h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isRecording
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isRecording ? 'Live' : 'Inactive'}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          className="border rounded"
          style={{ width: `${width}px`, height: `${height}px` }}
        />

        <div className="mt-2 text-xs text-gray-500 text-center">
          {isRecording
            ? `Level: ${Math.round(audioLevel * 100)}%`
            : 'Start recording to see waveform'}
        </div>
      </div>
    </div>
  );
}

// Simple bar visualizer alternative
export function AudioLevelBars({
  audioLevel,
  isRecording,
  barCount = 20,
  className = '',
}: {
  audioLevel: number;
  isRecording: boolean;
  barCount?: number;
  className?: string;
}) {
  const activeBars = Math.round(audioLevel * barCount);

  const barElements = useMemo(
    () =>
      Array.from({ length: barCount }, (_, i) => ({
        index: i,
        id: `bar-${i}`,
      })),
    [barCount]
  );

  return (
    <div className={`audio-level-bars flex items-end gap-1 h-12 ${className}`}>
      {barElements.map(({ index: i, id }) => (
        <div
          key={id}
          className={`
            w-2 rounded-t transition-all duration-150
            ${
              i < activeBars && isRecording
                ? i >= barCount * 0.8
                  ? 'bg-red-500'
                  : i >= barCount * 0.6
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                : 'bg-gray-200'
            }
          `}
          style={{
            height:
              isRecording && i < activeBars
                ? `${((i + 1) / barCount) * 100}%`
                : '20%',
          }}
        />
      ))}
    </div>
  );
}
