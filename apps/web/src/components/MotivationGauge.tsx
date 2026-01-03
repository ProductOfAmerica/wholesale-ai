'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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

  // Ensure level is between 0-10
  const clampedLevel = Math.max(0, Math.min(10, displayLevel));
  const percentage = (clampedLevel / 10) * 100;

  const getStatusInfo = (level: number) => {
    if (level >= 8)
      return {
        variant: 'default' as const,
        status: '🔥 Highly Motivated',
        color: 'text-green-600',
      };
    if (level >= 6)
      return {
        variant: 'default' as const,
        status: '✅ Motivated',
        color: 'text-green-600',
      };
    if (level >= 4)
      return {
        variant: 'secondary' as const,
        status: '⚠️ Somewhat Interested',
        color: 'text-yellow-600',
      };
    return {
      variant: 'destructive' as const,
      status: '❄️ Low Interest',
      color: 'text-red-600',
    };
  };

  const statusInfo = getStatusInfo(clampedLevel);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Motivation Level</span>
        <span className={cn('text-xl font-bold', statusInfo.color)}>
          {clampedLevel}/10
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={percentage}
          className={cn(
            'h-3',
            animated && 'transition-all duration-700 ease-in-out'
          )}
        />

        {/* Scale Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center">
        <Badge variant={statusInfo.variant} className="text-xs">
          {statusInfo.status}
        </Badge>
      </div>
    </div>
  );
}
