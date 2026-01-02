# Wholesale AI - Build Checklist

## Keyboard Shortcuts Reference
- `ESC` - Interrupt Claude (keeps context, lets you redirect)
- `ESC ESC` - Jump back in history, edit previous prompt
- `shift+tab` - Toggle auto-accept mode
- `#` - Add instruction to CLAUDE.md
- `/clear` - Reset context window (USE BETWEEN PHASES)
- `/permissions` - Manage tool allowlist
- `Tab` - Autocomplete file paths in prompts

---

## Initial Setup

- [ ] Create project: `mkdir wholesale-ai-test && cd wholesale-ai-test && git init`
- [ ] Copy `CLAUDE_NEXTJS.md` to project root, rename to `CLAUDE.md`
- [ ] Create `.mcp.json` for context7:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropic/context7-mcp"]
    }
  }
}
```
- [ ] Start Claude Code: `claude`
- [ ] Verify MCP loaded: Type "list your available MCP tools" - should see context7
- [ ] Copy/paste planning prompt from `PLANNING_PROMPT.md`

---

## Phase 1: Planning

- [ ] Claude creates PLAN.md, TECH_DECISIONS.md, TESTING_STRATEGY.md, DATA_FLOW.md, RAILWAY_DEPLOY.md
- [ ] **Review each doc** - if anything's wrong, tell Claude to fix it now
- [ ] **Run `/clear`** before starting implementation

---

## Phase 2: Project Scaffolding

- [ ] **Prompt:**
```
Use context7 MCP to look up Next.js 16 custom server setup and Socket.io 4.x server initialization.

Then create the project structure:
1. package.json with these exact dependencies: next@16, react@19, socket.io@4, @deepgram/sdk, openai, tailwindcss, vitest
2. server.js that runs Next.js with Socket.io attached (log "Client connected" on connection)
3. Basic app/page.tsx that renders "Hello"
4. tsconfig.json, tailwind.config.js, postcss.config.js
5. .env.example listing all required env vars
6. .gitignore (node_modules, .next, .env.local)
7. railway.json with start command

Do not start the server yet. Just create files.
```

- [ ] **Prompt:** `Install dependencies and start dev server. Show me any errors.`
- [ ] **Verify:** localhost:3000 shows "Hello"
- [ ] **Prompt:** `Commit with message "Initial Next.js 16 + custom server setup"`
- [ ] **Run `/clear`**

---

## Phase 3: Socket.io Connection

- [ ] **Prompt:**
```
Create app/test/page.tsx with 'use client' that:
1. Connects to Socket.io server on mount (useEffect)
2. Shows "Connecting..." then "Connected" or "Error" based on state
3. Has a button that sends 'ping' event
4. Displays server 'pong' response

Update server.js to:
1. Log client connections with socket.id
2. Handle 'ping' event, respond with 'pong' containing timestamp

Use context7 MCP to verify Socket.io client API if unsure.
```

- [ ] **Verify:** Open localhost:3000/test, see "Connected", click ping, see pong response
- [ ] **If not working:** `Check browser console and server logs. Show me the errors. Fix them one at a time.`
- [ ] **Prompt:** `Commit with message "Add Socket.io bidirectional communication"`
- [ ] **Run `/clear`**

---

## Phase 4: Transcription Module (TDD)

- [ ] **Prompt:**
```
We're doing TDD. Write tests FIRST in lib/transcription.test.ts using Vitest.

Test cases:
1. createTranscriptionStream() returns a Deepgram live connection
2. When Deepgram emits transcript result, our module emits 'transcript' event with {speaker, text, timestamp}
3. When Deepgram connection errors, our module emits 'error' event and logs it
4. Connection can be cleanly closed

Mock the Deepgram SDK. Do NOT implement lib/transcription.ts yet.
Run tests with npm test. Confirm all 4 tests FAIL.
```

- [ ] **Review tests** - make sure they test the right things
- [ ] **Prompt:**
```
Now implement lib/transcription.ts to make all tests pass.

Use context7 MCP to look up current Deepgram Node SDK real-time streaming API.

