import {
  ComplianceCategory,
  ComplianceSeverity,
  DisclosurePlacement,
  type StateCompliance,
} from '../types/compliance.js';
import { DealStrategy } from '../types/deal.js';

const TX_COMPLIANCE: StateCompliance = {
  state: 'TX',
  stateName: 'Texas',
  rules: [
    {
      id: 'tx-executory-001',
      name: 'Executory Contract Disclosure',
      description:
        'Texas Property Code Chapter 5 requires specific disclosures for executory contracts (wraps, seller finance, contract for deed)',
      category: ComplianceCategory.CREATIVE_FINANCE,
      severity: ComplianceSeverity.ERROR,
    },
    {
      id: 'tx-assignment-001',
      name: 'Assignment Notice Requirement',
      description: 'Seller must be notified of intent to assign the contract',
      category: ComplianceCategory.ASSIGNMENT,
      severity: ComplianceSeverity.WARNING,
    },
  ],
  disclosures: [
    {
      id: 'tx-disc-001',
      name: 'Texas Property Code Chapter 5 Disclosure',
      triggeredBy: [DealStrategy.SELLER_FINANCE, DealStrategy.SUBJECT_TO],
      content:
        'IMPORTANT NOTICE: This is an executory contract. Under Texas Property Code Chapter 5, you have specific rights and protections. The seller must: (1) provide annual accounting statements, (2) record the contract, (3) provide copies of all documents. You have the right to cancel this contract within 14 days of signing.',
      placement: DisclosurePlacement.CONTRACT,
    },
    {
      id: 'tx-disc-002',
      name: 'Assignment Fee Disclosure',
      triggeredBy: [DealStrategy.ASSIGNMENT],
      content:
        'NOTICE: This contract may be assigned to a third party. The assignor intends to receive an assignment fee upon the sale of this property.',
      placement: DisclosurePlacement.CONTRACT,
    },
  ],
  restrictions: [
    {
      strategy: DealStrategy.SELLER_FINANCE,
      allowed: true,
      conditions: 'Requires full Property Code Chapter 5 compliance',
      alternativeStrategy: null,
      notes: 'High documentation burden - consider double close instead',
    },
  ],
};

const IL_COMPLIANCE: StateCompliance = {
  state: 'IL',
  stateName: 'Illinois',
  rules: [
    {
      id: 'il-license-001',
      name: 'Real Estate License Requirement',
      description:
        'Illinois requires a real estate license after completing more than 1 wholesale deal per year',
      category: ComplianceCategory.LICENSING,
      severity: ComplianceSeverity.ERROR,
    },
  ],
  disclosures: [],
  restrictions: [
    {
      strategy: DealStrategy.ASSIGNMENT,
      allowed: false,
      conditions: 'Only allowed for first deal of the year without license',
      alternativeStrategy: DealStrategy.DOUBLE_CLOSE,
      notes: 'Use double close to avoid licensing issues',
    },
  ],
};

const OK_COMPLIANCE: StateCompliance = {
  state: 'OK',
  stateName: 'Oklahoma',
  rules: [
    {
      id: 'ok-predatory-001',
      name: 'Predatory Lending Disclosure',
      description:
        'Oklahoma requires disclosure for creative financing to protect against predatory practices',
      category: ComplianceCategory.CREATIVE_FINANCE,
      severity: ComplianceSeverity.WARNING,
    },
  ],
  disclosures: [
    {
      id: 'ok-disc-001',
      name: 'Oklahoma Creative Finance Disclosure',
      triggeredBy: [DealStrategy.SUBJECT_TO, DealStrategy.SELLER_FINANCE],
      content:
        'OKLAHOMA DISCLOSURE: This transaction involves creative financing. You are advised to seek independent legal counsel before signing. The terms of this agreement may affect your property rights and credit.',
      placement: DisclosurePlacement.SEPARATE_FORM,
    },
  ],
  restrictions: [],
};

