'use client';

import type {
  ComplianceCheck,
  DocumentTemplate,
  GeneratedDocument,
} from '@wholesale-ai/shared';
import { DealStrategy, DocumentFormat } from '@wholesale-ai/shared';
import { useCallback, useEffect, useState } from 'react';
import { DisclosureList } from '@/components/compliance/DisclosureList';
import { StateSelector } from '@/components/compliance/StateSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DynamicField } from './DynamicField';

interface StateInfo {
  code: string;
  name: string;
  hasRestrictions: boolean;
}

interface DocumentFormProps {
  template: DocumentTemplate;
  onGenerate: (document: GeneratedDocument) => void;
  onCancel: () => void;
  initialValues?: Record<string, string>;
}

export function DocumentForm({
  template,
  onGenerate,
  onCancel,
  initialValues = {},
}: DocumentFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const field of template.fields) {
      defaults[field.name] =
        initialValues[field.name] || field.defaultValue || '';
    }
    return defaults;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState('TX');
  const [states, setStates] = useState<StateInfo[]>([]);
  const [complianceCheck, setComplianceCheck] =
    useState<ComplianceCheck | null>(null);

  const fetchStates = useCallback(async () => {
    try {
      const res = await fetch('/api/compliance/states');
      const data = await res.json();
      setStates(data.states);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  const checkCompliance = useCallback(async (state: string) => {
    try {
      const res = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          strategy: DealStrategy.ASSIGNMENT,
        }),
      });
      const data = await res.json();
      setComplianceCheck(data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (selectedState) {
      checkCompliance(selectedState);
    }
  }, [selectedState, checkCompliance]);

  const handleFieldChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          fields: values,
          format: DocumentFormat.HTML,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const document = (await response.json()) as GeneratedDocument;
      onGenerate(document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {states.length > 0 && (
              <div className="space-y-2">
                <Label>Property State</Label>
                <StateSelector
                  value={selectedState}
                  onChange={setSelectedState}
                  states={states}
                  placeholder="Select state"
                />
              </div>
            )}

            {template.fields.map((field) => (
              <DynamicField
                key={field.name}
                field={field}
                value={values[field.name] || ''}
                onChange={handleFieldChange}
              />
            ))}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Document'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {complianceCheck && complianceCheck.requiredDisclosures.length > 0 && (
        <DisclosureList disclosures={complianceCheck.requiredDisclosures} />
      )}
    </div>
  );
}
