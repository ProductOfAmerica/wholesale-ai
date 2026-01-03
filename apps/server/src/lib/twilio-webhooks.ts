import type { IncomingMessage, ServerResponse } from 'node:http';
import { parse as parseUrl } from 'node:url';
import type { Server as SocketIOServer } from 'socket.io';
import { generateCallSummary } from './ai-analysis.js';
import {
  endCall,
  generateAccessToken,
  generateClientTwiML,
  generateStreamTwiML,
} from './twilio-service.js';

function parseFormBody(body: string): Record<string, string> {
  const params: Record<string, string> = {};
  const pairs = body.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }
  return params;
}

async function getRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export function handleVoiceWebhook(
  _req: IncomingMessage,
  res: ServerResponse,
  query: Record<string, string | string[] | undefined>
): void {
  console.log('Twilio voice webhook hit!', query);
  const streamUrl = query.streamUrl as string;

  if (!streamUrl) {
    console.error('Missing streamUrl parameter');
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Missing streamUrl parameter');
    return;
  }

  console.log('Stream URL received:', streamUrl);
  const twiml = generateStreamTwiML(streamUrl);
  console.log('Returning TwiML:', twiml);

  res.writeHead(200, { 'Content-Type': 'application/xml' });
  res.end(twiml);
}

export async function handleStatusCallback(
  req: IncomingMessage,
  res: ServerResponse,
  io: SocketIOServer
): Promise<void> {
  try {
    const body = await getRequestBody(req);
    const params = parseFormBody(body);

    // Skip signature validation when using tunnels (Cloudflare/ngrok modify requests)
    // In production with direct Twilio access, re-enable this
    // const signature = req.headers['x-twilio-signature'] as string;
    // const protocol = req.headers['x-forwarded-proto'] || 'http';
    // const host = req.headers.host || 'localhost';
    // const fullUrl = `${protocol}://${host}${req.url}`;
    // if (signature && !validateTwilioRequest(signature, fullUrl, params)) {
    //   console.warn('Invalid Twilio signature');
    // }

    const callSid = params.CallSid;
    const callStatus = params.CallStatus;
    const duration = params.CallDuration;
    const answeredBy = params.AnsweredBy;
    const errorCode = params.ErrorCode;
    const errorMessage = params.ErrorMessage;

    console.log(`Call ${callSid} status: ${callStatus}`);
    if (answeredBy) console.log(`  Answered by: ${answeredBy}`);
    if (errorCode) console.log(`  Error: ${errorCode} - ${errorMessage}`);

    io.emit('twilio_call_status', {
      callSid,
      status: callStatus,
      duration: duration ? parseInt(duration, 10) : undefined,
    });

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } catch (error) {
    console.error('Error handling status callback:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

export function handleTokenRequest(
  _req: IncomingMessage,
  res: ServerResponse
): void {
  try {
    const identity = `user-${Date.now()}`;
    const token = generateAccessToken(identity);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ token, identity }));
  } catch (error) {
    console.error('Error generating token:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to generate token' }));
  }
}

export async function handleVoiceClientWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  serverUrl: string
): Promise<void> {
  try {
    const body = await getRequestBody(req);
    const params = parseFormBody(body);

    const to = params.To;
    console.log('Voice client webhook - Dialing:', to);

    if (!to) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing To parameter');
      return;
    }

    const wsProtocol = serverUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = serverUrl.replace(/^https?:\/\//, '');
    const streamUrl = `${wsProtocol}://${wsHost}/twilio/stream`;

    const twiml = generateClientTwiML(to, streamUrl);
    console.log('Returning TwiML for client call:', twiml);

    res.writeHead(200, { 'Content-Type': 'application/xml' });
    res.end(twiml);
  } catch (error) {
    console.error('Error handling voice client webhook:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

async function handleSummaryRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { transcript, duration } = JSON.parse(body);

    if (!transcript || !Array.isArray(transcript)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing or invalid transcript' }));
      return;
    }

    console.log(
      `Generating call summary via REST (${transcript.length} entries)`
    );
    const summary = await generateCallSummary(transcript, duration || 0);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(summary));
  } catch (error) {
    console.error('Error generating summary:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Failed to generate summary',
      })
    );
  }
}

async function handleEndCallRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { callSid } = JSON.parse(body);

    if (!callSid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing callSid' }));
      return;
    }

    console.log(`Ending orphaned call via REST: ${callSid}`);
    await endCall(callSid);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('Error ending call:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to end call',
      })
    );
  }
}

export function createTwilioRouter(io: SocketIOServer, serverUrl: string) {
  return async (
    req: IncomingMessage,
    res: ServerResponse
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: webhook router has many routes
  ): Promise<boolean> => {
    const parsed = parseUrl(req.url || '', true);
    const pathname = parsed.pathname || '';

    if (!pathname.startsWith('/twilio')) {
      return false;
    }

    if (pathname === '/twilio/token' && req.method === 'GET') {
      handleTokenRequest(req, res);
      return true;
    }

    if (pathname === '/twilio/voice' && req.method === 'POST') {
      handleVoiceWebhook(req, res, parsed.query);
      return true;
    }

    if (pathname === '/twilio/voice-client' && req.method === 'POST') {
      await handleVoiceClientWebhook(req, res, serverUrl);
      return true;
    }

    if (pathname === '/twilio/status' && req.method === 'POST') {
      await handleStatusCallback(req, res, io);
      return true;
    }

    if (
      pathname === '/twilio/summary' &&
      (req.method === 'POST' || req.method === 'OPTIONS')
    ) {
      await handleSummaryRequest(req, res);
      return true;
    }

    if (
      pathname === '/twilio/end-call' &&
      (req.method === 'POST' || req.method === 'OPTIONS')
    ) {
      await handleEndCallRequest(req, res);
      return true;
    }

    return false;
  };
}
