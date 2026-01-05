import { analyzeExitStrategy, strategyInputSchema } from '@wholesale-ai/shared';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = strategyInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const analysis = analyzeExitStrategy(parsed.data);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Exit strategy analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
