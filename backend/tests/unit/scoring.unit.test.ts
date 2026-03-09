import { describe, expect, it } from 'vitest';
import { scoreMultiple, scoreMultipleExact, scoreSingle } from '../../src/scoring/score.js';

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

  it('requires exact set match for multiple_exact', () => {
    expect(scoreMultipleExact(['A', 'C'], ['A', 'C'])).toBe(1);
    expect(scoreMultipleExact(['C', 'A'], ['A', 'C'])).toBe(1);
    expect(scoreMultipleExact(['A'], ['A', 'C'])).toBe(0);
    expect(scoreMultipleExact(['A', 'B'], ['A', 'C'])).toBe(0.5);
    expect(scoreMultipleExact(['A', 'B', 'C'], ['A', 'C'])).toBe(0);
  });
});
