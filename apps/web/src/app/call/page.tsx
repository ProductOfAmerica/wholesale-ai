import { cacheLife } from 'next/cache';
import { Suspense } from 'react';
import { CallInterface } from '@/components/CallInterface';

async function CallPageShell() {
  'use cache';
  cacheLife('hours');

  return (
    <main className="p-4 max-w-7xl mx-auto">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-100 rounded-lg animate-pulse" />
              <div className="space-y-6">
                <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        }
      >
        <CallInterface />
      </Suspense>
    </main>
  );
}

export default function CallPage() {
  return <CallPageShell />;
}
