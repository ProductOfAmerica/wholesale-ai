'use client';

import type { BuyerMatch } from '@wholesale-ai/shared';
import { BadgeCheck, RefreshCw, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { BuyerList, DealPackageBuilder } from '@/components/disposition';
import { AppLayout } from '@/components/layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface MatchResponse {
  matches: BuyerMatch[];
}

function DispositionContent() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');

  const [matches, setMatches] = useState<BuyerMatch[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const body = dealId
        ? { dealId }
        : {
            property: {
              city: 'Dallas',
              state: 'TX',
              county: 'Dallas',
              zip: '75201',
              propertyType: 'single_family',
              beds: 3,
              sqft: 1850,
            },
            askingPrice: 125000,
          };

      const response = await fetch('/api/buyers/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as MatchResponse;
      setMatches(data.matches);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleSelectionChange = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === matches.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(matches.map((m) => m.buyer.id)));
    }
  };

  const handleSend = async (notes: string) => {
    setSending(true);
    setSuccess(null);
    try {
      const response = await fetch('/api/deals/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: dealId || 'deal-demo',
          buyerIds: Array.from(selectedIds),
          notes: notes || undefined,
        }),
      });
      const data = await response.json();
      if (data.sentCount) {
        setSuccess(
          `Deal package sent to ${data.sentCount} buyer${data.sentCount !== 1 ? 's' : ''}!`
        );
        setSelectedIds(new Set());
      }
    } finally {
      setSending(false);
    }
  };

  const verifiedCount = matches.filter((m) => m.buyer.verified).length;

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {matches.length} matches
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BadgeCheck className="h-4 w-4 text-blue-500" />
              {verifiedCount} verified
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMatches}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <BuyerList
            matches={matches}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
          />
        )}
      </div>

      <aside className="w-80 flex-shrink-0">
        <DealPackageBuilder
          selectedCount={selectedIds.size}
          onSend={handleSend}
          loading={sending}
        />
      </aside>
    </div>
  );
}

export default function DispositionPage() {
  return (
    <AppLayout title="Disposition Portal">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <DispositionContent />
      </Suspense>
    </AppLayout>
  );
}
