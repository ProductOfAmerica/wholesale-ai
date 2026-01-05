import type { DailyTask } from '@wholesale-ai/shared';
import { DailyTaskType } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

export async function GET() {
  const today = new Date();
  today.setHours(17, 0, 0, 0);

  const tasks: DailyTask[] = [
    {
      id: '1',
      type: DailyTaskType.CALL,
      title: 'Call back John Smith',
      description: 'Expressed interest yesterday, wants offer',
      leadId: 'lead-001',
      dealId: null,
      dueAt: today.toISOString(),
      completed: false,
    },
    {
      id: '2',
      type: DailyTaskType.FOLLOW_UP,
      title: 'Send contract to 567 Maple Ave',
      description: 'Agreed on terms, waiting for signature',
      leadId: 'lead-002',
      dealId: 'deal-001',
      dueAt: today.toISOString(),
      completed: false,
    },
    {
      id: '3',
      type: DailyTaskType.REVIEW,
      title: 'Review comps for Pine Road deal',
      description: null,
      leadId: 'lead-003',
      dealId: null,
      dueAt: today.toISOString(),
      completed: true,
    },
    {
      id: '4',
      type: DailyTaskType.CALL,
      title: 'Cold call batch - Foreclosure list',
      description: '15 leads from county records',
      leadId: null,
      dealId: null,
      dueAt: today.toISOString(),
      completed: false,
    },
    {
      id: '5',
      type: DailyTaskType.OTHER,
      title: 'Update CRM with call notes',
      description: null,
      leadId: null,
      dealId: null,
      dueAt: today.toISOString(),
      completed: false,
    },
  ];

  return NextResponse.json(tasks);
}
