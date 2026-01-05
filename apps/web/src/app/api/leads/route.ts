import type {
  CSVUploadResult,
  Lead,
  LeadListResponse,
} from '@wholesale-ai/shared';
import {
  DistressType,
  HeatCategory,
  LeadClassification,
  LeadSource,
  LeadStatus,
  PropertyType,
} from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

const mockLeads: Lead[] = [
  {
    id: 'lead-001',
    property: {
      id: 'prop-001',
      address: '1234 Oak Street',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      county: 'Dallas',
      beds: 3,
      baths: 2,
      sqft: 1850,
      lotSize: 0.25,
      yearBuilt: 1985,
      propertyType: PropertyType.SINGLE_FAMILY,
    },
    ownerName: 'John Smith',
    ownerPhone: '214-555-1234',
    ownerEmail: null,
    heatScore: 18,
    heatCategory: HeatCategory.CRITICAL,
    distressIndicators: [
      {
        type: DistressType.FORECLOSURE,
        weight: 10,
        dateRecorded: '2024-01-15',
        decayedWeight: 10,
      },
      {
        type: DistressType.TAX_DELINQUENCY,
        weight: 8,
        dateRecorded: '2023-12-01',
        decayedWeight: 8,
      },
    ],
    classification: LeadClassification.A,
    status: LeadStatus.NEW,
    source: LeadSource.DRIVING_FOR_DOLLARS,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lead-002',
    property: {
      id: 'prop-002',
      address: '567 Maple Avenue',
      city: 'Fort Worth',
      state: 'TX',
      zip: '76102',
      county: 'Tarrant',
      beds: 4,
      baths: 2.5,
      sqft: 2200,
      lotSize: 0.3,
      yearBuilt: 1992,
      propertyType: PropertyType.SINGLE_FAMILY,
    },
    ownerName: 'Mary Johnson',
    ownerPhone: '817-555-5678',
    ownerEmail: 'mary@email.com',
    heatScore: 12,
    heatCategory: HeatCategory.HIGH_PRIORITY,
    distressIndicators: [
      {
        type: DistressType.PROBATE,
        weight: 7,
        dateRecorded: '2024-01-10',
        decayedWeight: 7,
      },
      {
        type: DistressType.VACANCY,
        weight: 5,
        dateRecorded: '2024-01-05',
        decayedWeight: 5,
      },
    ],
    classification: LeadClassification.B,
    status: LeadStatus.CONTACTED,
    source: LeadSource.DIRECT_MAIL,
    notes: 'Left voicemail',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'lead-003',
    property: {
      id: 'prop-003',
      address: '890 Pine Road',
      city: 'Arlington',
      state: 'TX',
      zip: '76010',
      county: 'Tarrant',
      beds: 3,
      baths: 1.5,
      sqft: 1500,
      lotSize: 0.2,
      yearBuilt: 1978,
      propertyType: PropertyType.SINGLE_FAMILY,
    },
    ownerName: 'Robert Williams',
    ownerPhone: '682-555-9012',
    ownerEmail: null,
    heatScore: 16,
    heatCategory: HeatCategory.CRITICAL,
    distressIndicators: [
      {
        type: DistressType.CODE_VIOLATION,
        weight: 7,
        dateRecorded: '2024-01-08',
        decayedWeight: 7,
      },
      {
        type: DistressType.TAX_DELINQUENCY,
        weight: 8,
        dateRecorded: '2023-11-15',
        decayedWeight: 7,
      },
      {
        type: DistressType.UTILITY_SHUTOFF,
        weight: 8,
        dateRecorded: '2024-01-12',
        decayedWeight: 8,
      },
    ],
    classification: LeadClassification.A,
    status: LeadStatus.QUALIFIED,
    source: LeadSource.COLD_CALL,
    notes: 'Owner motivated, needs to sell within 30 days',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'lead-004',
    property: {
      id: 'prop-004',
      address: '321 Elm Court',
      city: 'Plano',
      state: 'TX',
      zip: '75024',
      county: 'Collin',
      beds: 5,
      baths: 3,
      sqft: 3200,
      lotSize: 0.4,
      yearBuilt: 2005,
      propertyType: PropertyType.SINGLE_FAMILY,
    },
    ownerName: 'Sarah Davis',
    ownerPhone: '972-555-3456',
    ownerEmail: 'sarah.d@email.com',
    heatScore: 9,
    heatCategory: HeatCategory.HIGH_PRIORITY,
    distressIndicators: [
      {
        type: DistressType.DIVORCE,
        weight: 6,
        dateRecorded: '2024-01-02',
        decayedWeight: 6,
      },
      {
        type: DistressType.ABSENTEE_OWNER,
        weight: 3,
        dateRecorded: '2023-10-01',
        decayedWeight: 3,
      },
    ],
    classification: LeadClassification.B,
    status: LeadStatus.NEGOTIATING,
    source: LeadSource.REFERRAL,
    notes: 'Divorce settlement pending',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'lead-005',
    property: {
      id: 'prop-005',
      address: '654 Birch Lane',
      city: 'Irving',
      state: 'TX',
      zip: '75061',
      county: 'Dallas',
      beds: 2,
      baths: 1,
      sqft: 1100,
      lotSize: 0.15,
      yearBuilt: 1965,
      propertyType: PropertyType.SINGLE_FAMILY,
    },
    ownerName: 'Michael Brown',
    ownerPhone: null,
    ownerEmail: null,
    heatScore: 6,
    heatCategory: HeatCategory.STREET_WORK,
    distressIndicators: [
      {
        type: DistressType.VACANCY,
        weight: 5,
        dateRecorded: '2023-08-01',
        decayedWeight: 3,
      },
      {
        type: DistressType.ABSENTEE_OWNER,
        weight: 3,
        dateRecorded: '2023-06-01',
        decayedWeight: 2,
      },
    ],
    classification: LeadClassification.C,
    status: LeadStatus.NEW,
    source: LeadSource.DRIVING_FOR_DOLLARS,
    notes: null,
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    updatedAt: new Date(Date.now() - 1209600000).toISOString(),
  },
  {
    id: 'lead-006',
    property: {
      id: 'prop-006',
      address: '789 Cedar Drive',
      city: 'Garland',
      state: 'TX',
      zip: '75040',
      county: 'Dallas',
      beds: 3,
      baths: 2,
      sqft: 1650,
      lotSize: 0.22,
      yearBuilt: 1988,
      propertyType: PropertyType.SINGLE_FAMILY,
    },
    ownerName: 'Patricia Wilson',
    ownerPhone: '469-555-7890',
    ownerEmail: null,
    heatScore: 15,
    heatCategory: HeatCategory.CRITICAL,
    distressIndicators: [
      {
        type: DistressType.NOD,
        weight: 10,
        dateRecorded: '2024-01-18',
        decayedWeight: 10,
      },
      {
        type: DistressType.EVICTION,
        weight: 6,
        dateRecorded: '2024-01-10',
        decayedWeight: 6,
      },
    ],
    classification: LeadClassification.A,
    status: LeadStatus.NEW,
    source: LeadSource.MLS,
    notes: null,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedLeads = mockLeads.slice(start, end);

  const response: LeadListResponse = {
    leads: paginatedLeads,
    total: mockLeads.length,
    page,
    pageSize,
    hasMore: end < mockLeads.length,
  };

  return NextResponse.json(response);
}

export async function POST() {
  const result: CSVUploadResult = {
    success: true,
    imported: 15,
    failed: 2,
    errors: [
      { row: 8, field: 'zip', message: 'Invalid ZIP code format' },
      { row: 12, field: 'address', message: 'Address is required' },
    ],
  };

  return NextResponse.json(result);
}
