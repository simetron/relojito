import { describe, it, expect } from 'vitest'
import { aggregateStats, type SessionRow } from '../statsAggregation'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSession(
  id: string,
  timer_id: string,
  duration_seconds: number | null,
  timerName = 'Timer',
  timerColor = '#ff0000',
  timerIcon = 'clock',
): SessionRow {
  return {
    id,
    timer_id,
    duration_seconds,
    timers: { name: timerName, color: timerColor, icon: timerIcon },
  }
}

// ─── Unit tests ───────────────────────────────────────────────────────────────

describe('aggregateStats', () => {
  it('returns an empty array for an empty session list', () => {
    expect(aggregateStats([])).toEqual([])
  })

  it('returns one stat for a single session', () => {
    const sessions = [makeSession('s1', 't1', 120, 'Work', '#aabbcc', 'briefcase')]
    const result = aggregateStats(sessions)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      timer_id: 't1',
      timer_name: 'Work',
      timer_color: '#aabbcc',
      timer_icon: 'briefcase',
      total_seconds: 120,
      session_count: 1,
    })
  })

  it('sums duration_seconds for multiple sessions belonging to the same timer', () => {
    const sessions = [
      makeSession('s1', 't1', 60),
      makeSession('s2', 't1', 90),
      makeSession('s3', 't1', 30),
    ]
    const result = aggregateStats(sessions)

    expect(result).toHaveLength(1)
    expect(result[0].total_seconds).toBe(180)
    expect(result[0].session_count).toBe(3)
  })

  it('aggregates sessions across multiple timers independently', () => {
    const sessions = [
      makeSession('s1', 't1', 100, 'Work', '#111111', 'briefcase'),
      makeSession('s2', 't2', 200, 'Exercise', '#222222', 'dumbbell'),
      makeSession('s3', 't1', 50, 'Work', '#111111', 'briefcase'),
      makeSession('s4', 't2', 75, 'Exercise', '#222222', 'dumbbell'),
    ]
    const result = aggregateStats(sessions)

    expect(result).toHaveLength(2)

    const t1 = result.find((s) => s.timer_id === 't1')!
    expect(t1.total_seconds).toBe(150)
    expect(t1.session_count).toBe(2)
    expect(t1.timer_name).toBe('Work')

    const t2 = result.find((s) => s.timer_id === 't2')!
    expect(t2.total_seconds).toBe(275)
    expect(t2.session_count).toBe(2)
    expect(t2.timer_name).toBe('Exercise')
  })

  it('treats null duration_seconds as 0', () => {
    const sessions = [
      makeSession('s1', 't1', null),
      makeSession('s2', 't1', 60),
      makeSession('s3', 't1', null),
    ]
    const result = aggregateStats(sessions)

    expect(result).toHaveLength(1)
    expect(result[0].total_seconds).toBe(60)
    expect(result[0].session_count).toBe(3)
  })

  it('returns total_seconds of 0 when all sessions have null duration', () => {
    const sessions = [
      makeSession('s1', 't1', null),
      makeSession('s2', 't1', null),
    ]
    const result = aggregateStats(sessions)

    expect(result).toHaveLength(1)
    expect(result[0].total_seconds).toBe(0)
  })
})

// ─── Model-based property test ────────────────────────────────────────────────
//
// Validates: Requirements Property 4
// "For a randomly generated set of Sessions, verify that the aggregation
//  function returns the same total as a naive reduce sum."
//
// We use a representative set of session arrays (covering edge cases and a
// broad range of inputs) to verify that:
//   aggregateStats(sessions).reduce((sum, s) => sum + s.total_seconds, 0)
//   === sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)

describe('property: aggregateStats total equals naive reduce sum', () => {
  // Build a varied set of session arrays to act as our "random" inputs
  const testCases: SessionRow[][] = [
    // Empty
    [],

    // Single session, various durations
    [makeSession('s1', 't1', 0)],
    [makeSession('s1', 't1', 1)],
    [makeSession('s1', 't1', 3600)],
    [makeSession('s1', 't1', null)],

    // All sessions for one timer
    [makeSession('s1', 't1', 60), makeSession('s2', 't1', 90)],
    [makeSession('s1', 't1', null), makeSession('s2', 't1', 120)],
    [makeSession('s1', 't1', null), makeSession('s2', 't1', null)],

    // Sessions across two timers
    [makeSession('s1', 't1', 100), makeSession('s2', 't2', 200)],
    [makeSession('s1', 't1', null), makeSession('s2', 't2', 300)],

    // Sessions across three timers with mixed nulls
    [
      makeSession('s1', 't1', 50),
      makeSession('s2', 't2', null),
      makeSession('s3', 't3', 150),
      makeSession('s4', 't1', 25),
      makeSession('s5', 't2', 75),
    ],

    // Large durations
    [makeSession('s1', 't1', 86400), makeSession('s2', 't1', 86400)],

    // Many sessions for one timer (sweep 1–100 seconds)
    Array.from({ length: 100 }, (_, i) =>
      makeSession(`s${i}`, 't1', i + 1),
    ),

    // Many sessions across many timers
    Array.from({ length: 50 }, (_, i) =>
      makeSession(`s${i}`, `t${i % 5}`, i % 3 === 0 ? null : i * 10),
    ),

    // Alternating null and non-null across multiple timers
    Array.from({ length: 20 }, (_, i) =>
      makeSession(`s${i}`, `t${i % 4}`, i % 2 === 0 ? null : i * 7),
    ),
  ]

  it(`satisfies the total-preservation property for ${testCases.length} representative session arrays`, () => {
    for (const sessions of testCases) {
      const naiveTotal = sessions.reduce(
        (sum, s) => sum + (s.duration_seconds ?? 0),
        0,
      )
      const aggregatedTotal = aggregateStats(sessions).reduce(
        (sum, s) => sum + s.total_seconds,
        0,
      )
      expect(
        aggregatedTotal,
        `total mismatch for sessions: ${JSON.stringify(sessions.map((s) => s.duration_seconds))}`,
      ).toBe(naiveTotal)
    }
  })
})
