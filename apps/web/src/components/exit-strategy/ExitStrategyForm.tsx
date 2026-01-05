'use client';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import type { StrategyInputSchema } from '@wholesale-ai/shared';
import { strategyInputSchema } from '@wholesale-ai/shared';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExitStrategyFormProps {
  onSubmit: (data: StrategyInputSchema) => void;
  loading: boolean;
}

export function ExitStrategyForm({ onSubmit, loading }: ExitStrategyFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StrategyInputSchema>({
    resolver: standardSchemaResolver(strategyInputSchema),
    defaultValues: {
      arv: 300000,
      purchasePrice: 200000,
      repairs: 20000,
      mortgageBalance: 150000,
      interestRate: 4.5,
      propertyCondition: 'good',
      sellerMotivation: 'medium',
      sellerNeedsCash: false,
      userLiquidCapital: 15000,
    },
  });

  const condition = watch('propertyCondition');
  const motivation = watch('sellerMotivation');
  const needsCash = watch('sellerNeedsCash');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arv">ARV ($)</Label>
              <Input
                id="arv"
                type="number"
                placeholder="300000"
                {...register('arv', { valueAsNumber: true })}
              />
              {errors.arv && (
                <p className="text-sm text-red-500">{errors.arv.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                placeholder="200000"
                {...register('purchasePrice', { valueAsNumber: true })}
              />
              {errors.purchasePrice && (
                <p className="text-sm text-red-500">
                  {errors.purchasePrice.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repairs">Repairs ($)</Label>
              <Input
                id="repairs"
                type="number"
                placeholder="20000"
                {...register('repairs', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortgageBalance">Mortgage Balance ($)</Label>
              <Input
                id="mortgageBalance"
                type="number"
                placeholder="150000"
                {...register('mortgageBalance', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                placeholder="4.5"
                {...register('interestRate', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userLiquidCapital">Your Liquid Capital ($)</Label>
              <Input
                id="userLiquidCapital"
                type="number"
                placeholder="15000"
                {...register('userLiquidCapital', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Property Condition</Label>
              <Select
                value={condition}
                onValueChange={(v) =>
                  setValue(
                    'propertyCondition',
                    v as StrategyInputSchema['propertyCondition']
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seller Motivation</Label>
              <Select
                value={motivation}
                onValueChange={(v) =>
                  setValue(
                    'sellerMotivation',
                    v as StrategyInputSchema['sellerMotivation']
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select motivation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sellerNeedsCash"
              checked={needsCash}
              onChange={(e) => setValue('sellerNeedsCash', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="sellerNeedsCash" className="cursor-pointer">
              Seller needs cash at closing
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Analyzing...' : 'Find Best Exit Strategy'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
