import { describe, it, expect } from 'vitest';
import { calculateStreak } from './streak';

describe('calculateStreak', () => {
  it('returns 0 for empty dates', () => {
    expect(calculateStreak([], '2026-10-11')).toBe(0);
  });

  it('counts streak if activity was today', () => {
    expect(calculateStreak(['2026-10-11'], '2026-10-11')).toBe(1);
  });

  it('counts streak if activity was yesterday', () => {
    expect(calculateStreak(['2026-10-10'], '2026-10-11')).toBe(1);
  });

  it('returns 0 if last activity was 2 days ago', () => {
    expect(calculateStreak(['2026-10-09'], '2026-10-11')).toBe(0);
  });

  it('counts consecutive days correctly', () => {
    expect(calculateStreak(['2026-10-11', '2026-10-10', '2026-10-09'], '2026-10-11')).toBe(3);
    // Even if out of order
    expect(calculateStreak(['2026-10-09', '2026-10-11', '2026-10-10'], '2026-10-11')).toBe(3);
  });

  it('stops counting on gap', () => {
    // Gap on 10-09
    expect(calculateStreak(['2026-10-11', '2026-10-10', '2026-10-08'], '2026-10-11')).toBe(2);
  });
  
  it('ignores duplicates', () => {
    expect(calculateStreak(['2026-10-11', '2026-10-11', '2026-10-10'], '2026-10-11')).toBe(2);
  });
});
