'use client';

import { useEffect, useState } from 'react';

interface MotivationGaugeProps {
  level: number; // 1-10
  animated?: boolean;
}

export function MotivationGauge({ level, animated = true }: MotivationGaugeProps) {
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
    <div style={{ width: '100%', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0.5rem' 
      }}>
        <span style={{ 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          color: '#374151' 
        }}>
          Motivation Level
        </span>
        <span style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          color: color 
        }}>
          {clampedLevel}/10
        </span>
      </div>

      {/* Progress Bar Container */}
      <div style={{ 
        width: '100%', 
        height: '20px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '10px', 
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #e5e7eb'
      }}>
        {/* Progress Bar Fill */}
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '10px',
            transition: animated ? 'width 0.8s ease-in-out, background-color 0.3s ease' : 'none',
            position: 'relative'
          }}
        >
          {/* Shine Effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              borderRadius: '10px'
            }}
          />
        </div>
      </div>

      {/* Scale Labels */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '0.25rem' 
      }}>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Low</span>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Medium</span>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>High</span>
      </div>

      {/* Status Text */}
      <div style={{ 
        marginTop: '0.5rem', 
        textAlign: 'center' 
      }}>
        <span style={{ 
          fontSize: '0.75rem', 
          color: color, 
          fontWeight: '500',
          backgroundColor: bgColor,
          padding: '0.25rem 0.5rem',
          borderRadius: '4px'
        }}>
          {clampedLevel >= 8 ? '🔥 Highly Motivated' :
           clampedLevel >= 6 ? '✅ Motivated' :
           clampedLevel >= 4 ? '⚠️ Somewhat Interested' :
           '❄️ Low Interest'}
        </span>
      </div>
    </div>
  );
}