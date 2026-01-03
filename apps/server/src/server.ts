import type { IncomingMessage } from 'node:http';
import { createServer } from 'node:http';
import type { AISuggestion, TranscriptEntry } from '@wholesale-ai/shared';
import { validateEnv } from '@wholesale-ai/shared';
import { config } from 'dotenv';
import { Server } from 'socket.io';
import { WebSocket, WebSocketServer } from 'ws';

import {
  analyzeConversation,
  clearConversationContext,
  generateCallSummary,
  streamSuggestedResponse,
  updateConversationContext,
} from './lib/ai-analysis.js';
import {
  createAudioBridge,
  removeAudioBridge,
  twilioToDeepgram,
} from './lib/audio-bridge.js';
import { endCall, initiateOutboundCall } from './lib/twilio-service.js';
import { createTwilioRouter } from './lib/twilio-webhooks.js';

config({ path: '.env.local' });

const env = validateEnv([
  'PORT',
  'FRONTEND_URL',
  'SERVER_URL',
  'DEEPGRAM_API_KEY',
  'ANTHROPIC_API_KEY',
] as const);

const port = parseInt(env.PORT, 10);
const frontendUrl = env.FRONTEND_URL.replace(/\/$/, '');
const serverUrl = env.SERVER_URL.replace(/\/$/, '');

const conversationHistory = new Map<string, TranscriptEntry[]>();
const deepgramConnections = new Map<string, WebSocket>();
const deepgramConnectionsOutbound = new Map<string, WebSocket>();
const activeCallSids = new Map<string, string>();
const pendingAudioBuffers = new Map<string, Buffer[]>();
const pendingAudioBuffersOutbound = new Map<string, Buffer[]>();
const deepgramReady = new Map<string, boolean>();
const deepgramReadyOutbound = new Map<string, boolean>();

interface FluxTurnInfo {
  type: 'TurnInfo' | 'Connected';
  event?:
    | 'Update'
    | 'StartOfTurn'
    | 'EagerEndOfTurn'
    | 'TurnResumed'
    | 'EndOfTurn';
  turn_index?: number;
  transcript?: string;
  words?: Array<{ word: string; confidence: number }>;
  end_of_turn_confidence?: number;
  request_id?: string;
  sequence_id?: number;
}

type DeepgramMessage = FluxTurnInfo;

function parseDeepgramMessage(data: Buffer): DeepgramMessage | null {
  try {
    return JSON.parse(data.toString()) as DeepgramMessage;
  } catch (error) {
    console.error('Error parsing Deepgram message:', error);
    return null;
  }
}

function extractTranscript(message: DeepgramMessage): string | null {
  if (message.type === 'TurnInfo' && message.transcript) {
    return message.transcript.trim() || null;
  }
  return null;
}

function isEndOfTurn(message: DeepgramMessage): boolean {
  return message.type === 'TurnInfo' && message.event === 'EndOfTurn';
}

function createTranscriptEntry(speaker: string, text: string): TranscriptEntry {
  return {
    speaker,
    text,
    timestamp: Date.now(),
  };
}

function updateConversationHistory(
  socketId: string,
  transcriptEntry: TranscriptEntry
): TranscriptEntry[] {
  const history = conversationHistory.get(socketId) || [];
  history.push(transcriptEntry);
  conversationHistory.set(socketId, history);
  return history;
}

async function runAIAnalysis(
  socketId: string,
  history: TranscriptEntry[],
  transcript: string
): Promise<void> {
  if (history.length === 0) return;

  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return;

  try {
    console.log('Starting streaming AI response...');

    socket.emit('ai_suggestion_start');

    const fullResponse = await streamSuggestedResponse(
      history,
      transcript,
      (token) => {
        socket.emit('ai_suggestion_token', token);
      },
      socketId
    );

    socket.emit('ai_suggestion_end', { suggested_response: fullResponse });

    analyzeConversation(history, transcript)
      .then((analysisResult) => {
        socket.emit('ai_suggestion', {
          ...analysisResult,
          suggested_response: fullResponse,
        });
      })
      .catch(console.error);

    updateConversationContext(socketId, history).catch(console.error);
  } catch (error) {
    console.error('AI Analysis failed:', error);

    const fallbackSuggestion: AISuggestion = {
      motivation_level: 5,
      pain_points: [],
      objection_detected: false,
      suggested_response: 'Continue the conversation.',
      recommended_next_move: 'Ask follow-up questions.',
      error: 'AI analysis temporarily unavailable',
    };

    socket.emit('ai_suggestion', fallbackSuggestion);
  }
}

