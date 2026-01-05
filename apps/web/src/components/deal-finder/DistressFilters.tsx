'use client';

import type { DistressType as DistressTypeValue } from '@wholesale-ai/shared';
import { DistressType, DistressWeight } from '@wholesale-ai/shared';
import { Label } from '@/components/ui/label';

interface DistressFiltersProps {
  selected: DistressTypeValue[];
  onChange: (selected: DistressTypeValue[]) => void;
}

const distressLabels: Record<DistressTypeValue, string> = {
  [DistressType.FORECLOSURE]: 'Foreclosure',
  [DistressType.NOD]: 'Notice of Default',
  [DistressType.UTILITY_SHUTOFF]: 'Utility Shutoff',
  [DistressType.DEMOLITION]: 'Demolition',
  [DistressType.CODE_VIOLATION]: 'Code Violation',
  [DistressType.TAX_DELINQUENCY]: 'Tax Delinquency',
  [DistressType.PROBATE]: 'Probate',
  [DistressType.EVICTION]: 'Eviction',
  [DistressType.BANKRUPTCY]: 'Bankruptcy',
  [DistressType.DIVORCE]: 'Divorce',
  [DistressType.VACANCY]: 'Vacancy',
  [DistressType.EXPIRED_LISTING]: 'Expired Listing',
  [DistressType.ABSENTEE_OWNER]: 'Absentee Owner',
};

const sortedDistressTypes = Object.values(DistressType).sort(
  (a, b) => DistressWeight[b] - DistressWeight[a]
);

export function DistressFilters({ selected, onChange }: DistressFiltersProps) {
  const handleToggle = (type: DistressTypeValue) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Distress Signals</Label>
      <div className="grid grid-cols-1 gap-2">
        {sortedDistressTypes.map((type) => (
          <label
            key={type}
            className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={selected.includes(type)}
              onChange={() => handleToggle(type)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="flex-1 text-sm">{distressLabels[type]}</span>
            <span className="text-xs text-muted-foreground">
              +{DistressWeight[type]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
