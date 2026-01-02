import { describe, expect, it } from 'vitest';
import {
  DEMO_CONVERSATION_PROMPTS,
  DEMO_USER_RESPONSES,
  NEGOTIATION_SYSTEM_PROMPT,
} from './prompts.js';

describe('NEGOTIATION_SYSTEM_PROMPT', () => {
  it('should contain key analysis areas', () => {
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('Motivation Level');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('Pain Points');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('Objection Detection');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('Strategic Response');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('Next Move');
  });

  it('should specify JSON response format', () => {
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('JSON');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('schema');
  });

  it('should define objection types', () => {
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('price');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('timeline');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('process');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('trust');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('condition');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('competition');
  });

  it('should specify motivation scale', () => {
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('1-10');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('1-3: Low motivation');
    expect(NEGOTIATION_SYSTEM_PROMPT).toContain('7-10: High motivation');
  });
});

describe('DEMO_CONVERSATION_PROMPTS', () => {
  it('should have realistic seller dialogue', () => {
    expect(Array.isArray(DEMO_CONVERSATION_PROMPTS)).toBe(true);
    expect(DEMO_CONVERSATION_PROMPTS.length).toBeGreaterThan(0);

    // Should contain typical seller concerns
    const allText = DEMO_CONVERSATION_PROMPTS.join(' ');
    expect(allText).toContain('offer');
    expect(allText).toContain('house');
  });

  it('should progress conversation naturally', () => {
    expect(DEMO_CONVERSATION_PROMPTS[0]).toContain('letter'); // Initial contact
    expect(DEMO_CONVERSATION_PROMPTS[1]).toContain('health'); // Reveals motivation
    expect(DEMO_CONVERSATION_PROMPTS[4]).toContain('low'); // Price objection
  });
});

describe('DEMO_USER_RESPONSES', () => {
  it('should match conversation prompts length', () => {
    expect(DEMO_USER_RESPONSES.length).toBe(DEMO_CONVERSATION_PROMPTS.length);
  });

  it('should contain professional wholesaler language', () => {
    const allResponses = DEMO_USER_RESPONSES.join(' ');
    expect(allResponses).toContain('cash');
    expect(allResponses).toContain('timeline');
    expect(allResponses).toContain('situation');
  });

  it('should be empathetic and professional', () => {
    expect(DEMO_USER_RESPONSES[1]).toContain('understand');
    expect(DEMO_USER_RESPONSES[5]).toContain('take the time you need');
  });

  it('should address common objections', () => {
    // Response to price objection should explain value prop
    expect(DEMO_USER_RESPONSES[4]).toContain('cash');
    expect(DEMO_USER_RESPONSES[4]).toContain('fees');
  });
});
