import type { Property, PropertyType } from './property.js';

export const TerritoryType = {
  ZIP: 'zip',
  COUNTY: 'county',
  CITY: 'city',
} as const;

export type TerritoryType = (typeof TerritoryType)[keyof typeof TerritoryType];

export interface Territory {
  id: string;
  type: TerritoryType;
  value: string;
  name: string;
}

export const DistressType = {
  FORECLOSURE: 'foreclosure',
  NOD: 'nod',
  UTILITY_SHUTOFF: 'utility_shutoff',
  DEMOLITION: 'demolition',
  CODE_VIOLATION: 'code_violation',
  TAX_DELINQUENCY: 'tax_delinquency',
  PROBATE: 'probate',
  EVICTION: 'eviction',
  BANKRUPTCY: 'bankruptcy',
  DIVORCE: 'divorce',
  VACANCY: 'vacancy',
  EXPIRED_LISTING: 'expired_listing',
  ABSENTEE_OWNER: 'absentee_owner',
} as const;

export type DistressType = (typeof DistressType)[keyof typeof DistressType];

export const DistressWeight: Record<DistressType, number> = {
  [DistressType.FORECLOSURE]: 10,
  [DistressType.NOD]: 10,
  [DistressType.UTILITY_SHUTOFF]: 8,
  [DistressType.DEMOLITION]: 9,
  [DistressType.CODE_VIOLATION]: 7,
  [DistressType.TAX_DELINQUENCY]: 8,
  [DistressType.PROBATE]: 7,
  [DistressType.EVICTION]: 6,
  [DistressType.BANKRUPTCY]: 8,
  [DistressType.DIVORCE]: 6,
  [DistressType.VACANCY]: 5,
  [DistressType.EXPIRED_LISTING]: 4,
  [DistressType.ABSENTEE_OWNER]: 3,
};

export const HeatCategory = {
  CRITICAL: 'CRITICAL',
  HIGH_PRIORITY: 'HIGH_PRIORITY',
  STREET_WORK: 'STREET_WORK',
} as const;

export type HeatCategory = (typeof HeatCategory)[keyof typeof HeatCategory];

export const LeadClassification = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
} as const;

export type LeadClassification =
  (typeof LeadClassification)[keyof typeof LeadClassification];

export const LeadStatus = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  NEGOTIATING: 'negotiating',
  UNDER_CONTRACT: 'under_contract',
  CLOSED: 'closed',
  DEAD: 'dead',
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const LeadSource = {
  DRIVING_FOR_DOLLARS: 'driving_for_dollars',
  DIRECT_MAIL: 'direct_mail',
  COLD_CALL: 'cold_call',
  PPC: 'ppc',
  SEO: 'seo',
  REFERRAL: 'referral',
  BANDIT_SIGN: 'bandit_sign',
  MLS: 'mls',
  WHOLESALER: 'wholesaler',
  OTHER: 'other',
} as const;

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export interface DistressIndicator {
  type: DistressType;
  weight: number;
  dateRecorded: string;
  decayedWeight: number;
}

export interface Lead {
  id: string;
  property: Property;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  heatScore: number;
  heatCategory: HeatCategory;
  distressIndicators: DistressIndicator[];
  classification: LeadClassification;
  status: LeadStatus;
  source: LeadSource;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFilter {
  territories: Territory[];
  distressTypes: DistressType[];
  minHeatScore?: number;
  maxHeatScore?: number;
  classifications: LeadClassification[];
  statuses: LeadStatus[];
  propertyTypes: PropertyType[];
  minBeds?: number;
  maxBeds?: number;
  minSqft?: number;
  maxSqft?: number;
  minYearBuilt?: number;
}

export interface LeadListResponse {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CSVUploadError {
  row: number;
  field: string;
  message: string;
}

export interface CSVUploadResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: CSVUploadError[];
}
