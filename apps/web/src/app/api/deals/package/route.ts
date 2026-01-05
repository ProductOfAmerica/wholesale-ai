import type { DealPackage, MatchNotification } from '@wholesale-ai/shared';
import { NotificationStatus } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

interface PackageRequest {
  dealId: string;
  buyerIds: string[];
  notes?: string;
}

interface PackageResponse {
  package: DealPackage;
  notifications: MatchNotification[];
  sentCount: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as PackageRequest;

  if (!body.dealId || !body.buyerIds?.length) {
    return NextResponse.json(
      { error: 'dealId and buyerIds are required' },
      { status: 400 }
    );
  }

  const packageId = `pkg-${Date.now()}`;
  const now = new Date().toISOString();

  const dealPackage: DealPackage = {
    id: packageId,
    dealId: body.dealId,
    analysisId: `analysis-${body.dealId}`,
    photos: [],
    notes: body.notes || null,
    createdAt: now,
  };

  const notifications: MatchNotification[] = body.buyerIds.map((buyerId) => ({
    id: `notif-${Date.now()}-${buyerId}`,
    dealPackageId: packageId,
    buyerId,
    status: NotificationStatus.PENDING,
    sentAt: now,
    viewedAt: null,
    respondedAt: null,
    feedback: null,
  }));

  const response: PackageResponse = {
    package: dealPackage,
    notifications,
    sentCount: notifications.length,
  };

  return NextResponse.json(response);
}
