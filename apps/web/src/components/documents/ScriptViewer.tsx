'use client';

import type { CallScript } from '@wholesale-ai/shared';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScriptSectionComponent } from './ScriptSection';

interface ScriptViewerProps {
  script: CallScript;
  onBack: () => void;
}

const defaultVariables = [
  { name: 'sellerName', label: 'Seller Name' },
  { name: 'propertyAddress', label: 'Property Address' },
  { name: 'myName', label: 'Your Name' },
];

export function ScriptViewer({ script, onBack }: ScriptViewerProps) {
  const [variables, setVariables] = useState<Record<string, string>>({
    sellerName: '',
    propertyAddress: '',
    myName: '',
  });

  const handleVariableChange = (name: string, value: string) => {
    setVariables((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{script.name}</h2>
          <p className="text-sm text-muted-foreground">{script.scenario}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to scripts
        </button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {defaultVariables.map((variable) => (
              <div key={variable.name} className="space-y-1.5">
                <Label htmlFor={variable.name}>{variable.label}</Label>
                <Input
                  id={variable.name}
                  value={variables[variable.name] || ''}
                  onChange={(e) =>
                    handleVariableChange(variable.name, e.target.value)
                  }
                  placeholder={`Enter ${variable.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {script.sections.map((section) => (
          <ScriptSectionComponent
            key={section.name}
            section={section}
            variables={variables}
          />
        ))}
      </div>
    </div>
  );
}
