import { z } from 'zod';

const conditionWithoutUnknown = z.enum(['excellent', 'good', 'fair', 'poor']);
const motivationWithoutUnknown = z.enum(['high', 'medium', 'low']);

export const strategyInputSchema = z.object({
  arv: z.number().min(0, 'ARV must be positive'),
  purchasePrice: z.number().min(0, 'Purchase price must be positive'),
  repairs: z.number().min(0, 'Repairs must be positive'),
  mortgageBalance: z.number().min(0, 'Mortgage balance must be positive'),
  interestRate: z.number().min(0).max(30, 'Interest rate seems too high'),
  propertyCondition: conditionWithoutUnknown,
  sellerMotivation: motivationWithoutUnknown,
  sellerNeedsCash: z.boolean(),
  userLiquidCapital: z.number().min(0, 'Capital must be positive'),
});

export type StrategyInputSchema = z.infer<typeof strategyInputSchema>;
