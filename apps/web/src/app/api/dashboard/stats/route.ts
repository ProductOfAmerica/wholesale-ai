import type { DashboardStats } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

export async function GET() {
  const stats: DashboardStats = {
    leadsThisWeek: 47,
    leadsChange: 12.5,
    callsToday: 18,
    callsChange: -5.2,
    dealsInPipeline: 12,
    dealsChange: 8.3,
    revenueThisMonth: 42500,
    revenueChange: 23.1,
  };

  return NextResponse.json(stats);
}
