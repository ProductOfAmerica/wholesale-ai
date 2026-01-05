import type {
  DistressType as DistressTypeValue,
  Lead,
} from '@wholesale-ai/shared';
import { DistressType, HeatCategory } from '@wholesale-ai/shared';
import { Bath, Bed, Calendar, Square } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface LeadCardProps {
  lead: Lead;
}

const categoryConfig = {
  [HeatCategory.CRITICAL]: {
    borderColor: 'border-red-400',
    badgeBg: 'bg-red-100 text-red-700',
  },
  [HeatCategory.HIGH_PRIORITY]: {
    borderColor: 'border-orange-400',
    badgeBg: 'bg-orange-100 text-orange-700',
  },
  [HeatCategory.STREET_WORK]: {
    borderColor: 'border-blue-400',
    badgeBg: 'bg-blue-100 text-blue-700',
  },
};

const classificationColors: Record<string, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-yellow-100 text-yellow-700',
  C: 'bg-orange-100 text-orange-700',
  D: 'bg-red-100 text-red-700',
};

const distressLabels: Record<DistressTypeValue, string> = {
  [DistressType.FORECLOSURE]: 'Foreclosure',
  [DistressType.NOD]: 'NOD',
  [DistressType.UTILITY_SHUTOFF]: 'Utility Off',
  [DistressType.DEMOLITION]: 'Demolition',
  [DistressType.CODE_VIOLATION]: 'Code Viol.',
  [DistressType.TAX_DELINQUENCY]: 'Tax Delinq.',
  [DistressType.PROBATE]: 'Probate',
  [DistressType.EVICTION]: 'Eviction',
  [DistressType.BANKRUPTCY]: 'Bankruptcy',
  [DistressType.DIVORCE]: 'Divorce',
  [DistressType.VACANCY]: 'Vacant',
  [DistressType.EXPIRED_LISTING]: 'Expired',
  [DistressType.ABSENTEE_OWNER]: 'Absentee',
};

export function LeadCard({ lead }: LeadCardProps) {
  const config = categoryConfig[lead.heatCategory];
  const { property, distressIndicators } = lead;
  const displayIndicators = distressIndicators.slice(0, 3);
  const remainingCount = distressIndicators.length - 3;

  return (
    <Link href={`/deal-analyzer?leadId=${lead.id}`}>
      <Card
        className={`cursor-pointer border-l-4 transition-shadow hover:shadow-md ${config.borderColor}`}
      >
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="font-medium">{property.address}</h3>
              <p className="text-sm text-muted-foreground">
                {property.city}, {property.state} {property.zip}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={config.badgeBg}>{lead.heatScore}</Badge>
              <Badge className={classificationColors[lead.classification]}>
                {lead.classification}
              </Badge>
            </div>
          </div>

          <div className="mb-3 flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {property.beds}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {property.baths}
            </span>
            <span className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              {property.sqft.toLocaleString()} sqft
            </span>
            {property.yearBuilt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {property.yearBuilt}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {displayIndicators.map((indicator) => (
              <Badge key={indicator.type} variant="outline" className="text-xs">
                {distressLabels[indicator.type]}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingCount} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
