import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { analyzeConversation } from './lib/ai-analysis.js';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io with CORS configuration
  const io = new Server(server, {
    cors: {
      origin: dev ? ["http://localhost:3000"] : [process.env.FRONTEND_URL],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Store conversation history per socket
  const conversationHistory = new Map();

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
      // Keep history until socket disconnects
    });

    // Handle text simulation for testing
    socket.on('simulate_speech', async (data) => {
      console.log('Simulated speech:', data);
      
      const transcriptEntry = {
        speaker: data.speaker,
        text: data.text,
        timestamp: Date.now()
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
          socket.emit('ai_suggestion', {
            motivation_level: 5,
            pain_points: [],
            objection_detected: false,
            suggested_response: 'Continue building rapport with the seller.',
            recommended_next_move: 'Ask follow-up questions to understand their needs.',
            error: 'AI analysis temporarily unavailable'
          });
        }
      }
    });

    // Handle demo conversation
    socket.on('run_demo', async () => {
      console.log(`Running demo conversation for ${socket.id}`);
      
      const demoMessages = [
        { speaker: 'seller', text: "Hi, I got your letter about buying my house. What exactly are you offering?" },
        { speaker: 'user', text: "Thank you for reaching out! I specialize in helping homeowners who need to sell quickly. Can you tell me about your situation?" },
        { speaker: 'seller', text: "We've been here 20 years but my wife's health is declining. We need to move closer to family soon." },
        { speaker: 'user', text: "I understand completely. Family comes first. What's your ideal timeline for making this move?" },
        { speaker: 'seller', text: "The house needs some work, I know. The roof is maybe 10 years old and the kitchen hasn't been updated." },
        { speaker: 'user', text: "I appreciate your honesty. I work with properties in all conditions. Would you mind if I took a look to give you an accurate assessment?" },
        { speaker: 'seller', text: "That seems pretty low compared to what Zillow says it's worth. Can you do better?" },
      ];

      // Clear history and play demo
      conversationHistory.set(socket.id, []);
      
      for (let i = 0; i < demoMessages.length; i++) {
        setTimeout(async () => {
          const message = demoMessages[i];
          const transcriptEntry = {
            speaker: message.speaker,
            text: message.text,
            timestamp: Date.now()
          };

          const history = conversationHistory.get(socket.id) || [];
          history.push(transcriptEntry);
          conversationHistory.set(socket.id, history);

          socket.emit('transcript_update', transcriptEntry);

          // Run AI analysis for seller messages
          if (message.speaker === 'seller') {
            try {
              const analysisResult = await analyzeConversation(history, message.text);
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
      // Clean up conversation history
      conversationHistory.delete(socket.id);
    });
  });

  // Production error handling
  if (!dev) {
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      process.exit(1);
    });

    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection:', err);
      process.exit(1);
    });
  }

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
    console.log(`> Socket.io server initialized`);
  });
});