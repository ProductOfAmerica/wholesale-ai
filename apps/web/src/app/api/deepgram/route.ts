import { NextResponse } from 'next/server';

export async function GET() {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

  if (!deepgramApiKey) {
    return NextResponse.json(
      { error: 'Deepgram API key not configured' },
      { status: 500 },
    );
  }

  return NextResponse.json({ apiKey: deepgramApiKey });
}
