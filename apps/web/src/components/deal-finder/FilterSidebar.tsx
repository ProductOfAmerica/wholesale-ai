'use client';

import type {
  CSVUploadResult,
  DistressType,
  Territory,
} from '@wholesale-ai/shared';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CSVUpload } from './CSVUpload';
import { DistressFilters } from './DistressFilters';
import { TerritorySelector } from './TerritorySelector';

interface FilterSidebarProps {
  territories: Territory[];
  onTerritoriesChange: (territories: Territory[]) => void;
  distressTypes: DistressType[];
  onDistressTypesChange: (types: DistressType[]) => void;
  onSearch: () => void;
  onClear: () => void;
  onCSVUpload: (result: CSVUploadResult) => void;
}

export function FilterSidebar({
  territories,
  onTerritoriesChange,
  distressTypes,
  onDistressTypesChange,
  onSearch,
  onClear,
  onCSVUpload,
}: FilterSidebarProps) {
  const hasFilters = territories.length > 0 || distressTypes.length > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-220px)] px-6">
          <div className="space-y-6 pb-6">
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Territories
              </Label>
              <TerritorySelector
                territories={territories}
                onChange={onTerritoriesChange}
                maxTerritories={3}
              />
            </div>

            <Separator />

            <DistressFilters
              selected={distressTypes}
              onChange={onDistressTypesChange}
            />

            <Separator />

            <div className="space-y-2">
              <Button onClick={onSearch} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Search Leads
              </Button>
              {hasFilters && (
                <Button variant="outline" onClick={onClear} className="w-full">
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            <Separator />

            <div>
              <Label className="mb-2 block text-sm font-medium">
                Import Leads
              </Label>
              <CSVUpload onUpload={onCSVUpload} />
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
