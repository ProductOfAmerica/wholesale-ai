export const LessonCategory = {
  FUNDAMENTALS: 'fundamentals',
  NEGOTIATION: 'negotiation',
  CREATIVE_FINANCE: 'creative_finance',
  DISPOSITION: 'disposition',
  CONTRACTS: 'contracts',
  COMPLIANCE: 'compliance',
} as const;

export type LessonCategory =
  (typeof LessonCategory)[keyof typeof LessonCategory];

export const LearningPathDifficulty = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export type LearningPathDifficulty =
  (typeof LearningPathDifficulty)[keyof typeof LearningPathDifficulty];

export const NextStepType = {
  VIDEO: 'video',
  ACTION: 'action',
  REVIEW: 'review',
} as const;

export type NextStepType = (typeof NextStepType)[keyof typeof NextStepType];

export const NextStepPriority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type NextStepPriority =
  (typeof NextStepPriority)[keyof typeof NextStepPriority];

export interface VideoTimestamp {
  time: number;
  label: string;
  topic: string;
}

export interface VideoLesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  category: LessonCategory;
  tags: string[];
  timestamps: VideoTimestamp[];
  relatedStrategies: string[];
}

export interface UserProgress {
  lessonId: string;
  watchedSeconds: number;
  completed: boolean;
  completedAt: string | null;
  notes: string | null;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  lessons: string[];
  estimatedTime: number;
  difficulty: LearningPathDifficulty;
}

export interface NextStepSuggestion {
  type: NextStepType;
  title: string;
  description: string;
  priority: NextStepPriority;
  link?: string;
  lessonId?: string;
  dealId?: string;
}

export interface ProgressUpdateRequest {
  lessonId: string;
  watchedSeconds: number;
  completed: boolean;
}

export interface LessonsResponse {
  lessons: VideoLesson[];
}

export interface ProgressResponse {
  progress: UserProgress[];
}

export interface NextStepsResponse {
  suggestions: NextStepSuggestion[];
}
