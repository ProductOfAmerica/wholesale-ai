import type { Territory } from '@wholesale-ai/shared';
import { TerritoryType } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

export async function GET() {
  const territories: Territory[] = [
    {
      id: 'terr-001',
      type: TerritoryType.ZIP,
      value: '75201',
      name: '75201 - Dallas',
    },
    {
      id: 'terr-002',
      type: TerritoryType.COUNTY,
      value: 'tarrant',
      name: 'Tarrant County',
    },
  ];

  return NextResponse.json(territories);
}