const NC_COMPLIANCE: StateCompliance = {
  state: 'NC',
  stateName: 'North Carolina',
  rules: [
    {
      id: 'nc-option-001',
      name: 'Option to Purchase Requirements',
      description:
        'North Carolina has specific requirements for Option to Purchase agreements',
      category: ComplianceCategory.CONTRACT,
      severity: ComplianceSeverity.WARNING,
    },
  ],
  disclosures: [
    {
      id: 'nc-disc-001',
      name: 'NC Option Agreement Notice',
      triggeredBy: ['option_contract'],
      content:
        'NOTICE: This Option to Purchase agreement must comply with North Carolina General Statutes. The optionee has the right to exercise this option within the specified time period.',
      placement: DisclosurePlacement.CONTRACT,
    },
  ],
  restrictions: [],
};

const CA_COMPLIANCE: StateCompliance = {
  state: 'CA',
  stateName: 'California',
  rules: [
    {
      id: 'ca-equity-001',
      name: 'Equity Skimming Protection',
      description:
        'California Civil Code protects homeowners from equity skimming schemes in foreclosure situations',
      category: ComplianceCategory.FORECLOSURE,
      severity: ComplianceSeverity.ERROR,
    },
    {
      id: 'ca-cancel-001',
      name: '5-Day Cancellation Right',
      description:
        'California requires a 5-day right to cancel for foreclosure purchases',
      category: ComplianceCategory.FORECLOSURE,
      severity: ComplianceSeverity.ERROR,
    },
  ],
  disclosures: [
    {
      id: 'ca-disc-001',
      name: 'California 5-Day Cancellation Notice',
      triggeredBy: ['foreclosure'],
      content:
        'IMPORTANT NOTICE: You have the right to cancel this contract within 5 business days of signing. To cancel, you must provide written notice to the purchaser. This right cannot be waived. [California Civil Code Section 1695.5]',
      placement: DisclosurePlacement.SEPARATE_FORM,
    },
    {
      id: 'ca-disc-002',
      name: 'California Equity Purchaser Notice',
      triggeredBy: ['foreclosure'],
      content:
        'WARNING: This property is in foreclosure. Under California law, the purchaser must: (1) provide fair market value for the property, (2) not engage in any fraudulent or deceptive practices, (3) comply with all notice requirements. Violation of these provisions may result in criminal penalties.',
      placement: DisclosurePlacement.CONTRACT,
    },
  ],
  restrictions: [
    {
      strategy: DealStrategy.SUBJECT_TO,
      allowed: true,
      conditions: 'Extra scrutiny required for foreclosure properties',
      alternativeStrategy: null,
      notes: 'Recommend legal review for all California foreclosure deals',
    },
  ],
};

const WA_COMPLIANCE: StateCompliance = {
  state: 'WA',
  stateName: 'Washington',
  rules: [
    {
      id: 'wa-distressed-001',
      name: 'Distressed Home Purchaser Act',
      description:
        'Washington RCW 61.34 regulates purchases of distressed homes',
      category: ComplianceCategory.FORECLOSURE,
      severity: ComplianceSeverity.ERROR,
    },
  ],
  disclosures: [
    {
      id: 'wa-disc-001',
      name: 'Washington Distressed Property Notice',
      triggeredBy: ['foreclosure', 'distressed'],
      content:
        'NOTICE TO HOMEOWNER: Under Washington State Law (RCW 61.34), you have specific rights when selling a distressed property. You may cancel this transaction within a certain time period. The purchaser must provide you with this notice in writing.',
      placement: DisclosurePlacement.SEPARATE_FORM,
    },
  ],
  restrictions: [],
};

const STATE_COMPLIANCE_MAP: Record<string, StateCompliance> = {
  TX: TX_COMPLIANCE,
  IL: IL_COMPLIANCE,
  OK: OK_COMPLIANCE,
  NC: NC_COMPLIANCE,
  CA: CA_COMPLIANCE,
  WA: WA_COMPLIANCE,
};

export function getStateCompliance(state: string): StateCompliance | null {
  return STATE_COMPLIANCE_MAP[state.toUpperCase()] ?? null;
}

export function getAllStates(): string[] {
  return Object.keys(STATE_COMPLIANCE_MAP);
}

export function getStatesWithRestrictions(): string[] {
  return Object.entries(STATE_COMPLIANCE_MAP)
    .filter(([, compliance]) => compliance.restrictions.length > 0)
    .map(([state]) => state);
}
