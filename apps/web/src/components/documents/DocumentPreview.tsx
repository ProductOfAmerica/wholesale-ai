'use client';

import type { GeneratedDocument } from '@wholesale-ai/shared';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DocumentPreviewProps {
  document: GeneratedDocument;
  onBack: () => void;
}

export function DocumentPreview({ document, onBack }: DocumentPreviewProps) {
  const handleDownload = () => {
    const blob = new Blob([document.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `document-${document.id}.html`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Generated Document</h2>
            <p className="text-sm text-muted-foreground">
              Created {new Date(document.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Document Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose max-w-none rounded-md border bg-white p-6"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from our own templates
            dangerouslySetInnerHTML={{ __html: document.content }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