function processTranscript(
  socketId: string,
  transcript: string,
  speaker: 'seller' | 'user' = 'seller'
): void {
  const transcriptEntry = createTranscriptEntry(speaker, transcript);
  const history = updateConversationHistory(socketId, transcriptEntry);

  const socket = io.sockets.sockets.get(socketId);
  socket?.emit('transcript_update', transcriptEntry);

  if (speaker === 'seller') {
    runAIAnalysis(socketId, history, transcript);
  }
}

function handleDeepgramMessage(
  socketId: string,
  data: Buffer,
  speaker: 'seller' | 'user'
): void {
  const message = parseDeepgramMessage(data);
  if (!message) return;

  // console.log(`Deepgram message for ${socketId} (${speaker}):`, message.type, message);

  const socket = io.sockets.sockets.get(socketId);
  socket?.emit('deepgram_message', message);

  const transcript = extractTranscript(message);
  if (transcript && isEndOfTurn(message)) {
    console.log(
      `Processing EndOfTurn transcript (${speaker}): "${transcript}"`
    );
    processTranscript(socketId, transcript, speaker);
  } else if (transcript) {
    console.log(
      `Interim transcript (${speaker}, ${message.event}): "${transcript}"`
    );
  }
}

interface DemoMessage {
  speaker: string;
  text: string;
}

const demoMessages: DemoMessage[] = [
  {
    speaker: 'seller',
    text: 'Hi, I got your letter about buying my house. What exactly are you offering?',
  },
  {
    speaker: 'user',
    text: 'Thank you for reaching out! I specialize in helping homeowners who need to sell quickly. Can you tell me about your situation?',
  },
  {
    speaker: 'seller',
    text: "We've been here 20 years but my wife's health is declining. We need to move closer to family soon.",
  },
  {
    speaker: 'user',
    text: "I understand completely. Family comes first. What's your ideal timeline for making this move?",
  },
  {
    speaker: 'seller',
    text: "The house needs some work, I know. The roof is maybe 10 years old and the kitchen hasn't been updated.",
  },
  {
    speaker: 'user',
    text: 'I appreciate your honesty. I work with properties in all conditions. Would you mind if I took a look to give you an accurate assessment?',
  },
  {
    speaker: 'seller',
    text: "That seems pretty low compared to what Zillow says it's worth. Can you do better?",
  },
];

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function processDemoMessage(
  socketId: string,
  message: DemoMessage
): Promise<void> {
  const transcriptEntry = createTranscriptEntry(message.speaker, message.text);
  const history = updateConversationHistory(socketId, transcriptEntry);

  const socket = io.sockets.sockets.get(socketId);
  socket?.emit('transcript_update', transcriptEntry);

  if (message.speaker === 'seller') {
    await runAIAnalysis(socketId, history, message.text);
  }
}

function closeDeepgramConnection(socketId: string): void {
  const deepgramWS = deepgramConnections.get(socketId);
  if (deepgramWS) {
    deepgramWS.send(JSON.stringify({ type: 'CloseStream' }));
    deepgramWS.close();
    deepgramConnections.delete(socketId);
    deepgramReady.delete(socketId);
    pendingAudioBuffers.delete(socketId);
    console.log(`Deepgram WebSocket (inbound) closed for ${socketId}`);
  }

  const deepgramWSOutbound = deepgramConnectionsOutbound.get(socketId);
  if (deepgramWSOutbound) {
    deepgramWSOutbound.send(JSON.stringify({ type: 'CloseStream' }));
    deepgramWSOutbound.close();
    deepgramConnectionsOutbound.delete(socketId);
    deepgramReadyOutbound.delete(socketId);
    pendingAudioBuffersOutbound.delete(socketId);
    console.log(`Deepgram WebSocket (outbound) closed for ${socketId}`);
  }
}

