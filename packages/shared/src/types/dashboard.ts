import type { HeatCategory } from './lead.js';

export interface DashboardStats {
  leadsThisWeek: number;
  leadsChange: number;
  callsToday: number;
  callsChange: number;
  dealsInPipeline: number;
  dealsChange: number;
  revenueThisMonth: number;
  revenueChange: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  value: number;
}

export interface HeatAlert {
  id: string;
  leadId: string;
  leadName: string;
  category: HeatCategory;
  message: string;
  createdAt: string;
}

export const DailyTaskType = {
  CALL: 'call',
  FOLLOW_UP: 'follow_up',
  REVIEW: 'review',
  OTHER: 'other',
} as const;

export type DailyTaskType = (typeof DailyTaskType)[keyof typeof DailyTaskType];

export interface DailyTask {
  id: string;
  type: DailyTaskType;
  title: string;
  description: string | null;
  leadId: string | null;
  dealId: string | null;
  dueAt: string;
  completed: boolean;
}
