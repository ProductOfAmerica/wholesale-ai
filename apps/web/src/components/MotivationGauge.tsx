'use client';

import { useEffect, useState } from 'react';

interface MotivationGaugeProps {
  level: number; // 1-10
  animated?: boolean;
}

export function MotivationGauge({
  level,
  animated = true,
}: MotivationGaugeProps) {
  const [displayLevel, setDisplayLevel] = useState(animated ? 0 : level);

  // Animate to the target level
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayLevel(level);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayLevel(level);
    }
  }, [level, animated]);

  // Ensure level is between 1-10
  const clampedLevel = Math.max(1, Math.min(10, displayLevel));
  const percentage = (clampedLevel / 10) * 100;

  // Determine color based on level
  const getColor = (level: number): string => {
    if (level >= 7) return '#059669'; // Green
    if (level >= 4) return '#d97706'; // Orange
    return '#dc2626'; // Red
  };

  const getBackgroundColor = (level: number): string => {
    if (level >= 7) return '#d1fae5'; // Light green
    if (level >= 4) return '#fed7aa'; // Light orange
    return '#fee2e2'; // Light red
  };

  const color = getColor(clampedLevel);
  const bgColor = getBackgroundColor(clampedLevel);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">
          Motivation Level
        </span>
        <span className="text-xl font-bold" style={{ color }}>
          {clampedLevel}/10
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden relative border border-gray-200">
        {/* Progress Bar Fill */}
        <div
          className={`h-full rounded-full relative ${animated ? 'transition-all duration-700 ease-in-out' : ''}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        >
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
        </div>
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">Low</span>
        <span className="text-xs text-gray-500">Medium</span>
        <span className="text-xs text-gray-500">High</span>
      </div>

      {/* Status Text */}
      <div className="mt-2 text-center">
        <span
          className="text-xs font-medium px-2 py-1 rounded"
          style={{ color, backgroundColor: bgColor }}
        >
          {clampedLevel >= 8
            ? '🔥 Highly Motivated'
            : clampedLevel >= 6
              ? '✅ Motivated'
              : clampedLevel >= 4
                ? '⚠️ Somewhat Interested'
                : '❄️ Low Interest'}
        </span>
      </div>
    </div>
  );
}
