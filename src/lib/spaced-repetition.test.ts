import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { INTERVALS_DAYS, getNextRevisionData, getInitialRevisionData } from './spaced-repetition';

describe('spaced-repetition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates initial revision data correctly (stage 0, +1 day)', () => {
    const data = getInitialRevisionData();
    expect(data.revision_stage).toBe(0);
    const expected = new Date('2026-10-12T12:00:00Z');
    expect(data.next_revision_at.toISOString()).toBe(expected.toISOString());
  });

  it('advances revision stage correctly', () => {
    const data1 = getNextRevisionData(0);
    expect(data1.revision_stage).toBe(1);
    // stage 1 has interval 3 days
    const expected1 = new Date('2026-10-14T12:00:00Z');
    expect(data1.next_revision_at.toISOString()).toBe(expected1.toISOString());

    const data2 = getNextRevisionData(1);
    expect(data2.revision_stage).toBe(2);
    // stage 2 has interval 7 days
    const expected2 = new Date('2026-10-18T12:00:00Z');
    expect(data2.next_revision_at.toISOString()).toBe(expected2.toISOString());
  });

  it('caps the revision stage at the maximum interval', () => {
    const maxStage = INTERVALS_DAYS.length - 1;
    const data = getNextRevisionData(maxStage);
    expect(data.revision_stage).toBe(maxStage);
    // maxStage (4) has interval 45 days
    const expected = new Date('2026-10-11T12:00:00Z');
    expected.setDate(expected.getDate() + 45);
    expect(data.next_revision_at.toISOString()).toBe(expected.toISOString());
  });
});
