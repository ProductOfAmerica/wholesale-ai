# Wholesale AI - Real-time Negotiation Copilot

A real-time AI-powered negotiation copilot for real estate wholesalers using Next.js 16, Socket.io, Deepgram transcription, and OpenAI analysis.

## Features

✅ **Real-time Transcription** - Live speech-to-text with speaker identification
✅ **AI Analysis Engine** - OpenAI-powered conversation analysis and strategic insights  
✅ **Motivation Scoring** - Real-time motivation level tracking (1-10)
✅ **Objection Detection** - Automatic identification and classification of seller objections
✅ **Strategic Suggestions** - AI-generated response recommendations and next moves
✅ **Demo Mode** - Simulated conversation for testing and training
✅ **Text Simulation** - Manual text input for development and testing

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Custom Node.js server with Socket.io
- **AI Services**: OpenAI GPT-4o-mini with structured output
- **Transcription**: Deepgram real-time streaming (ready for integration)
- **Testing**: Vitest with comprehensive test coverage
- **Deployment**: Railway

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file:

```bash
# Required for AI analysis
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional - for real phone call transcription
DEEPGRAM_API_KEY=your-deepgram-api-key-here

# Optional - for live phone calls
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Server config
PORT=3000
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/call](http://localhost:3000/call) to access the call interface.

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