interface DeepgramConfig {
  model: string;
  encoding: string;
  sampleRate: number;
}

const deepgramReconnectAttempts = new Map<string, number>();
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

function getBackoffDelay(attempt: number): number {
  const exponentialDelay = BASE_DELAY_MS * 2 ** attempt;
  const cappedDelay = Math.min(exponentialDelay, MAX_DELAY_MS);
  const jitter = Math.random() * 0.3 * cappedDelay;
  return Math.floor(cappedDelay + jitter);
}

interface DeepgramConnectionContext {
  socket: ReturnType<typeof io.sockets.sockets.get> & {
    id: string;
    emit: (event: string, data?: unknown) => void;
  };
  config: DeepgramConfig;
  track: 'inbound' | 'outbound';
  connectionsMap: Map<string, WebSocket>;
  readyMap: Map<string, boolean>;
  buffersMap: Map<string, Buffer[]>;
  reconnectKey: string;
  speaker: 'seller' | 'user';
}

function handleDeepgramOpen(
  ctx: DeepgramConnectionContext,
  deepgramWS: WebSocket
): void {
  const { socket, track, connectionsMap, readyMap, buffersMap, reconnectKey } =
    ctx;
  console.log(`Deepgram WebSocket connected for ${socket.id} (${track})`);
  connectionsMap.set(socket.id, deepgramWS);
  readyMap.set(socket.id, true);
  deepgramReconnectAttempts.delete(reconnectKey);
  socket.emit('deepgram_connected', { track });

  const buffered = buffersMap.get(socket.id);
  if (!buffered || buffered.length === 0) return;

  console.log(
    `Flushing ${buffered.length} buffered audio packets to Deepgram (${track})`
  );
  for (const audioData of buffered) {
    deepgramWS.send(audioData);
  }
  buffersMap.delete(socket.id);
}

function handleDeepgramClose(
  ctx: DeepgramConnectionContext,
  code: number,
  reason: Buffer
): void {
  const {
    socket,
    config,
    track,
    connectionsMap,
    readyMap,
    buffersMap,
    reconnectKey,
  } = ctx;
  console.log(
    `Deepgram WebSocket closed for ${socket.id} (${track}): ${code} ${reason}`
  );
  connectionsMap.delete(socket.id);
  readyMap.delete(socket.id);
  buffersMap.delete(socket.id);

  const hasActiveCall = activeCallSids.has(socket.id);
  const attempts = deepgramReconnectAttempts.get(reconnectKey) || 0;
  const shouldReconnect = hasActiveCall && attempts < MAX_RECONNECT_ATTEMPTS;

  if (!shouldReconnect) {
    deepgramReconnectAttempts.delete(reconnectKey);
    socket.emit('deepgram_disconnected', {
      code,
      reason: reason.toString(),
      track,
    });
    return;
  }

  deepgramReconnectAttempts.set(reconnectKey, attempts + 1);
  const reconnectDelay = getBackoffDelay(attempts);
  console.log(
    `Reconnecting Deepgram for ${socket.id} (${track}), attempt ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS}, delay ${reconnectDelay}ms`
  );
  socket.emit('deepgram_reconnecting', {
    track,
    attempt: attempts + 1,
    delay: reconnectDelay,
  });

  setTimeout(() => {
    if (activeCallSids.has(socket.id)) {
      createDeepgramConnection(socket, config, track);
    }
  }, reconnectDelay);
}

