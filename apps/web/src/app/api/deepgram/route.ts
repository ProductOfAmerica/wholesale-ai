import { NextResponse } from 'next/server';

export async function GET() {
  // Security fix: Remove direct API key exposure
  // Use the token endpoint instead for secure access
  return NextResponse.json(
    {
      error: 'Direct API key access removed for security',
      recommendation:
        'Use /api/deepgram-token endpoint for secure token-based access',
    },
    { status: 403 },
  );
}
