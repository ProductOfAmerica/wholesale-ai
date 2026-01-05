import type {
  CallScript,
  DocumentTemplate,
  EmailTemplate,
} from '@wholesale-ai/shared';
import { TemplateCard } from './TemplateCard';

interface ContractGridProps {
  type: 'contract';
  templates: DocumentTemplate[];
  onSelect: (id: string) => void;
}

interface EmailGridProps {
  type: 'email';
  templates: EmailTemplate[];
  onSelect: (id: string) => void;
}

interface ScriptGridProps {
  type: 'script';
  templates: CallScript[];
  onSelect: (id: string) => void;
}

type TemplateGridProps = ContractGridProps | EmailGridProps | ScriptGridProps;

export function TemplateGrid({ type, templates, onSelect }: TemplateGridProps) {
  if (templates.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No templates available
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => {
        const description =
          type === 'contract'
            ? (template as DocumentTemplate).description
            : type === 'email'
              ? undefined
              : (template as CallScript).scenario;

        return (
          <TemplateCard
            key={template.id}
            id={template.id}
            name={template.name}
            description={description}
            type={type}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
