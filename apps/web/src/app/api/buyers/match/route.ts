import type {
  BuyBox,
  Buyer,
  BuyerMatch,
  Geography,
} from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';
import { mockBuyers } from '../route';

interface PropertyData {
  city: string;
  state: string;
  county?: string;
  zip?: string;
  propertyType: string;
  beds: number;
  sqft: number;
}

interface MatchRequest {
  dealId?: string;
  property?: PropertyData;
  askingPrice?: number;
  strategy?: string;
}

interface MatchResult {
  score: number;
  reasons: string[];
  exclude: boolean;
}

const CITY_DISTANCES: Record<string, Record<string, number>> = {
  Dallas: {
    Dallas: 0,
    'Fort Worth': 32,
    Arlington: 20,
    Plano: 20,
    Irving: 12,
    Garland: 15,
  },
  'Fort Worth': {
    Dallas: 32,
    'Fort Worth': 0,
    Arlington: 15,
    Plano: 45,
    Irving: 25,
    Garland: 40,
  },
  Arlington: {
    Dallas: 20,
    'Fort Worth': 15,
    Arlington: 0,
    Plano: 35,
    Irving: 15,
    Garland: 25,
  },
  Plano: {
    Dallas: 20,
    'Fort Worth': 45,
    Arlington: 35,
    Plano: 0,
    Irving: 25,
    Garland: 15,
  },
  Irving: {
    Dallas: 12,
    'Fort Worth': 25,
    Arlington: 15,
    Plano: 25,
    Irving: 0,
    Garland: 20,
  },
  Garland: {
    Dallas: 15,
    'Fort Worth': 40,
    Arlington: 25,
    Plano: 15,
    Irving: 20,
    Garland: 0,
  },
};

function calculateDistance(buyerCity: string, propertyCity: string): number {
  return CITY_DISTANCES[buyerCity]?.[propertyCity] ?? 50;
}

function checkGeography(
  geographies: Geography[],
  property: PropertyData
): boolean {
  return geographies.some((geo) => {
    const cityMatch = geo.city.toLowerCase() === property.city.toLowerCase();
    const countyMatch =
      geo.county && property.county?.toLowerCase() === geo.county.toLowerCase();
    return cityMatch || countyMatch;
  });
}

function scorePrice(
  buyBox: BuyBox,
  askingPrice: number | undefined
): MatchResult {
  if (!askingPrice) return { score: 15, reasons: [], exclude: false };

  const inRange =
    askingPrice >= buyBox.priceMin && askingPrice <= buyBox.priceMax;
  if (inRange)
    return { score: 25, reasons: ['Price within range'], exclude: false };

  const tooFar =
    askingPrice < buyBox.priceMin * 0.8 || askingPrice > buyBox.priceMax * 1.2;
  if (tooFar) return { score: 0, reasons: [], exclude: true };

  return { score: 10, reasons: ['Price near range'], exclude: false };
}

function scorePropertySpecs(
  buyBox: BuyBox,
  property: PropertyData
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  const typeMatch = buyBox.propertyTypes.some(
    (t) => t.toLowerCase() === property.propertyType.toLowerCase()
  );
  if (typeMatch) {
    score += 15;
    reasons.push('Property type match');
  }

  const bedsMatch =
    buyBox.bedsMin &&
    buyBox.bedsMax &&
    property.beds >= buyBox.bedsMin &&
    property.beds <= buyBox.bedsMax;
  if (bedsMatch) {
    score += 10;
    reasons.push('Bedroom count fits');
  }

  const sqftMatch =
    buyBox.sqftMin &&
    buyBox.sqftMax &&
    property.sqft >= buyBox.sqftMin &&
    property.sqft <= buyBox.sqftMax;
  if (sqftMatch) {
    score += 10;
    reasons.push('Square footage fits');
  }

  return { score, reasons, exclude: false };
}

function scoreBuyerProfile(buyer: Buyer): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (buyer.verified) {
    score += 5;
    reasons.push('Verified buyer');
  }
  if (buyer.vip) {
    score += 5;
    reasons.push('VIP buyer');
  }

  const closingRate =
    buyer.stats.dealsReceived > 0
      ? buyer.stats.dealsClosed / buyer.stats.dealsReceived
      : 0;
  if (closingRate > 0.2) {
    score += 5;
    reasons.push('High closing rate');
  }

  return { score, reasons, exclude: false };
}

function isRecentlyActive(lastActive: string | null): boolean {
  if (!lastActive) return false;
  const daysSince = Math.floor(
    (Date.now() - new Date(lastActive).getTime()) / 86400000
  );
  return daysSince < 7;
}

function matchBuyer(buyer: Buyer, request: MatchRequest): BuyerMatch | null {
  const { property, askingPrice } = request;
  if (!property) return null;

  if (!checkGeography(buyer.buyBox.geographies, property)) return null;

  const priceResult = scorePrice(buyer.buyBox, askingPrice);
  if (priceResult.exclude) return null;

  const specsResult = scorePropertySpecs(buyer.buyBox, property);
  const profileResult = scoreBuyerProfile(buyer);
  const recentActivity = isRecentlyActive(buyer.stats.lastActive);

  const score =
    30 +
    priceResult.score +
    specsResult.score +
    profileResult.score +
    (recentActivity ? 5 : 0);
  const reasons = [
    'Location in buy box',
    ...priceResult.reasons,
    ...specsResult.reasons,
    ...profileResult.reasons,
  ];

  return {
    buyer,
    matchScore: Math.min(score, 100),
    matchReasons: reasons.slice(0, 4),
    distance: calculateDistance(
      buyer.buyBox.geographies[0]?.city || '',
      property.city
    ),
    recentActivity,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as MatchRequest;

  if (!body.property && !body.dealId) {
    return NextResponse.json(
      { error: 'Either property or dealId is required' },
      { status: 400 }
    );
  }

  let propertyData = body.property;

  if (body.dealId && !propertyData) {
    propertyData = {
      city: 'Dallas',
      state: 'TX',
      county: 'Dallas',
      zip: '75201',
      propertyType: 'single_family',
      beds: 3,
      sqft: 1850,
    };
    body.askingPrice = body.askingPrice || 125000;
  }

  const matches: BuyerMatch[] = mockBuyers
    .map((buyer) => matchBuyer(buyer, { ...body, property: propertyData }))
    .filter((match): match is BuyerMatch => match !== null)
    .sort((a, b) => b.matchScore - a.matchScore);

  return NextResponse.json({ matches });
}
