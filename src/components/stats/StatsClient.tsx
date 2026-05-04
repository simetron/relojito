'use client'

import { useState, useTransition, useEffect } from 'react'
import { getStatsData, type TimerStat, type RawSession } from '@/app/actions/stats'
import DonutChart from '@/components/stats/DonutChart'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsClientProps {
  initialStats: TimerStat[]
  initialSessions: RawSession[]
  initialError?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format total seconds as a human-readable string for the donut center.
 * < 60s → "Xs"
 * < 3600s → "Xm"
 * ≥ 3600s → "Xh Ym"
 */
function formatTotalTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/**
 * Format total seconds as a breakdown label (e.g. "2h 34m" or "45m").
 */
function formatBreakdownTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/**
 * Pure JS overlap detection — no Supabase.
 * Two intervals overlap if A.start < B.end AND A.end > B.start.
 * Satisfies Req 5 AC 6.
 */
function hasAnyOverlap(sessions: RawSession[]): boolean {
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i]
      const b = sessions[j]
      if (
        new Date(a.start_time) < new Date(b.end_time) &&
        new Date(a.end_time) > new Date(b.start_time)
      ) {
        return true
      }
    }
  }
  return false
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsClient({
  initialStats,
  initialSessions,
  initialError,
}: StatsClientProps) {
  const [rangeDays, setRangeDays] = useState<7 | 30>(7)
  const [stats, setStats] = useState<TimerStat[]>(initialStats)
  const [sessions, setSessions] = useState<RawSession[]>(initialSessions)
  const [fetchError, setFetchError] = useState<string | undefined>(initialError)
  const [overlapDismissed, setOverlapDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Re-fetch when range changes.
  // We track whether this is the initial mount to skip the redundant fetch
  // (initial data for 7 days is already provided via SSR).
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true)
      return
    }
    startTransition(async () => {
      const result = await getStatsData(rangeDays)
      if (result.error) {
        setFetchError(result.error)
      } else {
        setStats(result.stats)
        setSessions(result.sessions)
        setFetchError(undefined)
        // Reset overlap dismissal when range changes
        setOverlapDismissed(false)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays])

  // ── Derived values ─────────────────────────────────────────────────────────

  const totalSeconds = stats.reduce((sum, s) => sum + s.total_seconds, 0)
  const totalLabel = formatTotalTime(totalSeconds)

  // Sort by total_seconds DESC for breakdown list
  const sortedStats = [...stats].sort((a, b) => b.total_seconds - a.total_seconds)

  const donutSegments = sortedStats.map((s) => ({
    color: s.timer_color,
    value: s.total_seconds,
  }))

  const showOverlapNotice =
    !overlapDismissed && sessions.length > 1 && hasAnyOverlap(sessions)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen py-lg">
      {/* Page heading */}
      <div className="mb-xl">
        <h1
          className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold"
          style={{ color: 'var(--color-primary)' }}
        >
          Stats
        </h1>
      </div>

      {/* Time range selector — Req 5 AC 4 */}
      <div className="flex gap-sm mb-lg" role="group" aria-label="Time range">
        {([7, 30] as const).map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => setRangeDays(days)}
            className="px-md py-sm rounded-full text-[14px] font-medium transition-colors"
            style={
              rangeDays === days
                ? {
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--color-on-secondary)',
                  }
                : {
                    backgroundColor: 'var(--color-surface-container)',
                    color: 'var(--color-on-surface-variant)',
                  }
            }
            aria-pressed={rangeDays === days}
          >
            {days} days
          </button>
        ))}
      </div>

      {/* Overlap notice — Req 5 AC 6 */}
      {showOverlapNotice && (
        <div
          className="mb-lg flex items-center gap-sm px-md py-sm rounded-xl"
          style={{
            backgroundColor: 'var(--color-error-container)',
            color: 'var(--color-on-error-container)',
          }}
          role="alert"
        >
          <i
            className="fa-solid fa-triangle-exclamation text-[14px] flex-shrink-0"
            aria-hidden="true"
          />
          <span className="flex-1 text-[13px]">
            Some sessions in this range overlap. Total time may exceed real elapsed time.
          </span>
          <button
            type="button"
            onClick={() => setOverlapDismissed(true)}
            className="text-[12px] font-semibold px-sm py-1 rounded-lg flex-shrink-0 transition-opacity hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-on-error-container)',
              color: 'var(--color-error-container)',
            }}
            aria-label="Accept and dismiss overlap notice"
          >
            Accept
          </button>
        </div>
      )}

      {/* Fetch error */}
      {fetchError && (
        <div
          className="mb-lg flex items-center gap-sm px-md py-sm rounded-xl"
          style={{
            backgroundColor: 'var(--color-error-container)',
            color: 'var(--color-on-error-container)',
          }}
          role="alert"
        >
          <i className="fa-solid fa-circle-exclamation text-[14px] flex-shrink-0" aria-hidden="true" />
          <span className="text-[13px]">{fetchError}</span>
        </div>
      )}

      {/* Content area — dimmed while re-fetching */}
      <div
        className="transition-opacity"
        style={{ opacity: isPending ? 0.5 : 1 }}
        aria-busy={isPending}
      >
        {/* Empty state */}
        {!fetchError && sortedStats.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-xl gap-md rounded-xl"
            style={{
              border: '2px dashed var(--color-outline-variant)',
              color: 'var(--color-on-surface-variant)',
            }}
          >
            <i className="fa-solid fa-clock text-[40px] opacity-30" aria-hidden="true" />
            <p className="text-[14px] text-center">
              No sessions in the last {rangeDays} days. Start a timer to begin tracking.
            </p>
          </div>
        )}

        {/* Donut chart — Req 5 AC 1 & 2 */}
        {sortedStats.length > 0 && (
          <>
            <div className="flex justify-center mb-xl">
              <DonutChart
                segments={donutSegments}
                totalLabel={totalLabel}
                size={200}
              />
            </div>

            {/* Breakdown list — Req 5 AC 3 */}
            <div className="flex flex-col gap-md">
              {sortedStats.map((stat) => {
                const pct =
                  totalSeconds > 0
                    ? Math.round((stat.total_seconds / totalSeconds) * 100)
                    : 0

                return (
                  <div
                    key={stat.timer_id}
                    className="rounded-xl p-md flex items-center gap-md"
                    style={{
                      backgroundColor: 'var(--color-surface-container-lowest)',
                      border: '1px solid var(--color-outline-variant)',
                    }}
                  >
                    {/* Timer icon square */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: stat.timer_color }}
                      aria-hidden="true"
                    >
                      <i
                        className={`fa-solid fa-${stat.timer_icon} text-[16px] text-white`}
                      />
                    </div>

                    {/* Name, hours, percentage, progress bar */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-sm mb-1">
                        <span
                          className="text-[15px] font-semibold truncate"
                          style={{ color: 'var(--color-on-surface)' }}
                        >
                          {stat.timer_name}
                        </span>
                        <div className="flex items-center gap-sm flex-shrink-0">
                          <span
                            className="text-[13px] font-medium"
                            style={{ color: 'var(--color-on-surface)' }}
                          >
                            {formatBreakdownTime(stat.total_seconds)}
                          </span>
                          <span
                            className="text-[12px] font-medium tracking-[0.02em] px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 'var(--color-surface-container-high)',
                              color: 'var(--color-on-surface-variant)',
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </div>

                      {/* Proportional progress bar */}
                      <div
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-surface-container-high)' }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${stat.timer_name}: ${pct}% of total`}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: stat.timer_color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
