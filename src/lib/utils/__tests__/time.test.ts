import { describe, it, expect } from 'vitest'
import { formatHHMMSS, parseHHMMSS } from '../time'

// ─── formatHHMMSS ─────────────────────────────────────────────────────────────

describe('formatHHMMSS', () => {
  it('formats 0 seconds as "00:00:00"', () => {
    expect(formatHHMMSS(0)).toBe('00:00:00')
  })

  it('formats 1 second as "00:00:01"', () => {
    expect(formatHHMMSS(1)).toBe('00:00:01')
  })

  it('formats 59 seconds as "00:00:59"', () => {
    expect(formatHHMMSS(59)).toBe('00:00:59')
  })

  it('formats 60 seconds as "00:01:00"', () => {
    expect(formatHHMMSS(60)).toBe('00:01:00')
  })

  it('formats 61 seconds as "00:01:01"', () => {
    expect(formatHHMMSS(61)).toBe('00:01:01')
  })

  it('formats 3599 seconds as "00:59:59"', () => {
    expect(formatHHMMSS(3599)).toBe('00:59:59')
  })

  it('formats 3600 seconds as "01:00:00"', () => {
    expect(formatHHMMSS(3600)).toBe('01:00:00')
  })

  it('formats 3661 seconds as "01:01:01"', () => {
    expect(formatHHMMSS(3661)).toBe('01:01:01')
  })

  it('formats 7199 seconds as "01:59:59"', () => {
    expect(formatHHMMSS(7199)).toBe('01:59:59')
  })

  it('formats 7200 seconds as "02:00:00"', () => {
    expect(formatHHMMSS(7200)).toBe('02:00:00')
  })

  it('formats 86399 seconds (23:59:59) correctly', () => {
    expect(formatHHMMSS(86399)).toBe('23:59:59')
  })

  it('formats 86400 seconds (24:00:00) correctly — hours can exceed 23', () => {
    expect(formatHHMMSS(86400)).toBe('24:00:00')
  })

  it('pads single-digit hours, minutes, and seconds with leading zeros', () => {
    // 1h 1m 1s
    expect(formatHHMMSS(3661)).toBe('01:01:01')
  })
})

// ─── parseHHMMSS ──────────────────────────────────────────────────────────────

describe('parseHHMMSS', () => {
  it('parses "00:00:00" as 0', () => {
    expect(parseHHMMSS('00:00:00')).toBe(0)
  })

  it('parses "00:00:01" as 1', () => {
    expect(parseHHMMSS('00:00:01')).toBe(1)
  })

  it('parses "00:00:59" as 59', () => {
    expect(parseHHMMSS('00:00:59')).toBe(59)
  })

  it('parses "00:01:00" as 60', () => {
    expect(parseHHMMSS('00:01:00')).toBe(60)
  })

  it('parses "00:59:59" as 3599', () => {
    expect(parseHHMMSS('00:59:59')).toBe(3599)
  })

  it('parses "01:00:00" as 3600', () => {
    expect(parseHHMMSS('01:00:00')).toBe(3600)
  })

  it('parses "01:01:01" as 3661', () => {
    expect(parseHHMMSS('01:01:01')).toBe(3661)
  })

  it('parses "23:59:59" as 86399', () => {
    expect(parseHHMMSS('23:59:59')).toBe(86399)
  })

  it('parses "24:00:00" as 86400', () => {
    expect(parseHHMMSS('24:00:00')).toBe(86400)
  })
})

// ─── Round-trip property: parseHHMMSS(formatHHMMSS(n)) === n ─────────────────
//
// Validates: Requirements Property 2
// "For any non-negative integer n (seconds), verify that
//  parseHHMMSS(formatHHMMSS(n)) === n."

describe('round-trip property: parseHHMMSS(formatHHMMSS(n)) === n', () => {
  // Representative values covering edge cases and a broad range
  const testCases: number[] = [
    // Boundary / edge cases
    0,
    1,
    59,
    60,
    61,
    3599,
    3600,
    3601,
    3661,
    7199,
    7200,
    86399,
    86400,
    // Larger values (multi-day durations)
    90000,
    172800,
    360000,
    // Sweep: every second from 0 to 7200 (2 hours)
    ...Array.from({ length: 7201 }, (_, i) => i),
    // Sweep: every minute boundary from 0 to 24 hours
    ...Array.from({ length: 1441 }, (_, i) => i * 60),
    // Sweep: every hour boundary from 0 to 100 hours
    ...Array.from({ length: 101 }, (_, i) => i * 3600),
  ]

  // Deduplicate for efficiency
  const uniqueCases = [...new Set(testCases)]

  it(`satisfies the round-trip for ${uniqueCases.length} representative values`, () => {
    for (const n of uniqueCases) {
      const result = parseHHMMSS(formatHHMMSS(n))
      expect(result, `round-trip failed for n=${n}: got ${result}`).toBe(n)
    }
  })
})
