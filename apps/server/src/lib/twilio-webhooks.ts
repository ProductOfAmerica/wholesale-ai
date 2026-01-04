import type { IncomingMessage, ServerResponse } from 'node:http';
import { parse as parseUrl } from 'node:url';
import type { Server as SocketIOServer } from 'socket.io';
import type { AIService, StreamCallSummaryCallbacks } from './ai-analysis.js';
import type { TwilioService } from './twilio-service.js';

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

function handleVoiceWebhook(
  _req: IncomingMessage,
  res: ServerResponse,
  query: Record<string, string | string[] | undefined>,
  twilioService: TwilioService
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
  const twiml = twilioService.generateStreamTwiML(streamUrl);
  console.log('Returning TwiML:', twiml);

  res.writeHead(200, { 'Content-Type': 'application/xml' });
  res.end(twiml);
}

async function handleStatusCallback(
  req: IncomingMessage,
  res: ServerResponse,
  io: SocketIOServer
): Promise<void> {
  try {
    const body = await getRequestBody(req);
    const params = parseFormBody(body);

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

function handleTokenRequest(
  _req: IncomingMessage,
  res: ServerResponse,
  twilioService: TwilioService
): void {
  try {
    const identity = `user-${Date.now()}`;
    const token = twilioService.generateAccessToken(identity);

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

async function handleVoiceClientWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  serverUrl: string,
  twilioService: TwilioService
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

    const twiml = twilioService.generateClientTwiML(to, streamUrl);
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
  res: ServerResponse,
  aiService: AIService
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
      `Generating call summary via SSE (${transcript.length} entries)`
    );

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const callbacks: StreamCallSummaryCallbacks = {
      onSummaryStart: () => {
        res.write('event: summary_start\ndata: {}\n\n');
      },
      onSummaryToken: (token) => {
        res.write(`event: summary_token\ndata: ${JSON.stringify(token)}\n\n`);
      },
      onSummaryEnd: () => {
        res.write('event: summary_end\ndata: {}\n\n');
      },
      onStructuredData: (data) => {
        res.write(`event: structured_data\ndata: ${JSON.stringify(data)}\n\n`);
      },
    };

    const summary = await aiService.streamCallSummary(
      transcript,
      duration || 0,
      callbacks
    );

    res.write(`event: done\ndata: ${JSON.stringify(summary)}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error generating summary:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate summary',
        })
      );
    } else {
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate summary' })}\n\n`
      );
      res.end();
    }
  }
}

async function handleEndCallRequest(
  req: IncomingMessage,
  res: ServerResponse,
  twilioService: TwilioService
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
    await twilioService.endCall(callSid);

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

interface RouteContext {
  io: SocketIOServer;
  serverUrl: string;
  query: Record<string, string | string[] | undefined>;
  twilioService: TwilioService;
  aiService: AIService;
}

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  ctx: RouteContext
) => void | Promise<void>;

interface Route {
  path: string;
  methods: string[];
  handler: RouteHandler;
}

const routes: Route[] = [
  {
    path: '/twilio/token',
    methods: ['GET'],
    handler: (req, res, ctx) => handleTokenRequest(req, res, ctx.twilioService),
  },
  {
    path: '/twilio/voice',
    methods: ['POST'],
    handler: (req, res, ctx) =>
      handleVoiceWebhook(req, res, ctx.query, ctx.twilioService),
  },
  {
    path: '/twilio/voice-client',
    methods: ['POST'],
    handler: (req, res, ctx) =>
      handleVoiceClientWebhook(req, res, ctx.serverUrl, ctx.twilioService),
  },
  {
    path: '/twilio/status',
    methods: ['POST'],
    handler: (req, res, ctx) => handleStatusCallback(req, res, ctx.io),
  },
  {
    path: '/twilio/summary',
    methods: ['POST', 'OPTIONS'],
    handler: (req, res, ctx) => handleSummaryRequest(req, res, ctx.aiService),
  },
  {
    path: '/twilio/end-call',
    methods: ['POST', 'OPTIONS'],
    handler: (req, res, ctx) =>
      handleEndCallRequest(req, res, ctx.twilioService),
  },
];

export interface TwilioRouterDeps {
  io: SocketIOServer;
  serverUrl: string;
  twilioService: TwilioService;
  aiService: AIService;
}

export function createTwilioRouter(deps: TwilioRouterDeps) {
  const { io, serverUrl, twilioService, aiService } = deps;

  return async (
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> => {
    const parsed = parseUrl(req.url || '', true);
    const pathname = parsed.pathname || '';

    if (!pathname.startsWith('/twilio')) {
      return false;
    }

    const route = routes.find(
      (r) => r.path === pathname && r.methods.includes(req.method || '')
    );

    if (!route) {
      return false;
    }

    await route.handler(req, res, {
      io,
      serverUrl,
      query: parsed.query,
      twilioService,
      aiService,
    });
    return true;
  };
}
