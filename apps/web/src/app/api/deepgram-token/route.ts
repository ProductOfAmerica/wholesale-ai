import { NextResponse } from 'next/server';

export async function POST() {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

  if (!deepgramApiKey) {
    return NextResponse.json(
      { error: 'Deepgram API key not configured' },
      { status: 500 },
    );
  }

  try {
    // Generate a temporary token using Deepgram's token API
    const response = await fetch('https://api.deepgram.com/v1/auth/tokens', {
      method: 'POST',
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ttl_seconds: 300, // 5 minutes
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: 'Failed to generate Deepgram token',
          status: response.status,
          details: errorText,
        },
        { status: 400 },
      );
    }

    const tokenData = await response.json();
    return NextResponse.json({
      token: tokenData.token,
      expires_in_seconds: tokenData.expires_in_seconds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to generate Deepgram token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
