'use client';

import type {
  CallScript,
  DocumentTemplate,
  EmailTemplate,
  GeneratedDocument,
  TemplatesResponse,
} from '@wholesale-ai/shared';
import { useCallback, useEffect, useState } from 'react';
import {
  DocumentForm,
  DocumentPreview,
  EmailComposer,
  ScriptViewer,
  TemplateGrid,
} from '@/components/documents';
import { AppLayout } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ViewState =
  | { type: 'list' }
  | { type: 'contract-form'; template: DocumentTemplate }
  | { type: 'contract-preview'; document: GeneratedDocument }
  | { type: 'email'; template: EmailTemplate }
  | { type: 'script'; script: CallScript };

export default function DocsPage() {
  const [templates, setTemplates] = useState<TemplatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({ type: 'list' });
  const [activeTab, setActiveTab] = useState('contracts');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents/templates');
      const data = (await res.json()) as TemplatesResponse;
      setTemplates(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleContractSelect = (id: string) => {
    const template = templates?.contracts.find((c) => c.id === id);
    if (template) {
      setViewState({ type: 'contract-form', template });
    }
  };

  const handleEmailSelect = (id: string) => {
    const template = templates?.emails.find((e) => e.id === id);
    if (template) {
      setViewState({ type: 'email', template });
    }
  };

  const handleScriptSelect = (id: string) => {
    const script = templates?.scripts.find((s) => s.id === id);
    if (script) {
      setViewState({ type: 'script', script });
    }
  };

  const handleGenerate = (document: GeneratedDocument) => {
    setViewState({ type: 'contract-preview', document });
  };

  const handleBack = () => {
    setViewState({ type: 'list' });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setViewState({ type: 'list' });
  };

  if (loading) {
    return (
      <AppLayout title="Document Generator">
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Document Generator">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts">
          {viewState.type === 'list' && (
            <TemplateGrid
              type="contract"
              templates={templates?.contracts || []}
              onSelect={handleContractSelect}
            />
          )}
          {viewState.type === 'contract-form' && (
            <DocumentForm
              template={viewState.template}
              onGenerate={handleGenerate}
              onCancel={handleBack}
            />
          )}
          {viewState.type === 'contract-preview' && (
            <DocumentPreview
              document={viewState.document}
              onBack={handleBack}
            />
          )}
        </TabsContent>

        <TabsContent value="emails">
          {viewState.type === 'list' && (
            <TemplateGrid
              type="email"
              templates={templates?.emails || []}
              onSelect={handleEmailSelect}
            />
          )}
          {viewState.type === 'email' && (
            <EmailComposer template={viewState.template} onBack={handleBack} />
          )}
        </TabsContent>

        <TabsContent value="scripts">
          {viewState.type === 'list' && (
            <TemplateGrid
              type="script"
              templates={templates?.scripts || []}
              onSelect={handleScriptSelect}
            />
          )}
          {viewState.type === 'script' && (
            <ScriptViewer script={viewState.script} onBack={handleBack} />
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
