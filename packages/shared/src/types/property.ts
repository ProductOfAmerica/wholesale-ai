export const PropertyType = {
  SINGLE_FAMILY: 'single_family',
  MULTI_FAMILY: 'multi_family',
  CONDO: 'condo',
  TOWNHOUSE: 'townhouse',
  MOBILE: 'mobile',
  LAND: 'land',
} as const;

export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  beds: number;
  baths: number;
  sqft: number;
  lotSize: number | null;
  yearBuilt: number | null;
  propertyType: PropertyType;
}

export interface PropertyInput {
  address: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: PropertyType;
}
