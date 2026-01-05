import { z } from 'zod';
import { propertyTypeSchema } from './property.js';

export const buyerStrategySchema = z.enum([
  'fix_and_flip',
  'buy_and_hold',
  'wholetail',
  'subject_to',
  'creative_finance',
  'land',
]);

export const geographySchema = z.object({
  city: z.string().min(2),
  state: z.string().length(2),
  county: z.string().optional(),
  zipCodes: z.array(z.string()).optional(),
});

export const buyBoxSchema = z
  .object({
    geographies: z
      .array(geographySchema)
      .min(1, 'At least one territory required')
      .max(3, 'Maximum 3 territories allowed'),
    strategies: z.array(buyerStrategySchema).min(1),
    propertyTypes: z.array(propertyTypeSchema).min(1),
    priceMin: z.number().min(0),
    priceMax: z.number().min(0),
    bedsMin: z.number().int().min(0).max(20).nullable(),
    bedsMax: z.number().int().min(0).max(20).nullable(),
    sqftMin: z.number().int().min(0).max(100000).nullable(),
    sqftMax: z.number().int().min(0).max(100000).nullable(),
    acceptableConditions: z.array(z.string()),
  })
  .refine((data) => data.priceMin <= data.priceMax, {
    message: 'Minimum price must be less than or equal to maximum price',
    path: ['priceMin'],
  });

export const buyerProfileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number'),
  company: z.string().nullable(),
  buyBox: buyBoxSchema,
  notes: z.string().nullable(),
});

export type BuyBoxSchema = z.infer<typeof buyBoxSchema>;
export type BuyerProfileSchema = z.infer<typeof buyerProfileSchema>;
