# Wholesale AI - Negotiation Copilot

Real-time AI-powered negotiation assistance for wholesale buyers, built with Next.js 16 and Socket.io in a Turborepo monorepo.

## 🏗️ Project Structure

```
wholesale-ai-negotiation-copilot/
├── apps/
│   ├── web/          # Next.js 16 frontend (port 3000)
│   └── server/       # Socket.io server (port 3001)
├── packages/
│   ├── shared/       # Shared types and utilities
│   ├── typescript-config/  # Shared TypeScript configs
│   └── eslint-config/      # Shared ESLint configs
└── ...
```

## ✨ Features

✅ **Real-time Transcription** - Live speech-to-text with speaker identification
✅ **AI Analysis Engine** - OpenAI-powered conversation analysis and strategic insights  
✅ **Motivation Scoring** - Real-time motivation level tracking (1-10)
✅ **Objection Detection** - Automatic identification and classification of seller objections
✅ **Strategic Suggestions** - AI-generated response recommendations and next moves
✅ **Demo Mode** - Simulated conversation for testing and training
✅ **Text Simulation** - Manual text input for development and testing

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Socket.io, TypeScript
- **AI**: OpenAI GPT-4o-mini, Deepgram (optional)
- **Build**: Turborepo, pnpm workspaces
- **Deploy**: Railway

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Start development servers**
   ```bash
   # Start both apps in parallel
   pnpm dev
   
   # Or start individually
   pnpm dev:web     # Next.js app on :3000
   pnpm dev:server  # Socket.io server on :3001
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - Call interface: http://localhost:3000/call
   - Test page: http://localhost:3000/test

### 4. Run Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

## Usage Guide

### Text Simulation Mode

1. Navigate to `/call` page
2. Select speaker (Seller/You)
3. Type message and click Send
4. AI analysis appears automatically for seller messages
5. Use "Run Demo" for full conversation simulation

### Demo Conversation

Click "Run Demo" to see a realistic wholesale negotiation conversation with:
- Seller motivation progression (health issues, timeline pressure)
- Pain points identification (property condition, financial needs)
- Objection handling (price concerns)
- Strategic response suggestions

### AI Analysis Features

- **Motivation Level**: 1-10 scale with color-coded gauge
- **Pain Points**: Identified seller pressures and concerns  
- **Objection Detection**: Automatic classification (price, timeline, trust, etc.)
- **Suggested Response**: AI-generated responses under 200 characters
- **Next Move**: Strategic recommendations for next steps

## API Reference

### Socket.io Events

**Client → Server:**
- `start_call` - Initialize new conversation
- `simulate_speech` - Send text message `{ speaker, text }`
- `run_demo` - Start demo conversation

**Server → Client:**
- `transcript_update` - New message `{ speaker, text, timestamp }`
- `ai_suggestion` - AI analysis `{ motivation_level, pain_points, objection_detected, suggested_response, recommended_next_move }`

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Next.js App   │◄───┤  Socket.io   │◄───┤  Server.js  │
│   (Call Page)   │    │   Client     │    │   Custom    │
└─────────────────┘    └──────────────┘    └─────────────┘
                                                   │
                                           ┌───────▼──────┐
                                           │ AI Analysis  │
                                           │  (OpenAI)    │
                                           └──────────────┘
```

## Testing

- **Unit Tests**: 13 tests covering transcription, AI analysis, and components
- **Mocking**: Complete mocking of external APIs (OpenAI, Deepgram)
- **TDD Approach**: Tests written first, then implementation
- **Coverage**: Core business logic and error handling

## Deployment

### Railway Deployment

1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway auto-detects Node.js and uses `npm start`

### Environment Variables for Production

```bash
OPENAI_API_KEY=your-production-openai-key
DEEPGRAM_API_KEY=your-production-deepgram-key
NODE_ENV=production
FRONTEND_URL=https://your-app.railway.app
```

## Development Notes

- **ES Modules**: Uses ES import/export syntax throughout
- **Type Safety**: TypeScript interfaces for all data structures
- **Error Handling**: Graceful fallbacks for API failures
- **Performance**: Efficient state management and real-time updates
- **Scalability**: Socket.io per-connection conversation history

## Next Steps

1. **Twilio Integration** - Live phone call transcription
2. **Deepgram Integration** - Replace text simulation with real speech
3. **CRM Integration** - Save conversations and analytics
4. **Advanced AI** - Multi-turn conversation context and memory
5. **Mobile App** - React Native companion app

## License

MIT License - Built for real estate wholesale professionals.