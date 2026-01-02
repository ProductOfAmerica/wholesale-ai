# Data Flow Architecture

## High-Level System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   Browser       │    │   Custom Server  │    │  External APIs  │
│   Client        │◄──►│   (Next.js +     │◄──►│                 │
│                 │    │    Socket.io)    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Detailed Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Browser Client                                 │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ Call Interface  │  │ Live Transcript │  │ AI Suggestions  │            │
│  │ (call/page.tsx) │  │   Component     │  │   Component     │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│           │                     │                     │                    │
│           └─────────────────────┼─────────────────────┘                    │
│                                 │                                          │
│                    ┌─────────────────┐                                     │
│                    │ Socket.io Client│                                     │
│                    │ (useSocket hook)│                                     │
│                    └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ WebSocket Connection
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Custom Server                                 │
│                             (server.js)                                    │
│                                                                             │
│  ┌─────────────────┐                    ┌─────────────────┐               │
│  │   Next.js       │                    │   Socket.io     │               │
│  │ Request Handler │                    │    Server       │               │
│  └─────────────────┘                    └─────────────────┘               │
│           │                                       │                        │
│           │ HTTP Requests                         │ WebSocket Events       │
│           │                                       │                        │
│  ┌─────────────────┐                    ┌─────────────────┐               │
│  │    Pages &      │                    │  Event Handlers │               │
│  │   API Routes    │                    │                 │               │
│  └─────────────────┘                    └─────────────────┘               │
│                                                   │                        │
│                                         ┌─────────────────┐               │
│                                         │  Transcription  │               │
│                                         │    Service      │               │
│                                         └─────────────────┘               │
│                                                   │                        │
│                                         ┌─────────────────┐               │
│                                         │  AI Analysis    │               │
│                                         │    Service      │               │
│                                         └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │                     │
                                 │                     │
                                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            External APIs                                   │
│                                                                             │
│  ┌─────────────────┐                    ┌─────────────────┐               │
│  │    Deepgram     │                    │     OpenAI      │               │
│  │  WebSocket API  │                    │  Chat Completion│               │
│  │                 │                    │       API       │               │
│  └─────────────────┘                    └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Event Flow Sequence

### 1. Call Initialization
```
Client                    Server                    Deepgram
  │                        │                         │
  │──── socket.connect ────│                         │
  │                        │                         │
  │◄─── connection_ready ──│                         │
  │                        │                         │
  │─── start_transcription ─│                         │
  │                        │─── create WebSocket ────│
  │                        │                         │
  │◄─── transcription_ready│◄─── connection_open ────│
```

### 2. Real-time Transcription Flow
```
Audio Input              Server                 Deepgram              OpenAI
    │                      │                      │                    │
    │─── simulate_speech ───│                      │                    │
    │   {speaker, text}     │                      │                    │
    │                      │─── send_audio ───────│                    │
    │                      │                      │                    │
    │                      │◄─── transcript ──────│                    │
    │                      │   {text, speaker}     │                    │
    │                      │                      │                    │
    │                      │─── analyze_conversation ──────────────────│
    │                      │   [conversation_history]                  │
    │                      │                      │                    │
    │                      │◄─── ai_insights ─────────────────────────│
    │                      │   {motivation, objection, suggestion}     │
    │                      │                      │                    │
    │◄─── transcript_update │                      │                    │
    │   {speaker, text}     │                      │                    │
    │                      │                      │                    │
    │◄─── ai_suggestion ───│                      │                    │
    │   {insights}          │                      │                    │
```

### 3. Error Handling Flow
```
Client                    Server                    External API
  │                        │                         │
  │                        │◄─── connection_error ───│
  │                        │                         │
  │                        │─── retry_connection ────│
  │                        │                         │
  │◄─── error_notification │                         │
  │   {type, message}      │                         │
  │                        │                         │
  │◄─── retry_status ──────│◄─── connection_restored ─│
  │   {connected: true}    │                         │
```

## Socket.io Event Schema

### Client → Server Events
```typescript
interface ClientEvents {
  // Call control
  start_call: () => void;
  end_call: () => void;
  
  // Text simulation (for testing)
  simulate_speech: {
    speaker: 'seller' | 'user';
    text: string;
  };
  
  // Configuration
  update_settings: {
    model?: string;
    analysis_frequency?: number;
  };
}
```

