# Wholesale AI - Negotiation Copilot

Real-time AI-powered deal analysis and negotiation platform for real estate wholesalers.

## Project Architecture

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
pnpm build        # Build all packages
pnpm test         # Run Vitest tests
pnpm typecheck    # Type check all packages (RUN AFTER EVERY CHANGE)
pnpm lint:fix     # Biome auto-fix (RUN BEFORE EVERY COMMIT)
pnpm clean        # Clean build outputs
```

## Code Conventions (STRICTLY ENFORCED)

- ES modules ONLY (`import`/`export`, NEVER `require`)
- `'use client'` directive for components using hooks, state, or Socket.io
- Async/await over promise chains
- NO comments unless explicitly requested
- Single quotes, semicolons, 2-space indent (enforced by Biome)
- Prefer named exports over default exports

## File Structure Patterns

```
# Pages (App Router)
apps/web/app/[route]/page.tsx
apps/web/app/[route]/layout.tsx

# Components
apps/web/components/[feature]/[ComponentName].tsx
apps/web/components/ui/  # shadcn components (don't modify)

# API Routes
apps/web/app/api/[route]/route.ts

# Server Handlers
apps/server/src/handlers/[feature].ts

# Shared Code (ALWAYS START HERE)
packages/shared/src/types/[feature].ts
packages/shared/src/schemas/[feature].ts
```

## UI Stack

- **shadcn/ui**: Use components from `apps/web/components/ui/`
- **Tailwind**: All styling
- **Lucide React**: Icons (`import { Icon } from 'lucide-react'`)
- **Socket.io-client**: Real-time updates

## Socket.io Events

| Direction      | Event               | Payload                                            |
|----------------|---------------------|----------------------------------------------------|
| Server→Client  | `transcript_update` | `{ speaker, text, timestamp }`                     |
| Server→Client  | `ai_suggestion`     | `{ motivation, painPoints, suggestion, nextMove }` |
| Client→Server  | `simulate_speech`   | `{ speaker, text }`                                |

## Key Business Logic

### MAO Formula (Maximum Allowable Offer)
```
MAO = (ARV × 0.70) - Repairs - WholesaleFee
```

### Heat Score Formula
```
H = Σ(Wᵢ × Tᵢ)
- W = indicator weight (1-10)
- T = time decay (1.0 new, 0.5 if >90 days old)

Thresholds:
- ≥15: CRITICAL (red)
- 8-14: HIGH_PRIORITY (orange)  
- <8: STREET_WORK (blue)
```

### Deal Grade Criteria
- **A**: High equity (>30%), motivated seller, good condition
- **B**: Moderate equity, some motivation, manageable repairs
- **C**: Low equity or low motivation, requires creative finance
- **F**: No viable path to profit

### TCPM Framework (Seller Qualification)
- **T**imeline: When do they need to sell?
- **C**ondition: What's the property state?
- **P**rice: What do they expect?
- **M**otivation: Why are they selling?

## External APIs

- **Deepgram**: Live transcription
- **Anthropic Claude**: AI analysis and suggestions
- **Twilio**: Voice calls and SMS
- Use `context7` MCP to look up API docs before implementing

## Testing

- Framework: Vitest (in `packages/shared`)
- TDD approach: Write failing tests FIRST
- Mock external APIs (Deepgram, Anthropic, Twilio)
- Run `pnpm test` after every implementation

## Workflow Rules

1. ALWAYS create types/schemas in `packages/shared` FIRST
2. ALWAYS run `pnpm typecheck` after code changes
3. ALWAYS run `pnpm lint:fix` before committing
4. NEVER modify files in `apps/web/components/ui/` (shadcn)
5. PREFER small, focused commits over large changes
6. USE existing patterns from the codebase when adding new features

## Module Structure

Each major feature lives in `apps/web/app/[module]/`:
- `dashboard/` - Pipeline overview, alerts, daily tasks
- `deal-finder/` - Lead generation and filtering
- `deal-analyzer/` - ARV, MAO, Deal Grade calculations
- `copilot/` - Live call assistance (existing)
- `disposition/` - Buyer matching
- `education/` - Training content
- `docs/` - Document generation

## State Management

- **Server state**: React Query (if needed) or SWR
- **Client state**: React useState/useReducer
- **Real-time**: Socket.io for live updates
- **Forms**: React Hook Form + Zod validation
