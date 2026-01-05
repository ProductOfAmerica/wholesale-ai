import type { UserProgress, VideoLesson } from '@wholesale-ai/shared';
import { LessonCategory } from '@wholesale-ai/shared';
import { LessonCard } from './LessonCard';

interface LessonCategoryGroupProps {
  category: string;
  lessons: VideoLesson[];
  progressMap: Map<string, UserProgress>;
}

const categoryLabels: Record<string, string> = {
  [LessonCategory.FUNDAMENTALS]: 'Fundamentals',
  [LessonCategory.NEGOTIATION]: 'Negotiation',
  [LessonCategory.CREATIVE_FINANCE]: 'Creative Finance',
  [LessonCategory.DISPOSITION]: 'Disposition',
  [LessonCategory.CONTRACTS]: 'Contracts',
  [LessonCategory.COMPLIANCE]: 'Compliance',
};

export function LessonCategoryGroup({
  category,
  lessons,
  progressMap,
}: LessonCategoryGroupProps) {
  if (lessons.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">
        {categoryLabels[category] || category}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            progress={progressMap.get(lesson.id)}
          />
        ))}
      </div>
    </div>
  );
}
