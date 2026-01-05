'use client';

import type { EmailTemplate } from '@wholesale-ai/shared';
import { Copy, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmailComposerProps {
  template: EmailTemplate;
  onBack: () => void;
}

function replaceVariables(
  text: string,
  variables: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || `[${key}]`);
  }
  return result;
}

export function EmailComposer({ template, onBack }: EmailComposerProps) {
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of template.variables) {
      initial[v] = '';
    }
    return initial;
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleVariableChange = (name: string, value: string) => {
    setVariables((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopy = async (field: 'subject' | 'body' | 'all') => {
    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);

    let textToCopy = '';
    if (field === 'subject') {
      textToCopy = subject;
    } else if (field === 'body') {
      textToCopy = body;
    } else {
      textToCopy = `Subject: ${subject}\n\n${body}`;
    }

    await navigator.clipboard.writeText(textToCopy);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const processedSubject = replaceVariables(template.subject, variables);
  const processedBody = replaceVariables(template.body, variables);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2 text-green-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{template.name}</h2>
            <p className="text-sm capitalize text-muted-foreground">
              {template.category.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to emails
        </button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fill Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {template.variables.map((variable) => (
              <div key={variable} className="space-y-1.5">
                <Label htmlFor={variable}>
                  {variable.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Input
                  id={variable}
                  value={variables[variable] || ''}
                  onChange={(e) =>
                    handleVariableChange(variable, e.target.value)
                  }
                  placeholder={`Enter ${variable}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Preview</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleCopy('all')}>
            <Copy className="mr-2 h-4 w-4" />
            {copiedField === 'all' ? 'Copied!' : 'Copy All'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label className="text-muted-foreground">Subject</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => handleCopy('subject')}
              >
                {copiedField === 'subject' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="rounded-md bg-slate-50 p-3 font-medium">
              {processedSubject}
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label className="text-muted-foreground">Body</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => handleCopy('body')}
              >
                {copiedField === 'body' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm">
              {processedBody}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
