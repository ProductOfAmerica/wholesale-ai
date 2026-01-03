import { cacheLife } from 'next/cache';
import Link from 'next/link';

export default async function HomePage() {
  'use cache';
  cacheLife('hours');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">
          Wholesale AI - Negotiation Copilot
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Real-time AI-powered negotiation assistance for wholesale buyers
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/call"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Start Call
          </Link>
          <Link
            href="/test"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Test Features
          </Link>
        </div>
      </div>
    </div>
  );
}
