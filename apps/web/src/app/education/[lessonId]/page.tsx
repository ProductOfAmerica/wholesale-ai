'use client';

import type {
  LessonsResponse,
  ProgressResponse,
  ProgressUpdateRequest,
  UserProgress,
  VideoLesson,
} from '@wholesale-ai/shared';
import { LessonCategory } from '@wholesale-ai/shared';
import { ArrowLeft, CheckCircle, Clock, Play } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { VideoTimestamps } from '@/components/education';
import { AppLayout } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const categoryLabels: Record<string, string> = {
  [LessonCategory.FUNDAMENTALS]: 'Fundamentals',
  [LessonCategory.NEGOTIATION]: 'Negotiation',
  [LessonCategory.CREATIVE_FINANCE]: 'Creative Finance',
  [LessonCategory.DISPOSITION]: 'Disposition',
  [LessonCategory.CONTRACTS]: 'Contracts',
  [LessonCategory.COMPLIANCE]: 'Compliance',
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function LessonDetailPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<VideoLesson | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lessonsRes, progressRes] = await Promise.all([
        fetch('/api/education/lessons'),
        fetch('/api/education/progress'),
      ]);

      const lessonsData = (await lessonsRes.json()) as LessonsResponse;
      const progressData = (await progressRes.json()) as ProgressResponse;

      const foundLesson = lessonsData.lessons.find((l) => l.id === lessonId);
      setLesson(foundLesson || null);

      const foundProgress = progressData.progress.find(
        (p) => p.lessonId === lessonId
      );
      setProgress(foundProgress || null);

      if (foundProgress) {
        setCurrentTime(foundProgress.watchedSeconds);
      }
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleMarkComplete = async () => {
    if (!lesson) return;

    const update: ProgressUpdateRequest = {
      lessonId: lesson.id,
      watchedSeconds: lesson.duration,
      completed: true,
    };

    const response = await fetch('/api/education/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });

    if (response.ok) {
      const updatedProgress = (await response.json()) as UserProgress;
      setProgress(updatedProgress);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </AppLayout>
    );
  }

  if (!lesson) {
    return (
      <AppLayout title="Not Found">
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Lesson not found</p>
          <Link href="/education">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Education Hub
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isCompleted = progress?.completed ?? false;

  return (
    <AppLayout title={lesson.title}>
      <div className="mb-4">
        <Link
          href="/education"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Education Hub
        </Link>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-slate-900">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                    <Play className="h-8 w-8" />
                  </div>
                  <p className="text-sm opacity-75">Video Player Placeholder</p>
                  <p className="mt-1 text-xs opacity-50">
                    Current time: {formatDuration(currentTime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="mb-2 text-2xl font-bold">{lesson.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline">
                    {categoryLabels[lesson.category]}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(lesson.duration)}
                  </span>
                </div>
              </div>

              {isCompleted ? (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              ) : (
                <Button onClick={handleMarkComplete}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              )}
            </div>

            <p className="mb-4 text-muted-foreground">{lesson.description}</p>

            {lesson.relatedStrategies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {lesson.relatedStrategies.map((strategy) => (
                  <Badge key={strategy} variant="secondary">
                    {strategy}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="w-80 flex-shrink-0">
          <VideoTimestamps
            timestamps={lesson.timestamps}
            currentTime={currentTime}
            onSeek={handleSeek}
          />
        </aside>
      </div>
    </AppLayout>
  );
}
