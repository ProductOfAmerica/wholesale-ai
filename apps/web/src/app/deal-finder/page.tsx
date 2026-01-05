'use client';

import type {
  CSVUploadResult,
  DistressType,
  Lead,
  LeadListResponse,
  Territory,
} from '@wholesale-ai/shared';
import { useCallback, useEffect, useState } from 'react';
import { FilterSidebar, LeadList } from '@/components/deal-finder';
import { AppLayout } from '@/components/layout';

export default function DealFinderPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [distressTypes, setDistressTypes] = useState<DistressType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leads');
      const data = (await response.json()) as LeadListResponse;
      setLeads(data.leads);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSearch = () => {
    fetchLeads();
  };

  const handleClear = () => {
    setTerritories([]);
    setDistressTypes([]);
    fetchLeads();
  };

  const handleCSVUpload = (result: CSVUploadResult) => {
    if (result.success) {
      fetchLeads();
    }
  };

  return (
    <AppLayout title="Deal Finder">
      <div className="flex h-full gap-6">
        <aside className="w-80 flex-shrink-0">
          <FilterSidebar
            territories={territories}
            onTerritoriesChange={setTerritories}
            distressTypes={distressTypes}
            onDistressTypesChange={setDistressTypes}
            onSearch={handleSearch}
            onClear={handleClear}
            onCSVUpload={handleCSVUpload}
          />
        </aside>

        <div className="flex-1">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              {loading ? 'Loading...' : `${total} Leads Found`}
            </h2>
          </div>
          <LeadList leads={leads} loading={loading} />
        </div>
      </div>
    </AppLayout>
  );
}
