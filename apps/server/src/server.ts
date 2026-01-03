import { createServer } from 'node:http';
import type { AISuggestion, TranscriptEntry } from '@wholesale-ai/shared';
import { config } from 'dotenv';
import { Server } from 'socket.io';
import { WebSocket } from 'ws';

import { analyzeConversation } from './lib/ai-analysis.js';

// Load environment variables from local .env.local file
config({ path: '.env.local' });

const port = parseInt(process.env.PORT || '3001', 10);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Create HTTP server
const httpServer = createServer();

// Initialize Socket.io with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: [frontendUrl, 'http://localhost:3000'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Store conversation history per socket
const conversationHistory = new Map<string, TranscriptEntry[]>();

// Store Deepgram WebSocket connections per socket
const deepgramConnections = new Map<string, WebSocket>();

// Helper functions for message processing
interface DeepgramMessage {
  type: string;
  channel?: {
    alternatives?: Array<{
      transcript: string;
    }>;
  };
}

function parseDeepgramMessage(data: Buffer): DeepgramMessage | null {
  try {
    return JSON.parse(data.toString()) as DeepgramMessage;
  } catch (error) {
    console.error('Error parsing Deepgram message:', error);
    return null;
  }
}

function extractTranscript(message: DeepgramMessage): string | null {
  if (
    message.type === 'Results' &&
    message.channel?.alternatives?.[0]?.transcript
  ) {
    const transcript = message.channel.alternatives[0].transcript.trim();
    return transcript || null;
  }
  return null;
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

  try {
    console.log('Running AI analysis...');
    const analysisResult = await analyzeConversation(history, transcript);
    console.log('AI Analysis Result:', analysisResult);

    const socket = io.sockets.sockets.get(socketId);
    socket?.emit('ai_suggestion', analysisResult);
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

    const socket = io.sockets.sockets.get(socketId);
    socket?.emit('ai_suggestion', fallbackSuggestion);
  }
}

function processTranscript(socketId: string, transcript: string): void {
  const transcriptEntry = createTranscriptEntry('seller', transcript);
  const history = updateConversationHistory(socketId, transcriptEntry);

  const socket = io.sockets.sockets.get(socketId);
  socket?.emit('transcript_update', transcriptEntry);

  // Run AI analysis asynchronously
  runAIAnalysis(socketId, history, transcript);
}

function handleDeepgramMessage(socketId: string, data: Buffer): void {
  const message = parseDeepgramMessage(data);
  if (!message) return;

  console.log(`Deepgram message for ${socketId}:`, message.type);

  // Forward Deepgram messages to client
  const socket = io.sockets.sockets.get(socketId);
  socket?.emit('deepgram_message', message);

  // Process transcript if available
  const transcript = extractTranscript(message);
  if (transcript) {
    processTranscript(socketId, transcript);
  }
}

// Demo conversation utilities
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

  // Run AI analysis for seller messages
  if (message.speaker === 'seller') {
    await runAIAnalysis(socketId, history, message.text);
  }
}

async function runDemoConversation(socketId: string): Promise<void> {
  console.log(`Running demo conversation for ${socketId}`);

  // Clear history and start demo
  conversationHistory.set(socketId, []);

  for (const [index, message] of demoMessages.entries()) {
    if (index > 0) {
      await delay(3000); // 3 second delays between messages
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

  // Run AI analysis if it's a seller message and we have context
  if (data.speaker === 'seller' && history.length > 0) {
    await runAIAnalysis(socketId, history, data.text);
  }
}

// Socket.io event handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Initialize conversation history for this socket
  conversationHistory.set(socket.id, []);

  // Handle call control events
  socket.on('start_call', () => {
    console.log(`Call started by ${socket.id}`);
    // Clear conversation history when starting new call
    conversationHistory.set(socket.id, []);
    socket.emit('connection_ready');
  });

  socket.on('end_call', () => {
    console.log(`Call ended by ${socket.id}`);
    // Close Deepgram connection if exists
    const deepgramWS = deepgramConnections.get(socket.id);
    if (deepgramWS) {
      deepgramWS.send(JSON.stringify({ type: 'CloseStream' }));
      deepgramWS.close();
      deepgramConnections.delete(socket.id);
      console.log(`Deepgram WebSocket closed for ${socket.id}`);
    }
  });

  // Handle Deepgram WebSocket connection
  socket.on(
    'deepgram_connect',
    (config: { model: string; encoding: string; sampleRate: number }) => {
      const apiKey = process.env.DEEPGRAM_API_KEY;
      if (!apiKey) {
        socket.emit('deepgram_error', {
          error: 'Deepgram API key not configured',
        });
        return;
      }

      console.log(`Starting Deepgram WebSocket for ${socket.id}`, config);

      const wsUrl = `wss://api.deepgram.com/v2/listen?model=${config.model}&encoding=${config.encoding}&sample_rate=${config.sampleRate}`;

      const deepgramWS = new WebSocket(wsUrl, {
        headers: {
          Authorization: `token ${apiKey}`,
        },
      });

      deepgramWS.on('open', () => {
        console.log(`Deepgram WebSocket connected for ${socket.id}`);
        deepgramConnections.set(socket.id, deepgramWS);
        socket.emit('deepgram_connected');
      });

      deepgramWS.on('message', (data: Buffer) => {
        handleDeepgramMessage(socket.id, data);
      });

      deepgramWS.on('error', (error: Error) => {
        console.error(`Deepgram WebSocket error for ${socket.id}:`, error);
        socket.emit('deepgram_error', { error: error.message });
      });

      deepgramWS.on('close', (code: number, reason: Buffer) => {
        console.log(
          `Deepgram WebSocket closed for ${socket.id}: ${code} ${reason}`
        );
        deepgramConnections.delete(socket.id);
        socket.emit('deepgram_disconnected', {
          code,
          reason: reason.toString(),
        });
      });
    }
  );

  // Handle audio data forwarding to Deepgram
  socket.on('deepgram_audio', (audioData: Buffer) => {
    const deepgramWS = deepgramConnections.get(socket.id);
    if (deepgramWS && deepgramWS.readyState === WebSocket.OPEN) {
      deepgramWS.send(audioData);
    } else {
      console.warn(
        `Cannot send audio for ${socket.id}: Deepgram WebSocket not connected`
      );
    }
  });

  // Handle text simulation for testing
  socket.on('simulate_speech', (data: { speaker: string; text: string }) => {
    processSimulatedSpeech(socket.id, data);
  });

  // Handle demo conversation
  socket.on('run_demo', () => {
    runDemoConversation(socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id} (${reason})`);

    // Clean up Deepgram connection
    const deepgramWS = deepgramConnections.get(socket.id);
    if (deepgramWS) {
      deepgramWS.send(JSON.stringify({ type: 'CloseStream' }));
      deepgramWS.close();
      deepgramConnections.delete(socket.id);
      console.log(`Cleaned up Deepgram WebSocket for ${socket.id}`);
    }

    // Clean up conversation history
    conversationHistory.delete(socket.id);
  });
});

// Production error handling
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
});
