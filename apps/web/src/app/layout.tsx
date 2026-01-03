import './globals.css';

import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Wholesale AI - Negotiation Copilot',
  description:
    'Real-time AI-powered negotiation assistance for wholesale buyers',
};

// Cached navigation component
async function Navigation() {
  'use cache';
  cacheLife('max');

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold text-foreground">
          Wholesale AI Copilot
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/call">Text Simulation</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/call/real-audio">🎙️ Real Audio</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/test">Test Page</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
