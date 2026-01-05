import type { PropertyType } from './property.js';

export const BuyerStrategy = {
  FIX_AND_FLIP: 'fix_and_flip',
  BUY_AND_HOLD: 'buy_and_hold',
  WHOLETAIL: 'wholetail',
  SUBJECT_TO: 'subject_to',
  CREATIVE_FINANCE: 'creative_finance',
  LAND: 'land',
} as const;

export type BuyerStrategy = (typeof BuyerStrategy)[keyof typeof BuyerStrategy];

export interface Geography {
  city: string;
  state: string;
  county?: string;
  zipCodes?: string[];
}

export interface BuyBox {
  geographies: Geography[];
  strategies: BuyerStrategy[];
  propertyTypes: PropertyType[];
  priceMin: number;
  priceMax: number;
  bedsMin: number | null;
  bedsMax: number | null;
  sqftMin: number | null;
  sqftMax: number | null;
  acceptableConditions: string[];
}

export interface BuyerStats {
  dealsReceived: number;
  dealsViewed: number;
  dealsClosed: number;
  totalVolume: number;
  avgResponseTime: number | null;
  lastActive: string | null;
}

export interface Buyer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  buyBox: BuyBox;
  verified: boolean;
  vip: boolean;
  stats: BuyerStats;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
