// ─── HistorySkeleton ──────────────────────────────────────────────────────────
// Animated skeleton for the History screen while data is loading.
// Satisfies Req 11.3 (skeleton loading states).

export default function HistorySkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading history">
      {/* Repeat 3 day group skeletons */}
      {[0, 1, 2].map((groupIdx) => (
        <div key={groupIdx} className="mb-10">
          {/* Day group header skeleton */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div
              className="h-5 w-24 rounded"
              style={{ backgroundColor: 'var(--color-surface-container-high)' }}
            />
            <div
              className="h-5 w-14 rounded-full"
              style={{ backgroundColor: 'var(--color-surface-container-high)' }}
            />
          </div>

          {/* Session row skeletons */}
          <div className="flex flex-col gap-3">
            {[0, 1, groupIdx === 0 ? 2 : -1].filter((i) => i >= 0).map((rowIdx) => (
              <div
                key={rowIdx}
                className="rounded-xl p-4 flex items-center gap-4"
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

                {/* Text content skeleton */}
                <div className="flex-grow flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div
                      className="h-4 w-28 rounded"
                      style={{ backgroundColor: 'var(--color-surface-container-high)' }}
                    />
                    <div
                      className="h-5 w-12 rounded"
                      style={{ backgroundColor: 'var(--color-surface-container-high)' }}
                    />
                  </div>
                  <div
                    className="h-3 w-36 rounded"
                    style={{ backgroundColor: 'var(--color-surface-container)' }}
                  />
                </div>

                {/* Chevron skeleton */}
                <div
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-surface-container-high)' }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
