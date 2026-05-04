import { describe, it, expect } from 'vitest'
import { overlaps, type Interval } from '../overlapPure'

// Helper to build an Interval from ISO strings
function iv(start: string, end: string): Interval {
  return { start, end }
}

describe('overlaps — unit tests for known cases', () => {
  it('returns false when A is entirely before B (no touch)', () => {
    const a = iv('2024-01-01T08:00:00Z', '2024-01-01T09:00:00Z')
    const b = iv('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z')
    expect(overlaps(a, b)).toBe(false)
  })

  it('returns false when B is entirely before A (no touch)', () => {
    const a = iv('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z')
    const b = iv('2024-01-01T08:00:00Z', '2024-01-01T09:00:00Z')
    expect(overlaps(a, b)).toBe(false)
  })

  it('returns false when A ends exactly when B starts (adjacent — strict inequality)', () => {
    const a = iv('2024-01-01T08:00:00Z', '2024-01-01T09:00:00Z')
    const b = iv('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z')
    expect(overlaps(a, b)).toBe(false)
  })

  it('returns false when B ends exactly when A starts (adjacent — strict inequality)', () => {
    const a = iv('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z')
    const b = iv('2024-01-01T08:00:00Z', '2024-01-01T09:00:00Z')
    expect(overlaps(a, b)).toBe(false)
  })

  it('returns true when A and B partially overlap', () => {
    const a = iv('2024-01-01T08:00:00Z', '2024-01-01T10:00:00Z')
    const b = iv('2024-01-01T09:00:00Z', '2024-01-01T11:00:00Z')
    expect(overlaps(a, b)).toBe(true)
  })

  it('returns true when A fully contains B', () => {
    const a = iv('2024-01-01T08:00:00Z', '2024-01-01T12:00:00Z')
    const b = iv('2024-01-01T09:00:00Z', '2024-01-01T11:00:00Z')
    expect(overlaps(a, b)).toBe(true)
  })

  it('returns true when B fully contains A', () => {
    const a = iv('2024-01-01T09:00:00Z', '2024-01-01T11:00:00Z')
    const b = iv('2024-01-01T08:00:00Z', '2024-01-01T12:00:00Z')
    expect(overlaps(a, b)).toBe(true)
  })

  it('returns true when A and B are identical intervals', () => {
    const a = iv('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z')
    const b = iv('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z')
    expect(overlaps(a, b)).toBe(true)
  })

  it('works with Date objects as well as ISO strings', () => {
    const a: Interval = {
      start: new Date('2024-01-01T08:00:00Z'),
      end: new Date('2024-01-01T10:00:00Z'),
    }
    const b: Interval = {
      start: new Date('2024-01-01T09:00:00Z'),
      end: new Date('2024-01-01T11:00:00Z'),
    }
    expect(overlaps(a, b)).toBe(true)
  })
})

/**
 * Symmetry property test
 *
 * Validates: Requirements 13.2
 *
 * For a representative set of interval pairs, verify that
 * overlaps(A, B) === overlaps(B, A).
 */
describe('overlaps — symmetry property: overlaps(A, B) === overlaps(B, A)', () => {
  // Base epoch for constructing intervals (ms)
  const BASE = new Date('2024-01-01T00:00:00Z').getTime()
  const HOUR = 3_600_000

  // Each entry is [aStart, aEnd, bStart, bEnd] as hour offsets from BASE
  const pairs: Array<[number, number, number, number]> = [
    // Non-overlapping: A before B
    [0, 1, 2, 3],
    // Non-overlapping: B before A
    [2, 3, 0, 1],
    // Adjacent: A ends when B starts
    [0, 2, 2, 4],
    // Adjacent: B ends when A starts
    [2, 4, 0, 2],
    // Partial overlap
    [0, 3, 2, 5],
    // A contains B
    [0, 10, 2, 4],
    // B contains A
    [2, 4, 0, 10],
    // Identical
    [1, 3, 1, 3],
    // Single-millisecond overlap
    [0, 2, 1, 3],
    // Very short intervals, no overlap
    [0, 1, 5, 6],
    // Very short intervals, overlap
    [0, 5, 4, 9],
    // Large gap
    [0, 1, 100, 200],
    // B starts exactly at A's start
    [5, 10, 5, 8],
    // A starts exactly at B's end
    [8, 12, 5, 8],
    // Zero-duration edge (degenerate — start === end, no real span)
    [3, 3, 2, 4],
  ]

  for (const [aS, aE, bS, bE] of pairs) {
    const a: Interval = {
      start: new Date(BASE + aS * HOUR).toISOString(),
      end: new Date(BASE + aE * HOUR).toISOString(),
    }
    const b: Interval = {
      start: new Date(BASE + bS * HOUR).toISOString(),
      end: new Date(BASE + bE * HOUR).toISOString(),
    }

    it(`overlaps(A,B) === overlaps(B,A) for A=[+${aS}h,+${aE}h] B=[+${bS}h,+${bE}h]`, () => {
      expect(overlaps(a, b)).toBe(overlaps(b, a))
    })
  }
})
