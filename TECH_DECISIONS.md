# Technical Architecture Decisions

## Core Architecture Choices

### Why Custom Server over Next.js API Routes
**Decision:** Use custom Express/HTTP server with Next.js integration
**Rationale:**
- WebSocket upgrades require HTTP server control
- Socket.io needs direct server instance access
- API routes can't handle persistent connections
- Better performance for real-time bidirectional communication

**Trade-off:** Lose some Next.js optimizations, more complex deployment

### Why Deepgram over OpenAI Whisper for Real-time
**Decision:** Deepgram WebSocket streaming API
**Rationale:**
- True real-time streaming vs batch processing
- WebSocket protocol matches our Socket.io architecture  
- Sub-second latency vs 2-5 second batch delays
- Built-in speaker detection and conversation threading
- Lower cost at scale ($0.0059/min vs $0.006/min)

**API Pattern:**
```typescript
// Deepgram streaming (chosen)
connection.on(LiveTranscriptionEvents.Transcript, (data) => {
  socket.emit('transcript_update', {
    speaker: data.channel.alternatives[0].speaker,
    text: data.channel.alternatives[0].transcript,
    timestamp: Date.now()
  });
});

// vs Whisper batch (rejected for real-time use)
const transcription = await openai.audio.transcriptions.create({
  file: audioBuffer, // requires complete audio segment
  model: "whisper-1"
});
```

### Why Socket.io over Pusher/Ably/Server-Sent Events
**Decision:** Socket.io for real-time communication
**Rationale:**
- Full bidirectional communication (client can send simulation events)
- Automatic fallback to long-polling if WebSocket fails
- Rich event system with typed payloads
- No third-party service dependencies or costs
- Mature ecosystem with excellent TypeScript support

**Alternative Analysis:**
- **SSE:** Unidirectional only, can't simulate speech from client
- **Pusher/Ably:** Additional cost ($49+/month), vendor lock-in
- **Native WebSocket:** More complex to implement with fallbacks

### Why OpenAI Function Calling for Analysis
**Decision:** OpenAI Chat Completions with function calling
**Rationale:**
- Structured JSON responses via function schemas
- Real-time streaming with delta updates
- Built-in conversation context management
- Superior reasoning for negotiation analysis vs other LLMs

**Schema Design:**
```typescript
{
  "type": "function",
  "function": {
    "name": "analyze_negotiation",
    "parameters": {
      "type": "object",
      "properties": {
        "motivation_level": {"type": "number", "minimum": 1, "maximum": 10},
        "pain_points": {"type": "array", "items": {"type": "string"}},
        "objection_detected": {"type": "boolean"},
        "objection_type": {"type": "string", "enum": ["price", "timeline", "trust", "authority"]},
        "suggested_response": {"type": "string"},
        "recommended_next_move": {"type": "string"}
      }
    }
  }
}
```

## POC vs Production Trade-offs

### Simplified for MVP
**Authentication:** None - direct access to call interface
**Database:** Console logging only, no persistence
**Audio Input:** Text simulation first, Twilio integration later
**Error Handling:** Basic try/catch, no comprehensive monitoring
**Scaling:** Single server, no load balancing

### Production Considerations (Future)
**Authentication:** OAuth with role-based access
**Database:** PostgreSQL for call history, analytics
**Audio:** Twilio Voice SDK integration
**Error Handling:** Comprehensive logging, alerting, rollback
**Scaling:** Load balancer, Redis for Socket.io clustering

## Technology Stack Justification

### Next.js 16
- **Pros:** App Router, excellent TypeScript support, built-in optimizations
- **Cons:** Custom server bypasses some optimizations
- **Why:** Team familiarity, rapid development, good deployment options

### TypeScript
- **Pros:** Type safety for real-time event schemas, better IDE support
- **Cons:** Additional build complexity
- **Why:** Critical for Socket.io event typing and API integration

### Vitest for Testing
- **Pros:** Faster than Jest, better ES modules support, Vite ecosystem
- **Cons:** Smaller ecosystem than Jest
- **Why:** Speed matters for TDD, works well with TypeScript + Socket.io

### Railway for Deployment
- **Pros:** Simple custom server deployment, automatic SSL, good WebSocket support
- **Cons:** Less control than AWS/GCP
- **Why:** POC speed over enterprise features, $5/month base cost

## Cost Analysis at Scale

### Monthly Costs (1000 hours of calls)
| Service | Usage | Rate | Cost |
|---------|-------|------|------|
| Deepgram | 60,000 minutes | $0.0059/min | $354 |
| OpenAI | ~500K tokens avg | $0.03/1K tokens | $150 |
| Railway | Hosting | $5-20/month | $20 |
| **Total** | | | **~$524/month** |

### Cost Optimization Strategies
1. **Deepgram:** Use Nova-2 model ($0.0039/min) for non-critical calls
2. **OpenAI:** Implement context window management, use GPT-4o-mini for simple analysis
3. **Caching:** Cache AI responses for common objection patterns
4. **Batching:** Analyze conversation segments vs real-time for less critical insights

## Performance Targets

### Latency Requirements
- **Transcription:** <500ms from speech to text
- **AI Analysis:** <2s from transcript to insights
- **UI Updates:** <100ms Socket.io round-trip
- **Total Pipeline:** <3s speech to actionable insight

### Scalability Assumptions
- **Concurrent calls:** 50-100 simultaneous (single server)
- **Connection duration:** 30-60 minutes average
- **Message frequency:** 1-3 transcript updates/second
- **Memory usage:** ~50MB per active connection

## Security Considerations

### API Key Management
- Environment variables only, never in client code
- Separate development/production keys
- Rotation policy for production deployment

### Data Protection
- No persistent storage of conversation content
- API keys over HTTPS only
- WebSocket connections over WSS in production

### Input Validation
- Sanitize all Socket.io event payloads
- Rate limiting on client events
- Validate AI function calling responses before processing