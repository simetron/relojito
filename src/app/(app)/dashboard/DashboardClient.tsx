'use client'

import { useEffect, useState } from 'react'
import TimerCard from '@/components/timers/TimerCard'
import CreateTimerModal from '@/components/timers/CreateTimerModal'
import ReorderModal from '@/components/timers/ReorderModal'
import type { Timer, ActiveSession } from '@/components/timers/TimerCard'
import { startTimer, stopTimer } from '@/app/actions/sessions'
import { useRealtimeSession } from '@/lib/realtime/RealtimeSessionContext'
import { useTranslation } from '@/lib/i18n/useTranslation'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DashboardClientProps {
  timers: Timer[]
  allTimers: Timer[]
  todaySecondsMap: Record<string, number>
  dateHeading: string
  initialActiveSession?: ActiveSession & { timer_id: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a Date as "Month Day" in the given locale (e.g. "May 4" or "4 de mayo").
 */
function formatDateHeadingLocale(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardClient({
  timers,
  allTimers,
  todaySecondsMap,
  dateHeading,
  initialActiveSession,
}: DashboardClientProps) {
  const { t, locale } = useTranslation()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showReorderModal, setShowReorderModal] = useState(false)
  const [shortSessionToast, setShortSessionToast] = useState(false)

  // Compute locale-aware date heading on the client
  const localizedDateHeading = formatDateHeadingLocale(new Date(), locale)

  const [activeTimerId, setActiveTimerId] = useState<string | null>(
    initialActiveSession?.timer_id ?? null
  )
  const [activeSession, setActiveSession] = useState<(ActiveSession & { timer_id: string }) | null>(
    initialActiveSession ?? null
  )

  // ─── Realtime sync ──────────────────────────────────────────────────────────

  const { lastPayload } = useRealtimeSession()

  useEffect(() => {
    if (!lastPayload) return

    const { eventType } = lastPayload

    if (eventType === 'INSERT') {
      const newRow = lastPayload.new
      if (newRow.end_time === null && newRow.id !== activeSession?.id) {
        setActiveTimerId(newRow.timer_id)
        setActiveSession({
          id: newRow.id,
          timer_id: newRow.timer_id,
          start_time: newRow.start_time,
        })
      }
    }

    if (eventType === 'UPDATE') {
      const updatedRow = lastPayload.new
      if (updatedRow.end_time !== null) {
        if (updatedRow.id === activeSession?.id || updatedRow.timer_id === activeTimerId) {
          setActiveTimerId(null)
          setActiveSession(null)
        }
      }
    }
  }, [lastPayload]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async (timer: Timer) => {
    const optimisticSession = {
      id: 'pending',
      timer_id: timer.id,
      start_time: new Date().toISOString(),
    }
    setActiveTimerId(timer.id)
    setActiveSession(optimisticSession)

    const result = await startTimer(timer.id)

    if (result.error) {
      setActiveTimerId(null)
      setActiveSession(null)
      console.error('Failed to start timer:', result.error)
      return
    }

    if (result.data) {
      setActiveSession({
        id: result.data.id,
        timer_id: result.data.timer_id,
        start_time: result.data.start_time,
      })
    }
  }

  const handleStop = async (sessionId: string) => {
    setActiveTimerId(null)
    setActiveSession(null)

    const result = await stopTimer(sessionId)

    if (result.error) {
      console.error('Failed to stop timer:', result.error)
    }

    if (result.discarded) {
      setShortSessionToast(true)
      setTimeout(() => setShortSessionToast(false), 4000)
    }
  }

  return (
    <div className="min-h-screen py-lg">
      {/* Date heading */}
      <div className="mb-xl flex items-start justify-between gap-md">
        <div className="flex flex-col gap-[4px]">
          <h1
            className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold"
            style={{ color: 'var(--color-primary)' }}
          >
            {localizedDateHeading}
          </h1>
          <p
            className="text-[14px] leading-[1.5]"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            {t('dashboard.tagline')}
          </p>
        </div>

        {(timers.length > 1 || allTimers.some(t => !t.is_active)) && (
          <button
            type="button"
            onClick={() => setShowReorderModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface-container)',
              color: 'var(--color-on-surface-variant)',
              border: '1px solid var(--color-outline-variant)',
            }}
            aria-label="Reorder timers"
          >
            <i className="fa-solid fa-pencil text-[14px]" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Timer list */}
      {timers.length === 0 ? (
        <div className="flex flex-col gap-md">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-md p-lg rounded-xl transition-colors active:scale-[0.99]"
            style={{
              border: '2px dashed var(--color-outline-variant)',
              color: 'var(--color-on-surface-variant)',
              backgroundColor: 'transparent',
            }}
            aria-label="Create new timer"
          >
            <i className="fa-solid fa-clock text-[40px] opacity-30" aria-hidden="true" />
            <p className="text-[14px] text-center">
              {t('dashboard.noTimers')}
            </p>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {timers.map((timer) => {
            const isThisTimerActive = activeTimerId === timer.id
            const isAnotherTimerActive = !!activeTimerId && !isThisTimerActive

            return (
              <TimerCard
                key={timer.id}
                timer={timer}
                todaySeconds={todaySecondsMap[timer.id] ?? 0}
                onStart={handleStart}
                onStop={handleStop}
                activeSession={
                  isThisTimerActive && activeSession
                    ? { id: activeSession.id, start_time: activeSession.start_time }
                    : undefined
                }
                disabled={isAnotherTimerActive}
              />
            )
          })}

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-sm p-lg rounded-xl transition-colors active:scale-[0.99]"
            style={{
              border: '2px dashed var(--color-outline-variant)',
              color: 'var(--color-on-surface-variant)',
              backgroundColor: 'transparent',
            }}
            aria-label="Create new timer"
          >
            <span className="text-[14px] font-medium">{t('dashboard.newTimer')}</span>
          </button>
        </div>
      )}

      {/* Short session toast */}
      {shortSessionToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 xl:bottom-6 left-4 right-4 xl:left-1/2 xl:right-auto xl:-translate-x-1/2 z-50 flex items-center gap-sm px-lg py-md rounded-xl shadow-lg text-[13px] font-medium xl:whitespace-nowrap"
          style={{
            backgroundColor: 'var(--color-surface-container-high)',
            color: 'var(--color-on-surface)',
            border: '1px solid var(--color-outline-variant)',
          }}
        >
          <i className="fa-solid fa-clock text-[14px] flex-shrink-0" style={{ color: 'var(--color-outline)' }} aria-hidden="true" />
          {t('dashboard.shortSession')}
        </div>
      )}

      {showCreateModal && (
        <CreateTimerModal onClose={() => setShowCreateModal(false)} />
      )}

      {showReorderModal && (
        <ReorderModal
          timers={allTimers}
          onClose={() => setShowReorderModal(false)}
        />
      )}
    </div>
  )
}
