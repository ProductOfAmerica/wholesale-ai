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
        try {
          const message = JSON.parse(data.toString());
          console.log(`Deepgram message for ${socket.id}:`, message.type);

          // Forward Deepgram messages to client
          socket.emit('deepgram_message', message);

          // Convert Deepgram transcription to our format
          if (
            message.type === 'Results' &&
            message.channel?.alternatives?.[0]?.transcript
          ) {
            const transcript = message.channel.alternatives[0].transcript;
            if (transcript.trim()) {
              const transcriptEntry: TranscriptEntry = {
                speaker: 'seller', // Assume all audio is from seller for now
                text: transcript,
                timestamp: Date.now(),
              };

              // Add to conversation history
              const history = conversationHistory.get(socket.id) || [];
              history.push(transcriptEntry);
              conversationHistory.set(socket.id, history);

              // Send transcript update to client
              socket.emit('transcript_update', transcriptEntry);

              // Run AI analysis
              if (history.length > 0) {
                analyzeConversation(history, transcript)
                  .then((analysisResult) => {
                    console.log('AI Analysis Result:', analysisResult);
                    socket.emit('ai_suggestion', analysisResult);
                  })
                  .catch((error) => {
                    console.error('AI Analysis failed:', error);
                    socket.emit('ai_suggestion', {
                      motivation_level: 5,
                      pain_points: [],
                      objection_detected: false,
                      suggested_response: 'Continue the conversation.',
                      recommended_next_move: 'Ask follow-up questions.',
                      error: 'AI analysis temporarily unavailable',
                    });
                  });
              }
            }
          }
        } catch (error) {
          console.error('Error parsing Deepgram message:', error);
        }
      });

      deepgramWS.on('error', (error: Error) => {
        console.error(`Deepgram WebSocket error for ${socket.id}:`, error);
        socket.emit('deepgram_error', { error: error.message });
      });

      deepgramWS.on('close', (code: number, reason: Buffer) => {
        console.log(
          `Deepgram WebSocket closed for ${socket.id}: ${code} ${reason}`,
        );
        deepgramConnections.delete(socket.id);
        socket.emit('deepgram_disconnected', {
          code,
          reason: reason.toString(),
        });
      });
    },
  );

  // Handle audio data forwarding to Deepgram
  socket.on('deepgram_audio', (audioData: Buffer) => {
    const deepgramWS = deepgramConnections.get(socket.id);
    if (deepgramWS && deepgramWS.readyState === WebSocket.OPEN) {
      deepgramWS.send(audioData);
    } else {
      console.warn(
        `Cannot send audio for ${socket.id}: Deepgram WebSocket not connected`,
      );
    }
  });

  // Handle text simulation for testing
  socket.on(
    'simulate_speech',
    async (data: { speaker: string; text: string }) => {
      console.log('Simulated speech:', data);

      const transcriptEntry: TranscriptEntry = {
        speaker: data.speaker,
        text: data.text,
        timestamp: Date.now(),
      };

      // Add to conversation history
      const history = conversationHistory.get(socket.id) || [];
      history.push(transcriptEntry);
      conversationHistory.set(socket.id, history);

      // Echo back as transcript_update
      socket.emit('transcript_update', transcriptEntry);

      // Run AI analysis if we have enough context (and it's a seller message)
      if (data.speaker === 'seller' && history.length > 0) {
        try {
          console.log('Running AI analysis...');
          const analysisResult = await analyzeConversation(history, data.text);
          console.log('AI Analysis Result:', analysisResult);

          socket.emit('ai_suggestion', analysisResult);
        } catch (error) {
          console.error('AI Analysis failed:', error);

          // Send fallback suggestion
          const fallbackSuggestion: AISuggestion = {
            motivation_level: 5,
            pain_points: [],
            objection_detected: false,
            suggested_response: 'Continue building rapport with the seller.',
            recommended_next_move:
              'Ask follow-up questions to understand their needs.',
            error: 'AI analysis temporarily unavailable',
          };

          socket.emit('ai_suggestion', fallbackSuggestion);
        }
      }
    },
  );

  // Handle demo conversation
  socket.on('run_demo', async () => {
    console.log(`Running demo conversation for ${socket.id}`);

    const demoMessages = [
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

    // Clear history and play demo
    conversationHistory.set(socket.id, []);

    for (let i = 0; i < demoMessages.length; i++) {
      setTimeout(async () => {
        const message = demoMessages[i];
        const transcriptEntry: TranscriptEntry = {
          speaker: message.speaker,
          text: message.text,
          timestamp: Date.now(),
        };

        const history = conversationHistory.get(socket.id) || [];
        history.push(transcriptEntry);
        conversationHistory.set(socket.id, history);

        socket.emit('transcript_update', transcriptEntry);

        // Run AI analysis for seller messages
        if (message.speaker === 'seller') {
          try {
            const analysisResult = await analyzeConversation(
              history,
              message.text,
            );
            socket.emit('ai_suggestion', analysisResult);
          } catch (error) {
            console.error('Demo AI Analysis failed:', error);
          }
        }
      }, i * 3000); // 3 second delays
    }
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
