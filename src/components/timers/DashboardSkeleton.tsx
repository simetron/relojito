// ─── DashboardSkeleton ────────────────────────────────────────────────────────
// Animated skeleton for the Dashboard timer grid while data is loading.
// Renders a date-heading placeholder and a list of TimerCardSkeleton items.
// Satisfies Req 12.1 (skeleton loading states for the timer grid).

import TimerCardSkeleton from './TimerCardSkeleton'

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen py-lg animate-pulse" aria-busy="true" aria-label="Loading timers">
      {/* Date heading skeleton */}
      <div className="mb-xl flex flex-col gap-[4px]">
        <div
          className="h-8 w-32 rounded"
          style={{ backgroundColor: 'var(--color-surface-container-high)' }}
        />
        <div
          className="h-4 w-56 rounded"
          style={{ backgroundColor: 'var(--color-surface-container)' }}
        />
      </div>

      {/* Timer card skeletons */}
      <div className="flex flex-col gap-md">
        {[0, 1, 2, 3].map((i) => (
          <TimerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
