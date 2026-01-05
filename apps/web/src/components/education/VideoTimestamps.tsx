'use client';

import type { VideoTimestamp } from '@wholesale-ai/shared';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VideoTimestampsProps {
  timestamps: VideoTimestamp[];
  currentTime?: number;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function findCurrentChapter(
  timestamps: VideoTimestamp[],
  currentTime: number
): number {
  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (currentTime >= timestamps[i].time) {
      return i;
    }
  }
  return 0;
}

export function VideoTimestamps({
  timestamps,
  currentTime = 0,
  onSeek,
}: VideoTimestampsProps) {
  const currentChapterIndex = findCurrentChapter(timestamps, currentTime);

  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="font-medium">Chapters</h3>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-2">
          {timestamps.map((timestamp, index) => {
            const isActive = index === currentChapterIndex;

            return (
              <button
                key={timestamp.time}
                type="button"
                onClick={() => onSeek(timestamp.time)}
                className={`flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-slate-100 ${
                  isActive ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <span
                  className={`mt-0.5 min-w-[40px] text-sm font-mono ${
                    isActive ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  {formatTime(timestamp.time)}
                </span>
                <span className="text-sm">{timestamp.label}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
