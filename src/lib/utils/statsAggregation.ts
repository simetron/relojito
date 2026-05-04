// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionRow {
  id: string
  timer_id: string
  duration_seconds: number | null
  timers: {
    name: string
    color: string
    icon: string
  }
}

export interface TimerStat {
  timer_id: string
  timer_name: string
  timer_color: string
  timer_icon: string
  total_seconds: number
  session_count: number
}

// ─── aggregateStats ───────────────────────────────────────────────────────────

/**
 * Aggregate sessions by timer, summing duration_seconds.
 * Sessions with null duration_seconds contribute 0.
 *
 * Mirrors the Map-based aggregation loop in getStatsData (stats.ts) but as a
 * pure function with no Supabase or server-side dependencies.
 */
export function aggregateStats(sessions: SessionRow[]): TimerStat[] {
  const aggregateMap = new Map<string, TimerStat>()

  for (const row of sessions) {
    const existing = aggregateMap.get(row.timer_id)
    if (existing) {
      existing.total_seconds += row.duration_seconds ?? 0
      existing.session_count += 1
    } else {
      aggregateMap.set(row.timer_id, {
        timer_id: row.timer_id,
        timer_name: row.timers.name,
        timer_color: row.timers.color,
        timer_icon: row.timers.icon,
        total_seconds: row.duration_seconds ?? 0,
        session_count: 1,
      })
    }
  }

  return Array.from(aggregateMap.values())
}
