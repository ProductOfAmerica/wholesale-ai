# Testing Strategy - TDD Approach

## Testing Philosophy
**Test-Driven Development:** Write failing tests first, implement minimal code to pass, refactor for quality.

## Testing Pyramid

### Unit Tests (70%)
**Focus:** Individual functions and components in isolation
**Tools:** Vitest + Testing Library + MSW for API mocking
**Coverage:** Service functions, utilities, component logic

### Integration Tests (20%)
**Focus:** Component interactions and data flows
**Tools:** Vitest + Socket.io test utilities + Deepgram/OpenAI mocks
**Coverage:** Full Socket.io flows, API integration pipelines

### End-to-End Tests (10%)
**Focus:** Complete user workflows
**Tools:** Playwright + real API sandboxes
**Coverage:** Critical user journeys, deployment verification

## Test Categories by Phase

### Phase 1: Server & Socket.io Foundation
```typescript
// __tests__/server.test.js
describe('Custom Server', () => {
  test('should integrate Next.js request handler', async () => {
    // Test Next.js pages render correctly
  });
  
  test('should handle Socket.io WebSocket upgrades', async () => {
    // Test WebSocket connection establishment
  });
  
  test('should preserve HMR in development', async () => {
    // Test hot module replacement works
  });
});

// __tests__/socket-events.test.ts
describe('Socket.io Events', () => {
  test('should emit connection events correctly', async () => {
    // Mock client connection, verify server events
  });
});
```

### Phase 2: Transcription Pipeline
```typescript
// __tests__/transcription.test.ts
describe('Deepgram Integration', () => {
  beforeEach(() => {
    // Mock Deepgram WebSocket connection
    vi.mock('@deepgram/sdk', () => ({
      createClient: vi.fn(() => ({
        listen: {
          live: vi.fn(() => mockDeepgramConnection)
        }
      }))
    }));
  });

  test('should connect to Deepgram WebSocket', async () => {
    const transcription = new TranscriptionService(mockApiKey);
    await transcription.connect();
    expect(transcription.isConnected).toBe(true);
  });

  test('should emit transcript_update events', async () => {
    // Simulate Deepgram transcript event
    // Verify Socket.io event emitted with correct schema
  });

  test('should handle speaker identification', async () => {
    // Test speaker detection in multi-speaker scenarios
  });
});

// __tests__/components/LiveTranscript.test.tsx
describe('LiveTranscript Component', () => {
  test('should display real-time transcript updates', async () => {
    // Mock Socket.io hook, emit transcript events
    // Verify UI updates correctly
  });
});
```

### Phase 3: AI Analysis
```typescript
// __tests__/ai-analysis.test.ts
describe('OpenAI Analysis', () => {
  beforeEach(() => {
    // Mock OpenAI client with function calling
    vi.mock('openai', () => ({
      default: vi.fn(() => mockOpenAIClient)
    }));
  });

  test('should analyze conversation for motivation level', async () => {
    const analysis = await analyzeNegotiation([
      { speaker: 'seller', text: 'I really need to sell this property quickly' }
    ]);
    expect(analysis.motivation_level).toBeGreaterThan(7);
  });

  test('should detect objections correctly', async () => {
    const analysis = await analyzeNegotiation([
      { speaker: 'seller', text: 'That price is way too low' }
    ]);
    expect(analysis.objection_detected).toBe(true);
    expect(analysis.objection_type).toBe('price');
  });

  test('should provide strategic suggestions', async () => {
    // Test various conversation scenarios
    // Verify AI provides actionable insights
  });
});
```

### Phase 4: UI Components
```typescript
// __tests__/components/MotivationGauge.test.tsx
describe('MotivationGauge', () => {
  test('should display motivation level visually', () => {
    render(<MotivationGauge level={8} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '8');
  });

  test('should animate level changes smoothly', async () => {
    const { rerender } = render(<MotivationGauge level={3} />);
    rerender(<MotivationGauge level={7} />);
    // Test animation behavior
  });
});

// __tests__/pages/call.test.tsx
describe('Call Page', () => {
  test('should integrate all components correctly', () => {
    // Test full page render with mocked Socket.io
  });
});
```

### Phase 5: Integration Tests
```typescript
// __tests__/integration/full-flow.test.ts
describe('Complete Pipeline Integration', () => {
  test('should process speech to insights end-to-end', async () => {
    // 1. Simulate audio input via text
    // 2. Verify transcript_update event
    // 3. Verify ai_suggestion event
    // 4. Check UI state updates
  });

  test('should handle multiple speakers correctly', async () => {
    // Test conversation threading
  });

  test('should recover from connection drops', async () => {
    // Test error handling and reconnection
  });
});
```

