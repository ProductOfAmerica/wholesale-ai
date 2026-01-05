'use client';

import type {
  LessonsResponse,
  NextStepSuggestion,
  NextStepsResponse,
  ProgressResponse,
  UserProgress,
  VideoLesson,
} from '@wholesale-ai/shared';
import { LessonCategory } from '@wholesale-ai/shared';
import { useCallback, useEffect, useState } from 'react';
import { LessonCategoryGroup, NextStepsPanel } from '@/components/education';
import { AppLayout } from '@/components/layout';

const categoryOrder = [
  LessonCategory.FUNDAMENTALS,
  LessonCategory.NEGOTIATION,
  LessonCategory.CREATIVE_FINANCE,
  LessonCategory.DISPOSITION,
  LessonCategory.CONTRACTS,
  LessonCategory.COMPLIANCE,
];

export default function EducationPage() {
  const [lessons, setLessons] = useState<VideoLesson[]>([]);
  const [progress, setProgress] = useState<Map<string, UserProgress>>(
    new Map()
  );
  const [suggestions, setSuggestions] = useState<NextStepSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lessonsRes, progressRes, stepsRes] = await Promise.all([
        fetch('/api/education/lessons'),
        fetch('/api/education/progress'),
        fetch('/api/education/next-steps'),
      ]);

      const lessonsData = (await lessonsRes.json()) as LessonsResponse;
      const progressData = (await progressRes.json()) as ProgressResponse;
      const stepsData = (await stepsRes.json()) as NextStepsResponse;

      setLessons(lessonsData.lessons);
      setSuggestions(stepsData.suggestions);

      const progressMap = new Map<string, UserProgress>();
      for (const p of progressData.progress) {
        progressMap.set(p.lessonId, p);
      }
      setProgress(progressMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lessonsByCategory = categoryOrder.reduce(
    (acc, category) => {
      acc[category] = lessons.filter((l) => l.category === category);
      return acc;
    },
    {} as Record<string, VideoLesson[]>
  );

  return (
    <AppLayout title="Education Hub">
      <div className="flex h-full gap-6">
        <div className="flex-1">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Loading lessons...</p>
            </div>
          ) : (
            categoryOrder.map((category) => (
              <LessonCategoryGroup
                key={category}
                category={category}
                lessons={lessonsByCategory[category]}
                progressMap={progress}
              />
            ))
          )}
        </div>

        <aside className="w-80 flex-shrink-0">
          <NextStepsPanel suggestions={suggestions} />
        </aside>
      </div>
    </AppLayout>
  );
}
