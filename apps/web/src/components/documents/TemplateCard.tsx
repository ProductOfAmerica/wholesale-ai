import type { DocumentType, EmailCategory } from '@wholesale-ai/shared';
import { FileText, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface TemplateCardProps {
  id: string;
  name: string;
  description?: string;
  type: 'contract' | 'email' | 'script';
  category?: DocumentType | EmailCategory | string;
  onSelect: (id: string) => void;
}

const typeIcons = {
  contract: FileText,
  email: Mail,
  script: Phone,
};

const typeColors = {
  contract: 'text-blue-600',
  email: 'text-green-600',
  script: 'text-purple-600',
};

export function TemplateCard({
  id,
  name,
  description,
  type,
  onSelect,
}: TemplateCardProps) {
  const Icon = typeIcons[type];
  const colorClass = typeColors[type];

  return (
    <Card className="transition-all hover:border-slate-300 hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg bg-slate-100 p-2 ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{name}</CardTitle>
            {description && (
              <CardDescription className="mt-1 text-sm">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onSelect(id)}
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
}
