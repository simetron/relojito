'use client'

import { useState, useTransition, useEffect } from 'react'
import { getStatsData, type TimerStat } from '@/app/actions/stats'
import DonutChart from '@/components/stats/DonutChart'
import { BRAND_ICONS } from '@/lib/utils/timerConstants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsClientProps {
  initialStats: TimerStat[]
  initialError?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTotalTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatBreakdownTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsClient({
  initialStats,
  initialError,
}: StatsClientProps) {
  const [rangeDays, setRangeDays] = useState<7 | 30>(7)
  const [stats, setStats] = useState<TimerStat[]>(initialStats)
  const [fetchError, setFetchError] = useState<string | undefined>(initialError)
  const [isPending, startTransition] = useTransition()
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
        setFetchError(undefined)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays])

  const totalSeconds = stats.reduce((sum, s) => sum + s.total_seconds, 0)
  const totalLabel = formatTotalTime(totalSeconds)
  const sortedStats = [...stats].sort((a, b) => b.total_seconds - a.total_seconds)
  const donutSegments = sortedStats.map((s) => ({
    color: s.timer_color,
    value: s.total_seconds,
  }))

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

      {/* Time range selector */}
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

        {/* Donut chart */}
        {sortedStats.length > 0 && (
          <>
            <div className="flex justify-center mb-xl">
              <DonutChart
                segments={donutSegments}
                totalLabel={totalLabel}
                size={200}
              />
            </div>

            {/* Breakdown list */}
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
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: stat.timer_color }}
                      aria-hidden="true"
                    >
                      <i className={`${BRAND_ICONS.has(stat.timer_icon) ? 'fa-brands' : 'fa-solid'} fa-${stat.timer_icon} text-[16px] text-white`} />
                    </div>

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