## Mock Strategy

### External APIs
```typescript
// lib/mocks.ts
export const mockDeepgramResponse = {
  channel: {
    alternatives: [{
      transcript: "I need to sell this house quickly",
      confidence: 0.95
    }]
  },
  is_final: true,
  speech_final: true
};

export const mockOpenAIResponse = {
  motivation_level: 8,
  pain_points: ["Time pressure", "Financial stress"],
  objection_detected: false,
  suggested_response: "I understand you're in a time crunch...",
  recommended_next_move: "Ask about timeline flexibility"
};

// MSW handlers for API mocking
export const handlers = [
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    return res(ctx.json(mockOpenAIResponse));
  }),
];
```

### Socket.io Testing
```typescript
// __tests__/utils/socket-test-utils.ts
export const createMockSocket = () => {
  const events: Record<string, Function[]> = {};
  
  return {
    on: vi.fn((event: string, callback: Function) => {
      events[event] = events[event] || [];
      events[event].push(callback);
    }),
    emit: vi.fn((event: string, data: any) => {
      events[event]?.forEach(callback => callback(data));
    }),
    disconnect: vi.fn()
  };
};
```

## Test Scenarios by User Journey

### Happy Path: Successful Negotiation Analysis
1. User starts call simulation
2. Enters seller speech: "I need to sell quickly"
3. AI detects high motivation (8/10)
4. User enters objection: "Price is too low" 
5. AI detects price objection, suggests response
6. User follows suggestion, seller agrees

### Error Paths
1. **Deepgram connection fails:** Should show error, retry automatically
2. **OpenAI rate limit:** Should queue requests, show loading state
3. **Socket.io disconnection:** Should reconnect, preserve state
4. **Invalid AI response:** Should show fallback message

### Edge Cases
1. **Very long conversation:** Context window management
2. **Rapid speech:** Transcript buffering and ordering
3. **Multiple simultaneous calls:** Resource management
4. **Malformed input:** Input validation and sanitization

## Performance Testing

### Load Testing Scenarios
```typescript
// __tests__/performance/load.test.ts
describe('Performance Under Load', () => {
  test('should handle 50 concurrent connections', async () => {
    // Create 50 Socket.io connections
    // Simulate transcript events
    // Measure response times
  });

  test('should process transcripts within 500ms', async () => {
    // Benchmark transcript processing pipeline
  });
});
```

### Memory Testing
- Monitor memory usage during long conversations
- Test for memory leaks in WebSocket connections
- Verify garbage collection of completed calls

## CI/CD Testing Pipeline

### Pre-commit Hooks
```bash
npm run lint        # ESLint + TypeScript checking
npm run test:unit   # Fast unit tests only
npm run type-check  # TypeScript compilation
```

### Pull Request Pipeline
```bash
npm run test:all           # All tests including integration
npm run test:coverage      # Coverage reporting (>80% target)
npm run build             # Production build test
npm run start:test        # Start server for E2E tests
npm run test:e2e          # Playwright E2E tests
```

### Deployment Pipeline
```bash
npm run test:production   # Production environment tests
npm run deploy:staging    # Deploy to staging
npm run test:smoke        # Smoke tests on staging
npm run deploy:prod       # Deploy to production
```

## Test Data Management

### Conversation Fixtures
```typescript
// __tests__/fixtures/conversations.ts
export const negotiationScenarios = {
  highMotivation: [
    { speaker: 'seller', text: 'I need to close by next week', timestamp: 1000 },
    { speaker: 'buyer', text: 'I can help with that timeline', timestamp: 2000 }
  ],
  priceObjection: [
    { speaker: 'buyer', text: 'I can offer 200k for this property', timestamp: 1000 },
    { speaker: 'seller', text: 'That is way below market value', timestamp: 3000 }
  ]
};
```

### API Response Fixtures
- Save real API responses for consistent testing
- Anonymize any sensitive data
- Version fixtures with API changes

## Coverage Targets

### Minimum Coverage Requirements
- **Unit Tests:** 85% line coverage
- **Integration Tests:** 75% critical path coverage  
- **E2E Tests:** 90% happy path coverage

### Coverage Exclusions
- Configuration files
- Type definitions
- Development-only utilities
- Third-party library wrappers