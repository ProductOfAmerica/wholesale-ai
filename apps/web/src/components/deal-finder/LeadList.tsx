import type { Lead } from '@wholesale-ai/shared';
import { Search } from 'lucide-react';
import { LeadCard } from './LeadCard';
import { LeadCardSkeleton } from './LeadCardSkeleton';

interface LeadListProps {
  leads: Lead[];
  loading?: boolean;
}

export function LeadList({ leads, loading = false }: LeadListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <LeadCardSkeleton key="skeleton-1" />
        <LeadCardSkeleton key="skeleton-2" />
        <LeadCardSkeleton key="skeleton-3" />
        <LeadCardSkeleton key="skeleton-4" />
        <LeadCardSkeleton key="skeleton-5" />
        <LeadCardSkeleton key="skeleton-6" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">No leads found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or add new territories
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
}
