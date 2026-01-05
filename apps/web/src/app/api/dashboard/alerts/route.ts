import type { HeatAlert } from '@wholesale-ai/shared';
import { HeatCategory } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

export async function GET() {
  const alerts: HeatAlert[] = [
    {
      id: '1',
      leadId: 'lead-001',
      leadName: '1234 Oak Street',
      category: HeatCategory.CRITICAL,
      message: 'Foreclosure auction in 5 days',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      leadId: 'lead-002',
      leadName: '567 Maple Ave',
      category: HeatCategory.CRITICAL,
      message: 'Owner returned call, ready to negotiate',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      leadId: 'lead-003',
      leadName: '890 Pine Road',
      category: HeatCategory.HIGH_PRIORITY,
      message: 'Tax lien + code violations stacking',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '4',
      leadId: 'lead-004',
      leadName: '321 Elm Court',
      category: HeatCategory.HIGH_PRIORITY,
      message: 'Probate filed last week',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '5',
      leadId: 'lead-005',
      leadName: '654 Birch Lane',
      category: HeatCategory.STREET_WORK,
      message: 'Vacant 6+ months, absentee owner',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  return NextResponse.json(alerts);
}
