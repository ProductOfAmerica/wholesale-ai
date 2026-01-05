'use client';

import { Suspense } from 'react';
import { CallInterface } from '@/components/CallInterface';
import { AppLayout } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';

function CopilotSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16" />
      <Skeleton className="h-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-96" />
        <div className="space-y-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-80" />
        </div>
      </div>
    </div>
  );
}

export default function CopilotPage() {
  return (
    <AppLayout title="Live Copilot">
      <Suspense fallback={<CopilotSkeleton />}>
        <CallInterface />
      </Suspense>
    </AppLayout>
  );
}
