import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// Cached token generation function
const getCachedToken = unstable_cache(
  async () => {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

    if (!deepgramApiKey) {
      throw new Error('Deepgram API key not configured');
    }

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
      throw new Error(`Failed to generate Deepgram token: ${errorText}`);
    }

    const tokenData = await response.json();
    return {
      token: tokenData.token,
      expires_in_seconds: tokenData.expires_in_seconds,
    };
  },
  ['deepgram-token'],
  {
    revalidate: 240, // Cache for 4 minutes (20 seconds before token expires)
    tags: ['deepgram-token'],
  }
);

export async function POST() {
  try {
    const tokenData = await getCachedToken();
    return NextResponse.json(tokenData);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to generate Deepgram token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
