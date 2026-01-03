import './globals.css';

import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import type React from 'react';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Wholesale AI - Negotiation Copilot',
  description:
    'Real-time AI-powered negotiation assistance for wholesale buyers',
};

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
          <Button variant="default" asChild>
            <Link href="/call">Make a Call</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

function NavigationSkeleton() {
  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-28" />
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
        <Suspense fallback={<NavigationSkeleton />}>
          <Navigation />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
