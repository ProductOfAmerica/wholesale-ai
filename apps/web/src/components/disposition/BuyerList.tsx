'use client';

import type { BuyerMatch } from '@wholesale-ai/shared';
import { Users } from 'lucide-react';
import { BuyerCard } from './BuyerCard';

interface BuyerListProps {
  matches: BuyerMatch[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string) => void;
  onSelectAll: () => void;
}

export function BuyerList({
  matches,
  selectedIds,
  onSelectionChange,
  onSelectAll,
}: BuyerListProps) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <Users className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-medium">No Matching Buyers</h3>
        <p className="text-sm text-muted-foreground">
          No buyers match the criteria for this deal.
        </p>
      </div>
    );
  }

  const allSelected = matches.every((m) => selectedIds.has(m.buyer.id));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {matches.length} buyer{matches.length !== 1 ? 's' : ''} matched
        </p>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-sm text-blue-600 hover:underline"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((match) => (
          <BuyerCard
            key={match.buyer.id}
            match={match}
            selected={selectedIds.has(match.buyer.id)}
            onSelect={() => onSelectionChange(match.buyer.id)}
          />
        ))}
      </div>
    </div>
  );
}
