import type { PipelineStage } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

export async function GET() {
  const stages: PipelineStage[] = [
    { id: 'new', name: 'New Leads', count: 23, value: 0 },
    { id: 'contacted', name: 'Contacted', count: 15, value: 0 },
    { id: 'qualified', name: 'Qualified', count: 8, value: 185000 },
    { id: 'under_contract', name: 'Under Contract', count: 4, value: 92000 },
    { id: 'closing', name: 'Closing', count: 2, value: 47000 },
  ];

  return NextResponse.json(stages);
}
