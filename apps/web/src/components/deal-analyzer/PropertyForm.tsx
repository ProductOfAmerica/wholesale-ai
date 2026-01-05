'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Condition, Motivation } from '@wholesale-ai/shared';
import { analyzeRequestSchema } from '@wholesale-ai/shared';
import { Loader2 } from 'lucide-react';
import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
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

type FormValues = z.input<typeof analyzeRequestSchema>;
type OutputValues = z.output<typeof analyzeRequestSchema>;

export interface PropertyFormRef {
  reset: (values: Partial<FormValues>) => void;
}

interface PropertyFormProps {
  onSubmit: (data: OutputValues) => void;
  loading: boolean;
  defaultValues?: Partial<FormValues>;
}

export const PropertyForm = forwardRef<PropertyFormRef, PropertyFormProps>(
  function PropertyForm({ onSubmit, loading, defaultValues }, ref) {
    const {
      register,
      handleSubmit,
      setValue,
      watch,
      reset,
      formState: { errors },
    } = useForm<FormValues>({
      resolver: zodResolver(analyzeRequestSchema),
      defaultValues: {
        address: '',
        askingPrice: null,
        mortgageBalance: null,
        condition: 'unknown',
        motivation: 'unknown',
        wholesaleFee: 10000,
        sqft: 1500,
        ...defaultValues,
      },
    });

    useImperativeHandle(ref, () => ({
      reset: (values: Partial<FormValues>) => {
        reset((prev) => ({ ...prev, ...values }));
      },
    }));

    useEffect(() => {
      if (defaultValues) {
        reset((prev) => ({ ...prev, ...defaultValues }));
      }
    }, [defaultValues, reset]);

  const condition = watch('condition');
  const motivation = watch('motivation');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => onSubmit(data as OutputValues))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              placeholder="123 Main St, City, State 12345"
              {...register('address')}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="askingPrice">Asking Price</Label>
              <Input
                id="askingPrice"
                type="number"
                placeholder="250000"
                {...register('askingPrice', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortgageBalance">Mortgage Balance</Label>
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
              <Label htmlFor="sqft">Square Feet</Label>
              <Input
                id="sqft"
                type="number"
                placeholder="1500"
                {...register('sqft', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wholesaleFee">Wholesale Fee</Label>
              <Input
                id="wholesaleFee"
                type="number"
                placeholder="10000"
                {...register('wholesaleFee', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select
                value={condition}
                onValueChange={(v) => setValue('condition', v as Condition)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivation</Label>
              <Select
                value={motivation}
                onValueChange={(v) => setValue('motivation', v as Motivation)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select motivation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Analyzing...' : 'Analyze Deal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
  }
);
