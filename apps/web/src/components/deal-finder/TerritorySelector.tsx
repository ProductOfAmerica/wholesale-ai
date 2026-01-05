'use client';

import type { Territory } from '@wholesale-ai/shared';
import { TerritoryType } from '@wholesale-ai/shared';
import { X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TerritorySelectorProps {
  territories: Territory[];
  onChange: (territories: Territory[]) => void;
  maxTerritories?: number;
}

export function TerritorySelector({
  territories,
  onChange,
  maxTerritories = 3,
}: TerritorySelectorProps) {
  const [inputValue, setInputValue] = useState('');

  const isAtMax = territories.length >= maxTerritories;

  const handleAdd = () => {
    const value = inputValue.trim();
    if (!value || isAtMax) return;

    const isZip = /^\d{5}$/.test(value);
    const type = isZip ? TerritoryType.ZIP : TerritoryType.COUNTY;
    const name = isZip ? `${value}` : value;

    const newTerritory: Territory = {
      id: `terr-${Date.now()}`,
      type,
      value: value.toLowerCase(),
      name,
    };

    onChange([...territories, newTerritory]);
    setInputValue('');
  };

  const handleRemove = (id: string) => {
    onChange(territories.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ZIP code or county name"
          disabled={isAtMax}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={isAtMax || !inputValue.trim()}
          size="sm"
        >
          Add
        </Button>
      </div>

      {isAtMax && (
        <p className="text-sm text-amber-600">
          Maximum {maxTerritories} territories reached
        </p>
      )}

      {territories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {territories.map((territory) => (
            <Badge
              key={territory.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span>{territory.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(territory.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
