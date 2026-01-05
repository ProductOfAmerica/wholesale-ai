import type { Comp } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

function generateMockComps(_address: string): Comp[] {
  const basePrice = 250000 + Math.random() * 150000;
  const baseSqft = 1400 + Math.random() * 400;

  return [
    {
      address: `${Math.floor(Math.random() * 9000 + 1000)} Oak St`,
      salePrice: Math.round(basePrice * (0.95 + Math.random() * 0.1)),
      saleDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      sqft: Math.round(baseSqft * (0.95 + Math.random() * 0.1)),
      pricePerSqft: 0,
      distance: 0.3 + Math.random() * 0.2,
      adjustedValue: 0,
    },
    {
      address: `${Math.floor(Math.random() * 9000 + 1000)} Maple Ave`,
      salePrice: Math.round(basePrice * (0.9 + Math.random() * 0.2)),
      saleDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      sqft: Math.round(baseSqft * (0.9 + Math.random() * 0.2)),
      pricePerSqft: 0,
      distance: 0.5 + Math.random() * 0.3,
      adjustedValue: 0,
    },
    {
      address: `${Math.floor(Math.random() * 9000 + 1000)} Pine Rd`,
      salePrice: Math.round(basePrice * (0.85 + Math.random() * 0.3)),
      saleDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      sqft: Math.round(baseSqft * (0.85 + Math.random() * 0.3)),
      pricePerSqft: 0,
      distance: 0.7 + Math.random() * 0.5,
      adjustedValue: 0,
    },
    {
      address: `${Math.floor(Math.random() * 9000 + 1000)} Elm Blvd`,
      salePrice: Math.round(basePrice * (0.88 + Math.random() * 0.24)),
      saleDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      sqft: Math.round(baseSqft * (0.92 + Math.random() * 0.16)),
      pricePerSqft: 0,
      distance: 0.4 + Math.random() * 0.4,
      adjustedValue: 0,
    },
  ].map((comp) => ({
    ...comp,
    pricePerSqft: Math.round(comp.salePrice / comp.sqft),
    adjustedValue: comp.salePrice,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const comps = generateMockComps(address);
  return NextResponse.json(comps);
}
