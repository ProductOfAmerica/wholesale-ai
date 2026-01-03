import { NextResponse } from 'next/server';

export async function GET() {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

  if (!deepgramApiKey) {
    return NextResponse.json(
      { error: 'Deepgram API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Test the API key with a simple request to Deepgram's usage endpoint
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: 'Deepgram API key validation failed',
          status: response.status,
          details: errorText,
          keyPrefix: `${deepgramApiKey.substring(0, 10)}...`,
        },
        { status: 400 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      message: 'Deepgram API key is valid',
      keyPrefix: `${deepgramApiKey.substring(0, 10)}...`,
      projects: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to validate Deepgram API key',
        details: error instanceof Error ? error.message : 'Unknown error',
        keyPrefix: `${deepgramApiKey.substring(0, 10)}...`,
      },
      { status: 500 }
    );
  }
}
