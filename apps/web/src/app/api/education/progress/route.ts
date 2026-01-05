import type {
  ProgressResponse,
  ProgressUpdateRequest,
  UserProgress,
} from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

const progressStore: Map<string, UserProgress> = new Map([
  [
    'lesson-001',
    {
      lessonId: 'lesson-001',
      watchedSeconds: 1200,
      completed: true,
      completedAt: new Date(Date.now() - 604800000).toISOString(),
      notes: null,
    },
  ],
  [
    'lesson-002',
    {
      lessonId: 'lesson-002',
      watchedSeconds: 540,
      completed: false,
      completedAt: null,
      notes: null,
    },
  ],
  [
    'lesson-005',
    {
      lessonId: 'lesson-005',
      watchedSeconds: 1350,
      completed: true,
      completedAt: new Date(Date.now() - 172800000).toISOString(),
      notes: 'Great tips for handling price objections',
    },
  ],
]);

export async function GET() {
  const progress = Array.from(progressStore.values());

  const response: ProgressResponse = {
    progress,
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const body = (await request.json()) as ProgressUpdateRequest;
  const { lessonId, watchedSeconds, completed } = body;

  const existing = progressStore.get(lessonId);
  const updated: UserProgress = {
    lessonId,
    watchedSeconds,
    completed,
    completedAt: completed
      ? existing?.completedAt || new Date().toISOString()
      : null,
    notes: existing?.notes || null,
  };

  progressStore.set(lessonId, updated);

  return NextResponse.json(updated);
}
