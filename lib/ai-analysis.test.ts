import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the OpenAI SDK
const mockChatCompletions = {
  parse: vi.fn()
};

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: mockChatCompletions
    }
  }))
}));

vi.mock('openai/helpers/zod', () => ({
  zodResponseFormat: vi.fn((schema, name) => ({ type: 'json_schema', schema, name }))
}));

vi.mock('zod', () => ({
  z: {
    object: vi.fn(() => ({ min: vi.fn(() => ({ max: vi.fn() })) })),
    number: vi.fn(() => ({ min: vi.fn(() => ({ max: vi.fn() })) })),
    array: vi.fn(),
    string: vi.fn(() => ({ max: vi.fn(), nullable: vi.fn(() => ({ optional: vi.fn() })) })),
    boolean: vi.fn()
  }
}));

// Import after mocking
import { analyzeConversation, type ConversationHistory } from './ai-analysis.js';

describe('AI Analysis Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return valid JSON matching schema', async () => {
    // Mock successful OpenAI response
    mockChatCompletions.parse.mockResolvedValue({
      choices: [{
        message: {
          parsed: {
            motivation_level: 8,
            pain_points: ['Time pressure', 'Financial stress'],
            objection_detected: false,
            objection_type: null,
            suggested_response: 'I understand your situation completely.',
            recommended_next_move: 'Ask about their timeline'
          }
        }
      }]
    });

    const history: ConversationHistory = [
      { speaker: 'seller', text: 'We need to move quickly', timestamp: Date.now() }
    ];

    const result = await analyzeConversation(history, 'Can you tell me more about your timeline?');
    
    expect(result.motivation_level).toBeTypeOf('number');
    expect(result.motivation_level).toBeGreaterThanOrEqual(1);
    expect(result.motivation_level).toBeLessThanOrEqual(10);
    expect(result.pain_points).toBeInstanceOf(Array);
    expect(result.objection_detected).toBeTypeOf('boolean');
    expect(result.suggested_response).toBeTypeOf('string');
    expect(result.recommended_next_move).toBeTypeOf('string');
  });

  it('should detect price objection when seller mentions pricing concerns', async () => {
    mockChatCompletions.parse.mockResolvedValue({
      choices: [{
        message: {
          parsed: {
            motivation_level: 5,
            pain_points: ['Price concern'],
            objection_detected: true,
            objection_type: 'price',
            suggested_response: 'Let me explain how we determine our offers.',
            recommended_next_move: 'Present value proposition'
          }
        }
      }]
    });

    const history: ConversationHistory = [
      { speaker: 'seller', text: 'That price seems too low', timestamp: Date.now() }
    ];

    const result = await analyzeConversation(history, 'What do you think about our offer?');
    
    expect(result.objection_detected).toBe(true);
    expect(result.objection_type).toBe('price');
  });

  it('should keep suggested response under 200 characters', async () => {
    mockChatCompletions.parse.mockResolvedValue({
      choices: [{
        message: {
          parsed: {
            motivation_level: 7,
            pain_points: ['Uncertainty'],
            objection_detected: false,
            suggested_response: 'This is a reasonable response that stays under the character limit.',
            recommended_next_move: 'Continue building rapport'
          }
        }
      }]
    });

    const history: ConversationHistory = [
      { speaker: 'seller', text: 'I need to think about this', timestamp: Date.now() }
    ];

    const result = await analyzeConversation(history, 'Take your time to consider.');
    
    expect(result.suggested_response.length).toBeLessThanOrEqual(200);
  });

  it('should handle OpenAI API errors gracefully', async () => {
    // Mock API error
    mockChatCompletions.parse.mockRejectedValue(new Error('API rate limit exceeded'));

    const history: ConversationHistory = [
      { speaker: 'seller', text: 'Hello', timestamp: Date.now() }
    ];

    const result = await analyzeConversation(history, 'Hi there');
    
    expect(result).toEqual({
      motivation_level: 5,
      pain_points: [],
      objection_detected: false,
      objection_type: null,
      suggested_response: 'Continue the conversation naturally.',
      recommended_next_move: 'Keep building rapport',
      error: 'API rate limit exceeded'
    });
  });

  it('should handle conversation history correctly', async () => {
    mockChatCompletions.parse.mockResolvedValue({
      choices: [{
        message: {
          parsed: {
            motivation_level: 9,
            pain_points: ['Health issues', 'Family needs'],
            objection_detected: false,
            suggested_response: 'I understand this is a difficult time for you.',
            recommended_next_move: 'Show empathy and proceed gently'
          }
        }
      }]
    });

    const history: ConversationHistory = [
      { speaker: 'seller', text: 'My wife is sick and we need to move', timestamp: Date.now() - 1000 },
      { speaker: 'user', text: 'I understand completely', timestamp: Date.now() - 500 },
      { speaker: 'seller', text: 'The medical bills are piling up', timestamp: Date.now() }
    ];

    await analyzeConversation(history, 'How can I help make this easier for you?');
    
    // Verify OpenAI was called with proper context
    expect(mockChatCompletions.parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('real estate negotiation coach')
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('My wife is sick')
          })
        ])
      })
    );
  });
});