Keep iterating until npm test shows all tests passing. Do not modify the tests.
```

- [ ] **Verify:** All tests pass
- [ ] **Prompt:** `Commit with message "Add Deepgram transcription module with tests"`
- [ ] **Run `/clear`**

---

## Phase 5: AI Analysis Module (TDD)

- [ ] **Prompt:**
```
TDD for lib/ai-analysis.ts. Write tests FIRST in lib/ai-analysis.test.ts.

Test cases:
1. analyzeConversation(history, latestStatement) returns valid JSON matching schema in CLAUDE.md
2. motivation_level is number 1-10
3. When statement contains "too low" or "too high", objection_detected is true and objection_type is "price"
4. suggested_response is under 200 characters
5. Handles OpenAI API errors gracefully, returns error object

Mock OpenAI SDK. Do NOT implement yet. Run tests, confirm they FAIL.
```

- [ ] **Review tests**
- [ ] **Prompt:**
```
Implement lib/ai-analysis.ts to pass all tests.

Use context7 MCP to look up current OpenAI Node SDK chat completions API with JSON mode.

System prompt: "You are an expert real estate negotiation coach. Analyze seller conversations. Respond only in JSON matching this schema: {motivation_level, pain_points, objection_detected, objection_type, suggested_response, recommended_next_move}"

Iterate until all tests pass.
```

- [ ] **Verify:** All tests pass
- [ ] **Prompt:** `Commit with message "Add OpenAI analysis module with tests"`
- [ ] **Run `/clear`**

---

## Phase 6: Frontend Components

- [ ] **Prompt:**
```
Create components/LiveTranscript.tsx:
- 'use client', receives messages via prop or Socket.io listener for 'transcript_update'
- Scrolling list showing speaker label (You/Seller) and text
- Auto-scrolls to bottom on new message
- Tailwind styling: gray background, rounded messages, different colors per speaker

Create components/MotivationGauge.tsx:
- Shows motivation 1-10 as horizontal bar
- Color: red (1-3), yellow (4-6), green (7-10)
- Animated width transitions
- Number displayed next to bar

Create components/AISuggestions.tsx:
- Card showing suggested_response prominently
- Pain points as small tags below
- recommended_next_move at bottom
- Updates on 'ai_suggestion' Socket.io event
```

- [ ] **Prompt:**
```
Create app/call/page.tsx combining all three components:
- Two-column layout: LiveTranscript (left 60%), right panel with MotivationGauge + AISuggestions (40%)
- Header with "Live Call" title
- Wire up Socket.io listeners for transcript_update and ai_suggestion
- Add text input at bottom to simulate seller speech (emits simulate_speech event)
```

- [ ] **Verify:** localhost:3000/call shows layout with all components
- [ ] **Prompt:** `Commit with message "Add call interface UI components"`
- [ ] **Run `/clear`**

---

## Phase 7: Integration

- [ ] **Prompt:**
```
Wire the full loop in server.js:

1. On 'simulate_speech' event from client:
   - Add to conversation history
   - Emit 'transcript_update' back to all clients
   - Call analyzeConversation() from lib/ai-analysis.ts
   - Emit 'ai_suggestion' with result

2. Test by typing "The price is too low" in the input
   - Should see it appear in transcript
   - Should see AI suggestion with objection_detected: true

Fix any issues until the full loop works.
```

- [ ] **Verify:** Type message → appears in transcript → AI suggestion appears
- [ ] **Prompt:**
```
Create lib/demo-conversation.ts with array of 6 realistic seller statements:
1. "Hi, I got your letter about buying my house"
2. "We've been here 20 years but my wife's health... we need to move closer to family"
3. "The house needs some work, I know. Roof is maybe 10 years old"
4. "What kind of offer are you thinking?"
5. "That seems low. Zillow says it's worth more"
6. "I don't know, I need to think about it and talk to my wife"

Add "Run Demo" button to app/call/page.tsx that plays these with 3-second delays.
Each message should flow through the full loop showing transcripts and AI suggestions.
```

- [ ] **Verify:** Demo plays through, suggestions update appropriately
- [ ] **Prompt:** `Commit with message "Add full integration and demo mode"`
- [ ] **Run `/clear`**

---

## Phase 8: Deploy to Railway

- [ ] Create Railway account at railway.com
- [ ] **Prompt:**
```
Review RAILWAY_DEPLOY.md. Verify:
1. package.json "start" script runs "node server.js"
2. server.js uses process.env.PORT
3. railway.json exists with correct config

