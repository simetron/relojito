// ─── TimerCardSkeleton ────────────────────────────────────────────────────────
// Animated skeleton that mimics the idle state of a TimerCard.
// Used while timer data is loading on the Dashboard.
// Satisfies Req 12.1 (skeleton loading states for the timer grid).

export default function TimerCardSkeleton() {
  return (
    <div
      className="rounded-xl flex items-center justify-between p-lg animate-pulse"
      style={{
        backgroundColor: 'var(--color-surface-container-lowest)',
        border: '1px solid var(--color-outline-variant)',
      }}
      aria-hidden="true"
    >
      {/* Left: colored square + text placeholders */}
      <div className="flex items-center gap-lg">
        {/* Colored square placeholder */}
        <div
          className="w-14 h-14 rounded-lg flex-shrink-0"
          style={{ backgroundColor: 'var(--color-surface-container-highest)' }}
        />

        {/* Name + subtitle placeholders */}
        <div className="flex flex-col gap-2">
          {/* Timer name */}
          <div
            className="h-[18px] w-28 rounded"
            style={{ backgroundColor: 'var(--color-surface-container-high)' }}
          />
          {/* "Today: Xm" subtitle */}
          <div
            className="h-[14px] w-16 rounded"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          />
        </div>
      </div>

      {/* Right: START button placeholder */}
      <div
        className="h-8 w-14 rounded-lg flex-shrink-0"
        style={{ backgroundColor: 'var(--color-surface-container-high)' }}
      />
    </div>
  )
}
