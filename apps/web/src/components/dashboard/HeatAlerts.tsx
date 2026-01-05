import type { HeatAlert } from '@wholesale-ai/shared';
import { HeatCategory } from '@wholesale-ai/shared';
import { AlertTriangle, Flame, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HeatAlertsProps {
  alerts: HeatAlert[];
}

const categoryConfig = {
  [HeatCategory.CRITICAL]: {
    icon: Flame,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    textColor: 'text-red-700',
  },
  [HeatCategory.HIGH_PRIORITY]: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-500',
    textColor: 'text-orange-700',
  },
  [HeatCategory.STREET_WORK]: {
    icon: MapPin,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-700',
  },
};

export function HeatAlerts({ alerts }: HeatAlertsProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-500" />
          Hot Leads
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-6 pb-6">
          <div className="space-y-3">
            {alerts.map((alert) => {
              const config = categoryConfig[alert.category];
              const Icon = config.icon;
              return (
                <Link
                  key={alert.id}
                  href={`/deal-analyzer?leadId=${alert.leadId}`}
                  className={`block rounded-lg border p-3 transition-colors hover:opacity-80 ${config.bgColor} ${config.borderColor}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-4 w-4 ${config.iconColor}`} />
                    <div className="flex-1 space-y-1">
                      <div className={`font-medium ${config.textColor}`}>
                        {alert.leadName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alert.message}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
