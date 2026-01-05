import type { UserProgress, VideoLesson } from '@wholesale-ai/shared';
import { LessonCategory } from '@wholesale-ai/shared';
import { CheckCircle, Clock, Play } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LessonCardProps {
  lesson: VideoLesson;
  progress?: UserProgress;
}

const categoryLabels: Record<string, string> = {
  [LessonCategory.FUNDAMENTALS]: 'Fundamentals',
  [LessonCategory.NEGOTIATION]: 'Negotiation',
  [LessonCategory.CREATIVE_FINANCE]: 'Creative Finance',
  [LessonCategory.DISPOSITION]: 'Disposition',
  [LessonCategory.CONTRACTS]: 'Contracts',
  [LessonCategory.COMPLIANCE]: 'Compliance',
};

const categoryColors: Record<string, string> = {
  [LessonCategory.FUNDAMENTALS]: 'bg-blue-100 text-blue-700',
  [LessonCategory.NEGOTIATION]: 'bg-purple-100 text-purple-700',
  [LessonCategory.CREATIVE_FINANCE]: 'bg-green-100 text-green-700',
  [LessonCategory.DISPOSITION]: 'bg-orange-100 text-orange-700',
  [LessonCategory.CONTRACTS]: 'bg-slate-100 text-slate-700',
  [LessonCategory.COMPLIANCE]: 'bg-red-100 text-red-700',
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

export function LessonCard({ lesson, progress }: LessonCardProps) {
  const watchedPercent = progress
    ? Math.min(
        100,
        Math.round((progress.watchedSeconds / lesson.duration) * 100)
      )
    : 0;
  const isCompleted = progress?.completed ?? false;
  const isStarted = watchedPercent > 0 && !isCompleted;

  return (
    <Link href={`/education/${lesson.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-slate-200">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md">
                <Play className="h-6 w-6 text-slate-700" />
              </div>
            </div>
            {isCompleted && (
              <div className="absolute right-2 top-2">
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-medium">{lesson.title}</h3>
            </div>

            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {lesson.description}
            </p>

            <div className="flex items-center justify-between">
              <Badge className={categoryColors[lesson.category]}>
                {categoryLabels[lesson.category]}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDuration(lesson.duration)}
              </span>
            </div>

            {isStarted && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{watchedPercent}%</span>
                </div>
                <Progress value={watchedPercent} className="h-1" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
