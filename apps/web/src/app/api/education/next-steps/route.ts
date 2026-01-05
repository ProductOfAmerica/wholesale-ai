import type {
  NextStepSuggestion,
  NextStepsResponse,
} from '@wholesale-ai/shared';
import { NextStepPriority, NextStepType } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

const mockSuggestions: NextStepSuggestion[] = [
  {
    type: NextStepType.VIDEO,
    title: 'Continue: MAO Formula Explained',
    description: "You're 60% through this lesson. Pick up where you left off.",
    priority: NextStepPriority.HIGH,
    link: '/education/lesson-002',
    lessonId: 'lesson-002',
  },
  {
    type: NextStepType.ACTION,
    title: 'Follow up with hot lead',
    description: '1234 Oak Street - last contact 3 days ago, high heat score',
    priority: NextStepPriority.HIGH,
    link: '/deal-analyzer?leadId=lead-001',
    dealId: 'lead-001',
  },
  {
    type: NextStepType.VIDEO,
    title: 'Recommended: TCPM Discovery Framework',
    description: 'Master seller qualification to improve your conversion rate.',
    priority: NextStepPriority.MEDIUM,
    link: '/education/lesson-006',
    lessonId: 'lesson-006',
  },
  {
    type: NextStepType.REVIEW,
    title: 'Review your last call',
    description:
      'Complete after-action report for your call with Mary Johnson.',
    priority: NextStepPriority.MEDIUM,
    link: '/copilot',
  },
  {
    type: NextStepType.VIDEO,
    title: 'Learn Subject-To Financing',
    description: 'Expand your toolkit with creative financing strategies.',
    priority: NextStepPriority.LOW,
    link: '/education/lesson-003',
    lessonId: 'lesson-003',
  },
];

export async function GET() {
  const response: NextStepsResponse = {
    suggestions: mockSuggestions,
  };

  return NextResponse.json(response);
}
