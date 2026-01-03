import { describe, expect, it } from 'vitest';
import type {
  AISuggestion,
  ConversationHistory,
  TranscriptEntry,
} from './transcription.js';

describe('TranscriptEntry', () => {
  it('should have correct shape', () => {
    const entry: TranscriptEntry = {
      speaker: 'user',
      text: 'Hello world',
      timestamp: Date.now(),
    };

    expect(entry).toHaveProperty('speaker');
    expect(entry).toHaveProperty('text');
    expect(entry).toHaveProperty('timestamp');
    expect(typeof entry.speaker).toBe('string');
    expect(typeof entry.text).toBe('string');
    expect(typeof entry.timestamp).toBe('number');
  });
});

describe('AISuggestion', () => {
  it('should have correct shape', () => {
    const suggestion: AISuggestion = {
      motivation_level: 7,
      pain_points: ['financial stress', 'relocation'],
      objection_detected: true,
      objection_type: 'price',
      suggested_response: 'I understand your concern about the price',
      recommended_next_move: 'Schedule a property visit',
    };

    expect(suggestion.motivation_level).toBeGreaterThanOrEqual(1);
    expect(suggestion.motivation_level).toBeLessThanOrEqual(10);
    expect(Array.isArray(suggestion.pain_points)).toBe(true);
    expect(typeof suggestion.objection_detected).toBe('boolean');
  });

  it('should handle optional fields', () => {
    const suggestion: AISuggestion = {
      motivation_level: 5,
      pain_points: [],
      objection_detected: false,
      suggested_response: 'Continue building rapport',
      recommended_next_move: 'Ask more questions',
    };

    expect(suggestion.objection_type).toBeUndefined();
    expect(suggestion.error).toBeUndefined();
  });
});

describe('ConversationHistory', () => {
  it('should be an array of TranscriptEntry', () => {
    const history: ConversationHistory = [
      { speaker: 'user', text: 'Hello', timestamp: Date.now() },
      { speaker: 'seller', text: 'Hi there', timestamp: Date.now() + 1000 },
    ];

    expect(Array.isArray(history)).toBe(true);
    expect(history).toHaveLength(2);
    expect(history[0].speaker).toBe('user');
    expect(history[1].speaker).toBe('seller');
  });
});
