import { z } from 'zod';
import { propertyTypeSchema } from './property.js';

export const territoryTypeSchema = z.enum(['zip', 'county', 'city']);

export const territorySchema = z.object({
  id: z.string(),
  type: territoryTypeSchema,
  value: z.string().min(1),
  name: z.string().min(1),
});

export const distressTypeSchema = z.enum([
  'foreclosure',
  'nod',
  'utility_shutoff',
  'demolition',
  'code_violation',
  'tax_delinquency',
  'probate',
  'eviction',
  'bankruptcy',
  'divorce',
  'vacancy',
  'expired_listing',
  'absentee_owner',
]);

export const heatCategorySchema = z.enum([
  'CRITICAL',
  'HIGH_PRIORITY',
  'STREET_WORK',
]);

export const leadClassificationSchema = z.enum(['A', 'B', 'C', 'D']);

export const leadStatusSchema = z.enum([
  'new',
  'contacted',
  'qualified',
  'negotiating',
  'under_contract',
  'closed',
  'dead',
]);

export const leadSourceSchema = z.enum([
  'driving_for_dollars',
  'direct_mail',
  'cold_call',
  'ppc',
  'seo',
  'referral',
  'bandit_sign',
  'mls',
  'wholesaler',
  'other',
]);

export const leadFilterSchema = z.object({
  territories: z.array(territorySchema).max(3, 'Maximum 3 territories allowed'),
  distressTypes: z.array(distressTypeSchema),
  minHeatScore: z.number().min(0).max(100).optional(),
  maxHeatScore: z.number().min(0).max(100).optional(),
  classifications: z.array(leadClassificationSchema),
  statuses: z.array(leadStatusSchema),
  propertyTypes: z.array(propertyTypeSchema),
  minBeds: z.number().int().min(0).max(20).optional(),
  maxBeds: z.number().int().min(0).max(20).optional(),
  minSqft: z.number().int().min(0).max(100000).optional(),
  maxSqft: z.number().int().min(0).max(100000).optional(),
  minYearBuilt: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 1)
    .optional(),
});

export type LeadFilterSchema = z.infer<typeof leadFilterSchema>;

export const csvUploadResultSchema = z.object({
  success: z.boolean(),
  imported: z.number().int().min(0),
  failed: z.number().int().min(0),
  errors: z.array(
    z.object({
      row: z.number().int(),
      field: z.string(),
      message: z.string(),
    })
  ),
});
