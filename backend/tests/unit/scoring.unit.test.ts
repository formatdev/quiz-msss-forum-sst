import { describe, expect, it } from 'vitest';
import { scoreMultiple, scoreSingle } from '../../src/scoring/score.js';

describe('scoring rules', () => {
  it('awards full points for a correct single-choice answer', () => {
    expect(scoreSingle(['A'], ['A'])).toBe(1);
    expect(scoreSingle(['B'], ['A'])).toBe(0);
    expect(scoreSingle(['A'], ['A', 'B'])).toBe(0);
  });

  it('applies bounded partial scoring for multi-choice', () => {
    expect(scoreMultiple(['A', 'C'], ['A', 'C'])).toBe(1);
    expect(scoreMultiple(['A'], ['A', 'C'])).toBe(0.5);
    expect(scoreMultiple(['A', 'B', 'C'], ['A', 'C'])).toBe(0.5);
    expect(scoreMultiple(['B'], ['A', 'C'])).toBe(0);
  });
});
