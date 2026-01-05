import { z } from 'zod';
import { DealStrategy } from '../types/deal.js';

const dealStrategyEnum = z.enum([
  DealStrategy.ASSIGNMENT,
  DealStrategy.DOUBLE_CLOSE,
  DealStrategy.WHOLETAIL,
  DealStrategy.SUBJECT_TO,
  DealStrategy.MORBY_METHOD,
  DealStrategy.NOVATION,
  DealStrategy.SELLER_FINANCE,
]);

export const complianceCheckInputSchema = z.object({
  state: z
    .string()
    .length(2, 'State must be a 2-letter code')
    .transform((s) => s.toUpperCase()),
  strategy: dealStrategyEnum,
  distressIndicators: z.array(z.string()).optional(),
  dealsThisYear: z.number().int().min(0).optional(),
  propertyInForeclosure: z.boolean().optional(),
});

export type ComplianceCheckInputSchema = z.infer<
  typeof complianceCheckInputSchema
>;
