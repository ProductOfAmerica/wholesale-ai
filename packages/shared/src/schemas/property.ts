import { z } from 'zod';

export const propertyTypeSchema = z.enum([
  'single_family',
  'multi_family',
  'condo',
  'townhouse',
  'mobile',
  'land',
]);

export const propertyInputSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().length(2, 'State must be 2-letter code'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  county: z.string().optional(),
  beds: z.number().int().min(0).max(20).optional(),
  baths: z.number().min(0).max(20).optional(),
  sqft: z.number().int().min(0).max(100000).optional(),
  lotSize: z.number().min(0).optional(),
  yearBuilt: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 1)
    .optional(),
  propertyType: propertyTypeSchema.optional(),
});

export type PropertyInputSchema = z.infer<typeof propertyInputSchema>;