Fix any issues.
```

- [ ] Run: `railway login && railway init && railway up`
- [ ] Set env vars in Railway dashboard: DEEPGRAM_API_KEY, OPENAI_API_KEY, NODE_ENV=production
- [ ] **Verify:** App loads at Railway URL, Socket.io connects, demo works
- [ ] **Prompt:** `Commit any deployment fixes with message "Fix Railway deployment"`

---

## Phase 9: Twilio (Optional)

- [ ] Get Twilio credentials (Account SID, Auth Token, Phone Number)
- [ ] **Prompt:**
```
Use context7 MCP to look up Twilio Media Streams API and TwiML for streaming.

Create lib/twilio.ts that:
1. Exports TwiML response for /voice webhook that streams to our WebSocket
2. Handles incoming Twilio WebSocket connection
3. Forwards audio buffers to Deepgram transcription
4. Maps Twilio audio format to Deepgram expected format

Update server.js:
1. Add POST /voice endpoint returning TwiML
2. Add WebSocket handler for Twilio media streams at /twilio-stream
```

- [ ] Test with ngrok: `ngrok http 3000`, set Twilio webhook to ngrok URL + /voice
- [ ] **Verify:** Call Twilio number → transcript appears in app
- [ ] **Prompt:** `Commit with message "Add Twilio real-time integration"`

---

## Phase 10: Polish

- [ ] **Prompt:**
```
Add error handling:
1. Loading skeleton in AISuggestions while waiting for response
2. Toast notifications for API errors (use simple div, no library needed)
3. "Connecting..." state for Socket.io with retry
4. Graceful handling if env vars missing (show setup instructions)
```

- [ ] **Prompt:** `Create README.md with: project description, setup steps, env vars needed, how to run locally, how to deploy, how to use demo mode`
- [ ] **Prompt:** `Commit with message "Add error handling and documentation"`

---

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] localhost:3000/call loads
- [ ] Socket.io connects (check console)
- [ ] Text input → transcript appears
- [ ] AI suggestion appears within 2 seconds
- [ ] Motivation gauge updates and changes color
- [ ] Demo mode plays full conversation
- [ ] `npm test` - all tests pass
- [ ] Railway deployment works
- [ ] (Optional) Twilio call transcribes

---

## Troubleshooting

**Claude going wrong direction:**
Press `ESC` to interrupt, then redirect. Or `ESC ESC` to go back and edit your prompt.

**Context getting cluttered:**
Run `/clear` and re-state what you need.

**API not working:**
```
Use context7 MCP to look up current [library] docs. Check if API changed. Show me what you find and fix the code.
```

**Tests failing:**
```
Run npm test -- --reporter=verbose for the failing test. Show exact error. Fix that one test only, then move to next.
```

**Socket.io won't connect:**
```
Show me server.js Socket.io setup and the client connection code. Check CORS config. Check ports match. Show browser console and server logs.
```

**Deployment fails:**
```
Show Railway build logs. Check package.json scripts. Verify PORT env var is used. Fix the specific error shown.
```

---

## Custom Slash Commands (Optional)

Create `.claude/commands/` folder for reusable prompts:

**.claude/commands/test-module.md:**
```
Run tests for $ARGUMENTS module. Show failures. Fix them one at a time. Do not modify test files. Keep iterating until all pass.
```

Usage: `/project:test-module transcription`

**.claude/commands/add-component.md:**
```
Create React component $ARGUMENTS in components/ folder. Use 'use client' directive. Style with Tailwind. Make it clean and minimal. Add TypeScript types.
```

Usage: `/project:add-component CallTimer`

---

## Time Estimates

| Phase | Time |
|-------|------|
| Setup + Planning | 30 min |
| Scaffolding | 20 min |
| Socket.io | 20 min |
| Transcription (TDD) | 45 min |
| AI Analysis (TDD) | 45 min |
| Frontend | 45 min |
| Integration | 30 min |
| Deploy | 20 min |
| Twilio (optional) | 45 min |
| Polish | 20 min |

**Total: ~5-6 hours** (without Twilio)
