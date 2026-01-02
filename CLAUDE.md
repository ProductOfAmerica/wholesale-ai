# Wholesale AI - Negotiation Copilot POC

## MCP Tools
YOU MUST use `context7` MCP to look up current API docs before implementing any external library.
Do NOT guess at APIs. Do NOT use outdated patterns. Always verify first.

## Turborepo Monorepo
This project uses Turborepo for build orchestration and caching across multiple packages.

### Workspace Structure
- `apps/web` - Next.js 16 frontend (@wholesale-ai/web)
- `apps/server` - Socket.io server (@wholesale-ai/server)
- `packages/shared` - Shared types and utilities (@wholesale-ai/shared)
- `packages/typescript-config` - Shared TypeScript configs (@wholesale-ai/typescript-config)

### Bash Commands
- `pnpm dev` - Start all dev servers (Turborepo parallel execution)
- `pnpm dev:web` - Start web app only (port 3000)
- `pnpm dev:server` - Start server only (port 3001)
- `pnpm build` - Build all packages (respects dependency graph)
- `pnpm test` - Run tests across all packages
- `pnpm typecheck` - Type check all packages
- `pnpm lint` - Lint all packages with Biome
- `pnpm clean` - Clean all build outputs
- `railway up` - Deploy (after build)

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

## Turborepo Configuration Notes
- **Critical**: turbo.json missing environment variable configuration
- Environment changes (API keys) won't invalidate Turborepo cache properly
- All tasks inherit same outputs regardless of package type
- Missing specific file inputs for optimal caching

### Required turbo.json Updates
```json
{
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "env": ["OPENAI_API_KEY", "DEEPGRAM_API_KEY", "FRONTEND_URL"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**"]
    },
    "web#build": {
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

## Common Pitfalls
- Forgot 'use client' → hooks fail silently
- Socket.io connect before mount → use useEffect
- Port conflict → check nothing else on 3000
- Missing env vars → cryptic API errors
- **Turborepo**: Changing env vars without cache invalidation
