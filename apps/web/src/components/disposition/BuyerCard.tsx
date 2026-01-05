'use client';

import type {
  BuyerMatch,
  BuyerStrategy as BuyerStrategyType,
} from '@wholesale-ai/shared';
import { BuyerStrategy } from '@wholesale-ai/shared';
import { BadgeCheck, Building2, MapPin, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface BuyerCardProps {
  match: BuyerMatch;
  selected: boolean;
  onSelect: () => void;
}

const strategyLabels: Record<BuyerStrategyType, string> = {
  [BuyerStrategy.FIX_AND_FLIP]: 'Flip',
  [BuyerStrategy.BUY_AND_HOLD]: 'Hold',
  [BuyerStrategy.WHOLETAIL]: 'Wholetail',
  [BuyerStrategy.SUBJECT_TO]: 'Sub-To',
  [BuyerStrategy.CREATIVE_FINANCE]: 'Creative',
  [BuyerStrategy.LAND]: 'Land',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700';
  return 'bg-orange-100 text-orange-700';
}

export function BuyerCard({ match, selected, onSelect }: BuyerCardProps) {
  const { buyer, matchScore, matchReasons, distance } = match;
  const displayStrategies = buyer.buyBox.strategies.slice(0, 3);
  const displayReasons = matchReasons.slice(0, 2);

  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected
          ? 'border-2 border-blue-500 bg-blue-50/50'
          : 'hover:border-slate-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-slate-300"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium">{buyer.name}</h3>
                {buyer.verified && (
                  <BadgeCheck className="h-4 w-4 text-blue-500" />
                )}
                {buyer.vip && (
                  <Badge className="bg-purple-100 text-purple-700 text-xs">
                    VIP
                  </Badge>
                )}
              </div>
              {buyer.company && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {buyer.company}
                </p>
              )}
            </div>
          </div>
          <Badge className={getScoreColor(matchScore)}>{matchScore}%</Badge>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {displayStrategies.map((strategy) => (
            <Badge key={strategy} variant="outline" className="text-xs">
              {strategyLabels[strategy]}
            </Badge>
          ))}
        </div>

        <div className="mb-3 space-y-1">
          {displayReasons.map((reason) => (
            <p key={reason} className="text-xs text-muted-foreground">
              • {reason}
            </p>
          ))}
        </div>

        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {buyer.stats.dealsClosed} closed
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {distance} mi
          </span>
          {match.recentActivity && (
            <span className="text-green-600">• Active</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
