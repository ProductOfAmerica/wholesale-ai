export const DocumentType = {
  PURCHASE_AGREEMENT: 'purchase_agreement',
  ASSIGNMENT_CONTRACT: 'assignment_contract',
  PROOF_OF_FUNDS: 'proof_of_funds',
  LETTER_OF_INTENT: 'letter_of_intent',
  SELLER_DISCLOSURE: 'seller_disclosure',
  EMAIL_TEMPLATE: 'email_template',
  CALL_SCRIPT: 'call_script',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const FieldType = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  ADDRESS: 'address',
  CURRENCY: 'currency',
  SELECT: 'select',
} as const;

export type FieldType = (typeof FieldType)[keyof typeof FieldType];

export interface TemplateField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  defaultValue?: string;
  options?: string[];
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  description: string;
  fields: TemplateField[];
  stateSpecific: boolean;
  states?: string[];
  content: string;
}

export const DocumentFormat = {
  HTML: 'html',
  PDF: 'pdf',
  DOCX: 'docx',
} as const;

export type DocumentFormat =
  (typeof DocumentFormat)[keyof typeof DocumentFormat];

export interface GeneratedDocument {
  id: string;
  templateId: string;
  dealId?: string;
  content: string;
  format: DocumentFormat;
  createdAt: string;
  fields: Record<string, string>;
}

export const EmailCategory = {
  INITIAL_CONTACT: 'initial_contact',
  FOLLOW_UP: 'follow_up',
  OFFER: 'offer',
  CLOSING: 'closing',
} as const;

export type EmailCategory = (typeof EmailCategory)[keyof typeof EmailCategory];

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: EmailCategory;
  variables: string[];
}

export const ScriptSectionType = {
  OPENER: 'opener',
  DISCOVERY: 'discovery',
  OBJECTION: 'objection',
  CLOSE: 'close',
} as const;

export type ScriptSectionType =
  (typeof ScriptSectionType)[keyof typeof ScriptSectionType];

export interface ScriptSection {
  name: string;
  type: ScriptSectionType;
  lines: string[];
  notes?: string;
}

export interface CallScript {
  id: string;
  name: string;
  scenario: string;
  sections: ScriptSection[];
}

export interface GenerateDocumentRequest {
  templateId: string;
  fields: Record<string, string>;
  format: DocumentFormat;
}

export interface TemplatesResponse {
  contracts: DocumentTemplate[];
  emails: EmailTemplate[];
  scripts: CallScript[];
}
