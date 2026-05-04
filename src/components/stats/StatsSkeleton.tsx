// ─── StatsSkeleton ────────────────────────────────────────────────────────────
// Animated skeleton for the Stats screen while data is loading.
// Satisfies Req 11.3 (skeleton loading states).

export default function StatsSkeleton() {
  return (
    <div className="animate-pulse min-h-screen py-lg" aria-busy="true" aria-label="Loading stats">
      {/* Page heading skeleton */}
      <div className="mb-xl">
        <div
          className="h-8 w-20 rounded"
          style={{ backgroundColor: 'var(--color-surface-container-high)' }}
        />
      </div>

      {/* Time range selector skeleton — two pill buttons */}
      <div className="flex gap-sm mb-xl">
        <div
          className="h-9 w-20 rounded-full"
          style={{ backgroundColor: 'var(--color-surface-container-high)' }}
        />
        <div
          className="h-9 w-20 rounded-full"
          style={{ backgroundColor: 'var(--color-surface-container)' }}
        />
      </div>

      {/* Donut chart skeleton — circular placeholder */}
      <div className="flex justify-center mb-xl">
        <div
          className="rounded-full"
          style={{
            width: 200,
            height: 200,
            backgroundColor: 'var(--color-surface-container-high)',
          }}
        />
      </div>

      {/* Breakdown list skeletons */}
      <div className="flex flex-col gap-md">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl p-md flex items-center gap-md"
            style={{
              backgroundColor: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)',
            }}
          >
            {/* Icon square skeleton */}
            <div
              className="w-10 h-10 rounded-lg flex-shrink-0"
              style={{ backgroundColor: 'var(--color-surface-container-high)' }}
            />

            {/* Text + progress bar skeleton */}
            <div className="flex-grow flex flex-col gap-2">
              <div className="flex justify-between items-center gap-2">
                {/* Timer name */}
                <div
                  className="h-4 rounded"
                  style={{
                    width: `${60 + i * 10}px`,
                    backgroundColor: 'var(--color-surface-container-high)',
                  }}
                />
                {/* Hours + percentage */}
                <div className="flex gap-sm">
                  <div
                    className="h-4 w-12 rounded"
                    style={{ backgroundColor: 'var(--color-surface-container-high)' }}
                  />
                  <div
                    className="h-4 w-8 rounded"
                    style={{ backgroundColor: 'var(--color-surface-container)' }}
                  />
                </div>
              </div>
              {/* Progress bar */}
              <div
                className="h-2 w-full rounded-full"
                style={{ backgroundColor: 'var(--color-surface-container-high)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