### Server → Client Events
```typescript
interface ServerEvents {
  // Connection status
  connection_ready: () => void;
  transcription_ready: () => void;
  
  // Real-time data
  transcript_update: {
    speaker: 'seller' | 'user';
    text: string;
    timestamp: number;
    confidence?: number;
  };
  
  ai_suggestion: {
    motivation_level: number;        // 1-10 scale
    pain_points: string[];
    objection_detected: boolean;
    objection_type?: 'price' | 'timeline' | 'trust' | 'authority';
    suggested_response: string;
    recommended_next_move: string;
    confidence: number;
  };
  
  // Error handling
  error_notification: {
    type: 'transcription' | 'ai_analysis' | 'connection';
    message: string;
    recoverable: boolean;
  };
  
  // Status updates
  call_status: {
    duration: number;
    total_words: number;
    api_costs: number;
  };
}
```

## Data Processing Pipeline

### Transcription Pipeline
```
Audio Input (Simulated Text)
         │
         ▼
┌─────────────────┐
│   Text Input    │ ──► Format validation
│   Validation    │     Speaker identification
└─────────────────┘     Timestamp assignment
         │
         ▼
┌─────────────────┐
│   Deepgram      │ ──► Real-time WebSocket
│   Streaming     │     Speaker detection
└─────────────────┘     Confidence scoring
         │
         ▼
┌─────────────────┐
│   Transcript    │ ──► Socket.io event
│   Formatting    │     UI state update
└─────────────────┘     History storage
```

### AI Analysis Pipeline
```
Conversation History
         │
         ▼
┌─────────────────┐
│   Context       │ ──► Conversation threading
│   Building      │     Speaker attribution
└─────────────────┘     Context window mgmt
         │
         ▼
┌─────────────────┐
│   OpenAI        │ ──► Function calling schema
│   Analysis      │     Negotiation prompt
└─────────────────┘     Structured output
         │
         ▼
┌─────────────────┐
│   Insight       │ ──► Motivation scoring
│   Processing    │     Objection detection
└─────────────────┘     Strategy suggestions
         │
         ▼
┌─────────────────┐
│   UI Update     │ ──► Real-time display
│   Dispatch      │     Animation triggers
└─────────────────┘     State management
```

## State Management Flow

### Client State
```typescript
interface CallState {
  // Connection status
  connected: boolean;
  transcriptionActive: boolean;
  
  // Call data
  transcript: TranscriptEntry[];
  currentAnalysis: AIAnalysis | null;
  callDuration: number;
  
  // UI state
  motivationLevel: number;
  activeObjection: string | null;
  suggestions: string[];
  
  // Error state
  errors: ErrorNotification[];
  retryAttempts: number;
}
```

### Server State
```typescript
interface ServerState {
  // Active connections
  activeConnections: Map<string, SocketConnection>;
  
  // Conversation tracking
  conversations: Map<string, ConversationHistory>;
  
  // Service connections
  deepgramConnections: Map<string, DeepgramConnection>;
  openaiClient: OpenAI;
  
  // Rate limiting
  requestCounters: Map<string, RateLimitCounter>;
}
```

## Performance Optimization Points

### Data Flow Bottlenecks
1. **Deepgram → Server:** WebSocket buffering
2. **Server → OpenAI:** Request queuing and rate limiting  
3. **Server → Client:** Socket.io event batching
4. **Client UI:** React state update optimization

### Caching Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Response   │    │  Conversation   │    │   UI State      │
│     Cache       │    │    History      │    │     Cache       │
│   (5 minutes)   │    │  (call duration)│    │ (component lvl) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Error Recovery Paths

### Connection Failures
```
WebSocket Drop ──► Automatic Retry ──► Exponential Backoff ──► User Notification
      │                   │                    │                      │
      └─► Buffer Events ──┴─► Replay on Resume ┴──► State Sync ──────┘
```

### API Failures  
```
API Error ──► Retry with Backoff ──► Circuit Breaker ──► Fallback Response
     │               │                      │                   │
     └─► Log Error ──┴─► Alert Monitoring ──┴─► Degrade Gracefully
```