function createDeepgramConnection(
  socket: ReturnType<typeof io.sockets.sockets.get> & {
    id: string;
    emit: (event: string, data?: unknown) => void;
  },
  config: DeepgramConfig,
  track: 'inbound' | 'outbound' = 'inbound'
): void {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    socket.emit('deepgram_error', { error: 'Deepgram API key not configured' });
    return;
  }

  const speaker = track === 'inbound' ? 'user' : 'seller';
  const connectionsMap =
    track === 'inbound' ? deepgramConnections : deepgramConnectionsOutbound;
  const readyMap = track === 'inbound' ? deepgramReady : deepgramReadyOutbound;
  const buffersMap =
    track === 'inbound' ? pendingAudioBuffers : pendingAudioBuffersOutbound;
  const reconnectKey = `${socket.id}-${track}`;

  console.log(
    `Starting Deepgram WebSocket for ${socket.id} (${track}/${speaker})`,
    config
  );

  const wsUrl = `wss://api.deepgram.com/v2/listen?model=${config.model}&encoding=${config.encoding}&sample_rate=${config.sampleRate}&eot_threshold=0.7&eot_timeout_ms=5000`;

  const deepgramWS = new WebSocket(wsUrl, {
    headers: { Authorization: `token ${apiKey}` },
  });

  const ctx: DeepgramConnectionContext = {
    socket,
    config,
    track,
    connectionsMap,
    readyMap,
    buffersMap,
    reconnectKey,
    speaker,
  };

  deepgramWS.on('open', () => handleDeepgramOpen(ctx, deepgramWS));

  deepgramWS.on('message', (data: Buffer) => {
    handleDeepgramMessage(socket.id, data, speaker);
  });

  deepgramWS.on('error', (error: Error) => {
    console.error(
      `Deepgram WebSocket error for ${socket.id} (${track}):`,
      error
    );
    socket.emit('deepgram_error', { error: error.message, track });
  });

  deepgramWS.on('close', (code: number, reason: Buffer) =>
    handleDeepgramClose(ctx, code, reason)
  );
}

function sendAudioToDeepgram(
  socketId: string,
  audioData: Buffer,
  track: 'inbound' | 'outbound' = 'inbound'
): void {
  const connectionsMap =
    track === 'inbound' ? deepgramConnections : deepgramConnectionsOutbound;
  const readyMap = track === 'inbound' ? deepgramReady : deepgramReadyOutbound;
  const buffersMap =
    track === 'inbound' ? pendingAudioBuffers : pendingAudioBuffersOutbound;

  const deepgramWS = connectionsMap.get(socketId);
  if (deepgramWS && deepgramWS.readyState === WebSocket.OPEN) {
    deepgramWS.send(audioData);
  } else if (connectionsMap.has(socketId) || readyMap.get(socketId) === false) {
    let buffer = buffersMap.get(socketId);
    if (!buffer) {
      buffer = [];
      buffersMap.set(socketId, buffer);
    }
    buffer.push(audioData);
    if (buffer.length === 1) {
      console.log(
        `Buffering audio for ${socketId} (${track}) until Deepgram connects...`
      );
    }
  } else {
    console.warn(
      `Cannot send audio for ${socketId} (${track}): Deepgram WebSocket not connected`
    );
  }
}

async function runDemoConversation(socketId: string): Promise<void> {
  console.log(`Running demo conversation for ${socketId}`);

  conversationHistory.set(socketId, []);

  for (const [index, message] of demoMessages.entries()) {
    if (index > 0) {
      await delay(3000);
    }
    await processDemoMessage(socketId, message);
  }
}

