'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StateInfo {
  code: string;
  name: string;
  hasRestrictions: boolean;
}

interface StateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  states: StateInfo[];
  placeholder?: string;
}

export function StateSelector({
  value,
  onChange,
  states,
  placeholder = 'Select state',
}: StateSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {states.map((state) => (
          <SelectItem key={state.code} value={state.code}>
            <div className="flex items-center gap-2">
              <span>
                {state.name} ({state.code})
              </span>
              {state.hasRestrictions && (
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
