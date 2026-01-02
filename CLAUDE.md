# Wholesale AI - Negotiation Copilot POC

## MCP Tools
YOU MUST use `context7` MCP to look up current API docs before implementing any external library.
Do NOT guess at APIs. Do NOT use outdated patterns. Always verify first.

## Bash Commands
- `npm run dev`: Start dev server (Next.js + Socket.io on port 3000)
- `npm run build`: Production build
- `npm start`: Production server
- `npm test`: Run Vitest
- `npm test -- --watch`: Watch mode
- `railway up`: Deploy

## Core Files
- `server.js` - Custom server (Next.js + Socket.io integration)
- `lib/transcription.ts` - Deepgram real-time streaming
- `lib/ai-analysis.ts` - OpenAI conversation analysis
- `app/call/page.tsx` - Main call interface
- `components/LiveTranscript.tsx`, `AISuggestions.tsx`, `MotivationGauge.tsx`

## Code Style
- TypeScript, ES modules only (import/export, never require)
- Destructure imports: `import { Server } from 'socket.io'`
- 'use client' directive for components with hooks or Socket.io
- Async/await over .then() chains
- Functions under 50 lines

## Testing - IMPORTANT
- TDD: Write tests FIRST, confirm they FAIL, then implement
- Use Vitest (not Jest)
- Mock external APIs (Deepgram, OpenAI, Twilio)
- YOU MUST run tests after implementing and verify they pass

## Git & GitHub
- Branches: `feature/[name]` or `fix/[name]`
- Commits: imperative mood ("Add feature" not "Added feature")
- Use `gh` CLI for PRs and issues if available
- Commit after each working phase

## Environment Variables
```
DEEPGRAM_API_KEY=
OPENAI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
PORT=3000
```

## Socket.io Events
Server→Client: `transcript_update` `{ speaker, text, timestamp }`, `ai_suggestion` `{ motivation, painPoints, suggestion, nextMove }`
Client→Server: `simulate_speech` `{ speaker, text }`

## AI Response Schema
```json
{"motivation_level":7,"pain_points":["string"],"objection_detected":true,"objection_type":"price","suggested_response":"string","recommended_next_move":"string"}
```

## Constraints
- NO auth for MVP
- NO database - console.log only  
- Text simulation first, Twilio later
- Railway only (not Vercel - we use custom server)

## Common Pitfalls
- Forgot 'use client' → hooks fail silently
- Socket.io connect before mount → use useEffect
- Port conflict → check nothing else on 3000
- Missing env vars → cryptic API errors