async function processSimulatedSpeech(
  socketId: string,
  data: { speaker: string; text: string }
): Promise<void> {
  console.log('Simulated speech:', data);

  const transcriptEntry = createTranscriptEntry(data.speaker, data.text);
  const history = updateConversationHistory(socketId, transcriptEntry);

  const socket = io.sockets.sockets.get(socketId);
  socket?.emit('transcript_update', transcriptEntry);

  if (data.speaker === 'seller' && history.length > 0) {
    await runAIAnalysis(socketId, history, data.text);
  }
}

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: [frontendUrl, 'http://localhost:3000'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

const twilioRouter = createTwilioRouter(io, serverUrl);

const wss = new WebSocketServer({ noServer: true });

httpServer.on('request', async (req, res) => {
  const url = req.url || '';
  if (url.startsWith('/socket.io')) {
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', frontendUrl);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }

  console.log(`HTTP ${req.method} ${url}`);

  const handled = await twilioRouter(req, res);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

httpServer.on('upgrade', (request: IncomingMessage, socket, head) => {
  const pathname = request.url || '';

  if (pathname.startsWith('/socket.io')) {
    return;
  }

  if (pathname.startsWith('/twilio/stream')) {
    console.log('Twilio stream WebSocket connected');
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

interface TwilioStreamState {
  streamSid: string | null;
  callSid: string | null;
  socketId: string | null;
}

function findSocketIdForCall(callSid: string): string | null {
  for (const [sid, cid] of activeCallSids.entries()) {
    if (cid === callSid) return sid;
  }
  return null;
}

function handleTwilioStreamStart(
  state: TwilioStreamState,
  message: { start: { streamSid: string; callSid: string } },
  ws: WebSocket
): void {
  state.streamSid = message.start.streamSid;
  state.callSid = message.start.callSid;
  console.log(`Stream started: ${state.streamSid}, Call: ${state.callSid}`);

  console.log('Active calls:', [...activeCallSids.entries()]);
  state.socketId = findSocketIdForCall(state.callSid);
  console.log(`Found socketId: ${state.socketId}`);

  if (!state.socketId || !state.streamSid || !state.callSid) {
    console.log('Missing state, using fallback socketId');
    state.socketId = activeCallSids.keys().next().value ?? null;
  }

  if (!state.socketId) {
    console.error('No socket found for call, cannot process audio');
    return;
  }

  const socket = io.sockets.sockets.get(state.socketId);
  socket?.emit('twilio_stream_started', {
    streamSid: state.streamSid,
    callSid: state.callSid,
  });

  const capturedSocketId = state.socketId;
  createAudioBridge(
    state.streamSid,
    state.callSid,
    ws,
    (transcript, isFinal) => {
      if (isFinal) processTranscript(capturedSocketId, transcript);
    }
  );

  deepgramReady.set(state.socketId, false);
  pendingAudioBuffers.set(state.socketId, []);
  deepgramReadyOutbound.set(state.socketId, false);
  pendingAudioBuffersOutbound.set(state.socketId, []);

  createDeepgramConnection(
    socket as Parameters<typeof createDeepgramConnection>[0],
    { model: 'flux-general-en', encoding: 'linear16', sampleRate: 16000 },
    'inbound'
  );
  createDeepgramConnection(
    socket as Parameters<typeof createDeepgramConnection>[0],
    { model: 'flux-general-en', encoding: 'linear16', sampleRate: 16000 },
    'outbound'
  );
}

let mediaPacketCount = 0;

function handleTwilioStreamMedia(
  state: TwilioStreamState,
  payload: string,
  track: 'inbound' | 'outbound'
): void {
  if (!state.socketId) return;
  const audioData = twilioToDeepgram(payload);

  mediaPacketCount++;
  if (mediaPacketCount % 100 === 0) {
    console.log(
      `Processed ${mediaPacketCount} audio packets (${track}), sending to Deepgram...`
    );
  }

  sendAudioToDeepgram(state.socketId, audioData, track);

  const socket = io.sockets.sockets.get(state.socketId);
  socket?.emit('twilio_audio_in', audioData);
}

function handleTwilioStreamStop(state: TwilioStreamState): void {
  console.log('Twilio stream stopped');
  if (state.streamSid) removeAudioBridge(state.streamSid);
  if (state.socketId) {
    closeDeepgramConnection(state.socketId);
    const socket = io.sockets.sockets.get(state.socketId);
    socket?.emit('twilio_stream_stopped');
  }
}

function cleanupTwilioStream(state: TwilioStreamState): void {
  console.log('Twilio media stream disconnected');
  if (state.streamSid) removeAudioBridge(state.streamSid);
  if (state.socketId) closeDeepgramConnection(state.socketId);
}

interface TwilioMessage {
  event: string;
  start?: { streamSid: string; callSid: string };
  media?: { payload: string; track: string };
}

function routeTwilioMessage(
  state: TwilioStreamState,
  message: TwilioMessage,
  ws: WebSocket
): void {
  switch (message.event) {
    case 'connected':
      console.log('Twilio stream connected:', message);
      break;
    case 'start':
      handleTwilioStreamStart(
        state,
        message as TwilioMessage & {
          start: { streamSid: string; callSid: string };
        },
        ws
      );
      break;
    case 'media': {
      if (!message.media?.payload) break;
      const track = message.media.track === 'outbound' ? 'outbound' : 'inbound';
      handleTwilioStreamMedia(state, message.media.payload, track);
      break;
    }
    case 'stop':
      handleTwilioStreamStop(state);
      break;
    default:
      console.log('Unknown Twilio event:', message.event);
  }
}

wss.on('connection', (ws: WebSocket, _request: IncomingMessage) => {
  console.log('Twilio media stream connected');

  const state: TwilioStreamState = {
    streamSid: null,
    callSid: null,
    socketId: activeCallSids.keys().next().value ?? null,
  };

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString()) as TwilioMessage;
      routeTwilioMessage(state, message, ws);
    } catch (error) {
      console.error('Error processing Twilio message:', error);
    }
  });

  ws.on('close', () => cleanupTwilioStream(state));

  ws.on('error', (error) => {
    console.error('Twilio WebSocket error:', error);
  });
});

type SocketType = Parameters<Parameters<typeof io.on>[1]>[0];

function handleStartCall(socket: SocketType): void {
  console.log(`Call started by ${socket.id}`);
  conversationHistory.set(socket.id, []);
  socket.emit('connection_ready');
}

function handleEndCall(socket: SocketType): void {
  console.log(`Call ended by ${socket.id}`);
  closeDeepgramConnection(socket.id);
}

function handleWebRTCCallStarted(
  socket: SocketType,
  data: { callSid: string; phoneNumber: string }
): void {
  console.log(`WebRTC call started: ${data.callSid} for socket ${socket.id}`);
  activeCallSids.set(socket.id, data.callSid);
  conversationHistory.set(socket.id, []);
}

async function handleTwilioCallStart(
  socket: SocketType,
  data: { phoneNumber: string }
): Promise<void> {
  console.log('Starting Twilio call...');

  if (serverUrl.includes('localhost')) {
    socket.emit('twilio_error', {
      error:
        'Cannot make calls with localhost. Set SERVER_URL to your ngrok/public URL (e.g., https://abc123.ngrok.io)',
    });
    return;
  }

  try {
    const wsProtocol = serverUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = serverUrl.replace(/^https?:\/\//, '');
    const streamUrl = `${wsProtocol}://${wsHost}/twilio/stream`;
    const statusCallbackUrl = `${serverUrl}/twilio/status`;

    const result = await initiateOutboundCall({
      to: data.phoneNumber,
      streamUrl,
      statusCallbackUrl,
    });

    activeCallSids.set(socket.id, result.callSid);
    conversationHistory.set(socket.id, []);

    deepgramReadyOutbound.set(socket.id, false);
    pendingAudioBuffersOutbound.set(socket.id, []);
    createDeepgramConnection(
      socket as Parameters<typeof createDeepgramConnection>[0],
      { model: 'flux-general-en', encoding: 'linear16', sampleRate: 16000 },
      'outbound'
    );

    socket
      .timeout(5000)
      .emit(
        'twilio_call_initiated',
        { callSid: result.callSid, status: result.status },
        (err: Error | null) => {
          if (err) {
            console.warn(
              `Client did not acknowledge twilio_call_initiated: ${err.message}`
            );
          }
        }
      );

    console.log(`Call initiated: ${result.callSid}`);
  } catch (error) {
    console.error('Failed to initiate call:', error);
    socket.emit('twilio_error', {
      error: error instanceof Error ? error.message : 'Failed to start call',
    });
  }
}

async function handleTwilioCallEnd(
  socket: SocketType,
  data: { callSid: string }
): Promise<void> {
  console.log(`Ending Twilio call: ${data.callSid}`);

  try {
    await endCall(data.callSid);
    activeCallSids.delete(socket.id);
    closeDeepgramConnection(socket.id);

    socket
      .timeout(5000)
      .emit(
        'twilio_call_ended',
        { callSid: data.callSid },
        (err: Error | null) => {
          if (err) {
            console.warn(
              `Client did not acknowledge twilio_call_ended: ${err.message}`
            );
          }
        }
      );
  } catch (error) {
    console.error('Failed to end call:', error);
    socket.emit('twilio_error', {
      error: error instanceof Error ? error.message : 'Failed to end call',
    });
  }
}

async function handleRequestCallSummary(
  socket: SocketType,
  data: { duration: number }
): Promise<void> {
  console.log(`Generating call summary for ${socket.id}`);
  const history = conversationHistory.get(socket.id) || [];

  if (history.length === 0) {
    socket.emit('call_summary', {
      duration: data.duration,
      final_motivation_level: 0,
      pain_points: [],
      objections: [],
      summary: 'No conversation recorded.',
      next_steps: 'Try making another call.',
    });
    return;
  }

  try {
    const summary = await generateCallSummary(history, data.duration);
    socket.emit('call_summary', summary);
  } catch (error) {
    console.error('Failed to generate summary:', error);
    socket.emit('call_summary', {
      duration: data.duration,
      final_motivation_level: 5,
      pain_points: [],
      objections: [],
      summary: 'Failed to generate summary.',
      next_steps: 'Follow up with the seller.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function handleDisconnect(socket: SocketType, reason: string): void {
  console.log(`Client disconnected: ${socket.id} (${reason})`);

  const callSid = activeCallSids.get(socket.id);
  if (callSid) {
    endCall(callSid).catch(console.error);
    activeCallSids.delete(socket.id);
  }

  clearConversationContext(socket.id);
  closeDeepgramConnection(socket.id);
  conversationHistory.delete(socket.id);
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  conversationHistory.set(socket.id, []);

  socket.on('start_call', () => handleStartCall(socket));
  socket.on('end_call', () => handleEndCall(socket));
  socket.on('deepgram_connect', (config: DeepgramConfig) =>
    createDeepgramConnection(socket, config)
  );
  socket.on('deepgram_audio', (audioData: Buffer) =>
    sendAudioToDeepgram(socket.id, audioData)
  );
  socket.on('webrtc_call_started', (data) =>
    handleWebRTCCallStarted(socket, data)
  );
  socket.on('twilio_call_start', (data) => handleTwilioCallStart(socket, data));
  socket.on('twilio_call_end', (data) => handleTwilioCallEnd(socket, data));
  socket.on('simulate_speech', (data) =>
    processSimulatedSpeech(socket.id, data)
  );
  socket.on('run_demo', () => runDemoConversation(socket.id));
  socket.on('request_call_summary', (data) =>
    handleRequestCallSummary(socket, data)
  );
  socket.on('disconnect', (reason) => handleDisconnect(socket, reason));
});

function gracefulShutdown(signal: string): void {
  console.log(`${signal} received, shutting down gracefully...`);

  for (const [socketId] of deepgramConnections) {
    closeDeepgramConnection(socketId);
  }

  io.close(() => {
    console.log('Socket.io server closed');
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV === 'production') {
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
  });
}

httpServer.listen(port, () => {
  console.log(`> Socket.io server ready on http://localhost:${port}`);
  console.log(`> Accepting connections from: ${frontendUrl}`);
  console.log(`> Twilio webhooks at: ${serverUrl}/twilio/voice`);
  console.log(`> Twilio stream at: ws://localhost:${port}/twilio/stream`);
});
