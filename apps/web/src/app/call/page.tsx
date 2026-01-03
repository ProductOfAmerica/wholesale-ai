import { cacheLife } from 'next/cache';
import { Suspense } from 'react';
import { CallShell } from '@/components/CallShell';

// Static shell component for PPR
async function CallPageShell() {
  'use cache';
  cacheLife('hours');

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI Negotiation Copilot</h1>

      {/* Dynamic content wrapped in Suspense for PPR */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        }
      >
        <CallShell />
      </Suspense>
    </main>
  );
}

export default function CallPage() {
  return <CallPageShell />;
}
