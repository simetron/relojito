'use client'

import { useState } from 'react'
import { stopTimer, discardSession } from '@/app/actions/sessions'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecoveryBannerProps {
  sessionId: string
  timerName: string
  onDismiss?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Displayed when the user opens the app and an orphaned active session exists.
 * Offers Stop (close with current time) or Discard (delete) actions.
 * Satisfies Req 3.7.
 */
export default function RecoveryBanner({ sessionId, timerName, onDismiss }: RecoveryBannerProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState<'stop' | 'discard' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!visible) return null

  const handleStop = async () => {
    setLoading('stop')
    setError(null)
    const result = await stopTimer(sessionId)
    if (result.error) {
      setError(result.error)
      setLoading(null)
      return
    }
    setVisible(false)
    onDismiss?.()
    router.refresh()
  }

  const handleDiscard = async () => {
    setLoading('discard')
    setError(null)
    const result = await discardSession(sessionId)
    if (result.error) {
      setError(result.error)
      setLoading(null)
      return
    }
    setVisible(false)
    onDismiss?.()
    router.refresh()
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-0 left-0 right-0 z-50 xl:left-60"
      style={{
        backgroundColor: 'var(--color-secondary)',
        color: 'var(--color-on-secondary)',
      }}
    >
      <div
        className="
          mx-auto
          w-full
          max-w-full
          xl:max-w-[800px]
          px-md
          xl:px-0
          py-md
          flex
          flex-col
          sm:flex-row
          sm:items-center
          gap-sm
        "
      >
        {/* Message */}
        <div className="flex items-center gap-sm flex-1 min-w-0">
          <i className="fa-solid fa-clock-rotate-left text-[16px] flex-shrink-0" aria-hidden="true" />
          <p className="text-[14px] leading-[1.5] truncate">
            You have an active session for{' '}
            <strong className="font-semibold">{timerName}</strong>. What would you like to do?
          </p>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-[12px] opacity-80">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-sm flex-shrink-0">
          <button
            type="button"
            onClick={handleStop}
            disabled={loading !== null}
            className="px-md py-sm rounded-lg text-[12px] font-medium tracking-[0.02em] transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-on-secondary)',
              color: 'var(--color-secondary)',
            }}
            aria-label="Stop the active session"
          >
            {loading === 'stop' ? 'Stopping…' : 'Stop'}
          </button>

          <button
            type="button"
            onClick={handleDiscard}
            disabled={loading !== null}
            className="px-md py-sm rounded-lg text-[12px] font-medium tracking-[0.02em] transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              border: '2px solid rgba(255,255,255,0.6)',
              backgroundColor: 'transparent',
              color: 'var(--color-on-secondary)',
            }}
            aria-label="Discard the active session"
          >
            {loading === 'discard' ? 'Discarding…' : 'Discard'}
          </button>
        </div>
      </div>
    </div>
  )
}
