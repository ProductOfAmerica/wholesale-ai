# Wholesale AI - Negotiation Copilot

Real-time AI-powered negotiation assistant for real estate wholesalers. Provides live transcription, motivation
analysis, and suggested responses during calls.

## Project Structure

```
apps/
  web/          → Next.js 16 frontend (port 3000)
  server/       → Socket.io + Twilio server (port 3001)
packages/
  shared/       → Shared types and Zod schemas
  typescript-config/  → Shared TS configs
```

## Commands

```bash
pnpm dev          # Start both apps + cloudflared tunnel (recommended)
pnpm dev:web      # Start both apps without tunnel (misleading name)
pnpm build        # Build all packages
pnpm test         # Run Vitest tests
pnpm typecheck    # Type check all packages
pnpm lint         # Biome check
pnpm lint:fix     # Biome auto-fix
pnpm clean        # Clean build outputs

# Per-package (run from apps/web or apps/server)
pnpm dev          # Start single app
```

## Key Technologies

- **Frontend**: Next.js 16, React 19, Tailwind, shadcn/ui, Socket.io-client, Twilio Voice SDK
- **Backend**: Socket.io, Twilio, Deepgram (transcription), Anthropic Claude (analysis)
- **Tooling**: Turborepo, pnpm workspaces, Biome, Vitest, TypeScript 5.7

## Code Conventions

- ES modules only (`import`/`export`, never `require`)
- `'use client'` for components using hooks or Socket.io
- Async/await over promise chains
- No comments unless explicitly requested
- Single quotes, semicolons, 2-space indent (enforced by Biome)

## Socket.io Events

| Direction     | Event               | Payload                                            |
|---------------|---------------------|----------------------------------------------------|
| Server→Client | `transcript_update` | `{ speaker, text, timestamp }`                     |
| Server→Client | `ai_suggestion`     | `{ motivation, painPoints, suggestion, nextMove }` |
| Client→Server | `simulate_speech`   | `{ speaker, text }`                                |

## Testing

- Framework: Vitest (in `packages/shared`)
- TDD approach: write failing tests first
- Mock external APIs (Deepgram, Anthropic, Twilio)
- Run `pnpm test` after implementation

## MCP Tools

Use `context7` MCP to look up API docs before implementing external library code. Do not guess at APIs.
