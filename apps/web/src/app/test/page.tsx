import type { AISuggestion, TranscriptEntry } from '@wholesale-ai/shared';
import { AISuggestions } from '@/components/AISuggestions';
import { LiveTranscript } from '@/components/LiveTranscript';
import { MotivationGauge } from '@/components/MotivationGauge';

// Static test data cached at build time
async function getTestData() {
  'use cache';

  return {
    transcript: [
      {
        speaker: 'seller' as const,
        text: "Thanks for coming in today. I understand you're looking at bulk purchasing for your retail chain?",
        timestamp: Date.now() - 5000,
      },
      {
        speaker: 'user' as const,
        text: "Yes, we're expanding our electronics section and need competitive pricing on smartphones.",
        timestamp: Date.now() - 4000,
      },
      {
        speaker: 'seller' as const,
        text: 'Great! Our latest iPhone models start at $800 per unit for orders over 100 units. What kind of volume are you thinking?',
        timestamp: Date.now() - 3000,
      },
    ] as TranscriptEntry[],
    suggestion: {
      motivation_level: 7,
      pain_points: ['High unit price', 'Volume requirements'],
      objection_detected: true,
      objection_type: 'price',
      suggested_response:
        'Ask about pricing tiers for larger volumes and payment term flexibility',
      recommended_next_move:
        'Negotiate volume discounts and explore bulk pricing options',
    } as AISuggestion,
  };
}

export default async function TestPage() {
  const { transcript, suggestion } = await getTestData();

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Test Interface - Static Demo
      </h1>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800">
          This page shows the interface components with sample data for testing
          and demonstration purposes.
        </p>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Transcript */}
        <div className="lg:col-span-2">
          <LiveTranscript transcript={transcript} />
        </div>

        {/* Right Column: AI Analysis */}
        <div className="space-y-6">
          {/* Motivation Gauge */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <MotivationGauge
              level={suggestion.motivation_level}
              animated={true}
            />
          </div>

          {/* AI Suggestions */}
          <AISuggestions suggestion={suggestion} loading={false} />
        </div>
      </div>
    </main>
  );
}
