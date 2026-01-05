import { z } from 'zod';

export const conditionSchema = z.enum([
  'excellent',
  'good',
  'fair',
  'poor',
  'unknown',
]);

export const motivationSchema = z.enum(['high', 'medium', 'low', 'unknown']);

export const dealStrategySchema = z.enum([
  'assignment',
  'double_close',
  'wholetail',
  'subject_to',
  'morby_method',
  'novation',
  'seller_finance',
]);

export const maoCalculationSchema = z.object({
  arv: z.number().min(0, 'ARV must be positive'),
  repairs: z.number().min(0, 'Repairs must be positive'),
  wholesaleFee: z.number().min(0, 'Wholesale fee must be positive'),
  arvMultiplier: z.number().min(0.5).max(0.85).default(0.7),
});

export const dealAnalysisInputSchema = z.object({
  leadId: z.string().uuid(),
  arv: z.number().min(0),
  mortgageBalance: z.number().min(0).nullable(),
  condition: conditionSchema,
  motivation: motivationSchema,
  repairs: z.number().min(0),
  wholesaleFee: z.number().min(0).default(10000),
  askingPrice: z.number().min(0).nullable(),
  strategy: dealStrategySchema.optional(),
});

export const analyzeRequestSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  askingPrice: z.number().min(0).nullable().optional(),
  mortgageBalance: z.number().min(0).nullable().optional(),
  condition: conditionSchema.default('unknown'),
  motivation: motivationSchema.default('unknown'),
  wholesaleFee: z.number().min(0).default(10000),
  sqft: z.number().min(100).default(1500),
});

export type MAOCalculationSchema = z.infer<typeof maoCalculationSchema>;
export type DealAnalysisInputSchema = z.infer<typeof dealAnalysisInputSchema>;
export type AnalyzeRequestSchema = z.infer<typeof analyzeRequestSchema>;
