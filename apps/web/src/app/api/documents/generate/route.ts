import type {
  GenerateDocumentRequest,
  GeneratedDocument,
} from '@wholesale-ai/shared';
import { DocumentFormat } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

function replaceVariables(
  content: string,
  fields: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(fields)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || `[${key}]`);
  }
  return result;
}

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateDocumentRequest;
  const { templateId, fields, format } = body;

  if (!templateId || !fields) {
    return NextResponse.json(
      { error: 'templateId and fields are required' },
      { status: 400 }
    );
  }

  const templatesRes = await fetch(
    new URL('/api/documents/templates', request.url)
  );
  const templates = await templatesRes.json();

  let content = '';
  let found = false;

  for (const contract of templates.contracts) {
    if (contract.id === templateId) {
      content = replaceVariables(contract.content, fields);
      found = true;
      break;
    }
  }

  if (!found) {
    for (const email of templates.emails) {
      if (email.id === templateId) {
        const subject = replaceVariables(email.subject, fields);
        const emailBody = replaceVariables(email.body, fields);
        content = `<h2>${subject}</h2><pre style="white-space: pre-wrap;">${emailBody}</pre>`;
        found = true;
        break;
      }
    }
  }

  if (!found) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const document: GeneratedDocument = {
    id: `doc-${Date.now()}`,
    templateId,
    content,
    format: format || DocumentFormat.HTML,
    createdAt: new Date().toISOString(),
    fields,
  };

  return NextResponse.json(document);
}
