import {
  checkCompliance,
  complianceCheckInputSchema,
} from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = complianceCheckInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = checkCompliance(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Compliance check error:', error);
    return NextResponse.json(
      { error: 'Compliance check failed' },
      { status: 500 }
    );
  }
}
