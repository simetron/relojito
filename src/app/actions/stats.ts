'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimerStat {
  timer_id: string
  timer_name: string
  timer_color: string
  timer_icon: string
  total_seconds: number
  session_count: number
}

export interface RawSession {
  id: string
  start_time: string
  end_time: string
}

export interface GetStatsResult {
  stats: TimerStat[]
  sessions: RawSession[]
  error?: string
}

// ─── getStatsData ─────────────────────────────────────────────────────────────

/**
 * Fetches aggregated stats for the authenticated user over the given range.
 * Satisfies Req 5 AC 1–5.
 *
 * Supabase JS client doesn't support GROUP BY directly, so we fetch all
 * matching sessions with timer join and aggregate in JS.
 */
export async function getStatsData(rangeDays: 7 | 30): Promise<GetStatsResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { stats: [], sessions: [], error: 'Not authenticated' }
  }

  // Compute range start in UTC
  const rangeStart = new Date()
  rangeStart.setUTCDate(rangeStart.getUTCDate() - rangeDays)
  rangeStart.setUTCHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      timer_id,
      start_time,
      end_time,
      duration_seconds,
      timers!inner (
        name,
        color,
        icon
      )
    `)
    .eq('user_id', user.id)
    .not('end_time', 'is', null)
    .gte('start_time', rangeStart.toISOString())
    .order('start_time', { ascending: false })

  if (error) {
    return { stats: [], sessions: [], error: 'Failed to fetch stats.' }
  }

  // ── Aggregate in JS ─────────────────────────────────────────────────────────

  const aggregateMap = new Map<string, TimerStat>()
  const rawSessions: RawSession[] = []

  for (const row of data ?? []) {
    const timer = Array.isArray(row.timers) ? row.timers[0] : row.timers
    const t = timer as { name: string; color: string; icon: string }

    // Accumulate per-timer stats
    const existing = aggregateMap.get(row.timer_id)
    if (existing) {
      existing.total_seconds += row.duration_seconds ?? 0
      existing.session_count += 1
    } else {
      aggregateMap.set(row.timer_id, {
        timer_id: row.timer_id,
        timer_name: t.name,
        timer_color: t.color,
        timer_icon: t.icon,
        total_seconds: row.duration_seconds ?? 0,
        session_count: 1,
      })
    }

    // Collect raw sessions for overlap detection
    if (row.end_time) {
      rawSessions.push({
        id: row.id,
        start_time: row.start_time,
        end_time: row.end_time,
      })
    }
  }

  const stats = Array.from(aggregateMap.values())

  return { stats, sessions: rawSessions }
}
