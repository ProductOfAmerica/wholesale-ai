import { cacheLife } from 'next/cache';
import { Suspense } from 'react';
import { AudioShell } from '@/components/AudioShell';

// Static instructions component for PPR
async function StaticInstructions() {
  'use cache';
  cacheLife('max');

  return (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
      <h3 className="text-lg font-semibold mb-2 text-green-800">
        How to Use Real-Time Audio
      </h3>
      <ul className="space-y-1 text-green-700 text-sm">
        <li>1. Ensure Socket.io connection is established</li>
        <li>2. Click the red record button to start the call</li>
        <li>3. Speak naturally - the AI will analyze seller speech patterns</li>
        <li>4. Watch real-time transcription and AI suggestions</li>
        <li>5. Click stop to end the call and disconnect</li>
      </ul>

      <div className="mt-4 p-3 bg-green-100 rounded">
        <p className="text-green-800 text-sm">
          <strong>Production Ready:</strong> This implementation uses Deepgram
          Flux via WebSocket proxy for conversational AI with turn detection,
          echo cancellation, and secure real-time streaming.
        </p>
      </div>
    </div>
  );
}

// Static shell component for PPR
async function RealAudioPageShell() {
  'use cache';
  cacheLife('hours');

  return (
    <main className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        🎙️ Real-Time Audio Copilot
      </h1>

      {/* Dynamic content wrapped in Suspense for PPR */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-20 bg-yellow-100 rounded-lg animate-pulse" />
            <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-40 bg-blue-100 rounded-lg animate-pulse" />
          </div>
        }
      >
        <AudioShell />
      </Suspense>

      {/* Static instructions - cached for max performance */}
      <StaticInstructions />
    </main>
  );
}

export default function RealAudioCallPage() {
  return <RealAudioPageShell />;
}
