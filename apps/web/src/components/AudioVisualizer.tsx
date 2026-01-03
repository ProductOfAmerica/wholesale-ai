'use client';

import { useMemo } from 'react';

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
