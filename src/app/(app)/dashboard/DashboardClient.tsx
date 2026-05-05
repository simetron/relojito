'use client'

import { useEffect, useState } from 'react'
import TimerCard from '@/components/timers/TimerCard'
import CreateTimerModal from '@/components/timers/CreateTimerModal'
import RecoveryBanner from '@/components/layout/RecoveryBanner'
import type { Timer, ActiveSession } from '@/components/timers/TimerCard'
import { startTimer, stopTimer } from '@/app/actions/sessions'
import { useRealtimeSession } from '@/lib/realtime/RealtimeSessionContext'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DashboardClientProps {
  timers: Timer[]
  todaySecondsMap: Record<string, number>
  dateHeading: string
  /** Pre-existing active session loaded server-side (if any) */
  initialActiveSession?: ActiveSession & { timer_id: string; timerName: string }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardClient({
  timers,
  todaySecondsMap,
  dateHeading,
  initialActiveSession,
}: DashboardClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [shortSessionToast, setShortSessionToast] = useState(false)

  // Track which timer has an active session and the session details
  const [activeTimerId, setActiveTimerId] = useState<string | null>(
    initialActiveSession?.timer_id ?? null
  )
  const [activeSession, setActiveSession] = useState<(ActiveSession & { timer_id: string }) | null>(
    initialActiveSession ?? null
  )

  // Recovery banner: only show for sessions the user hasn't acknowledged yet.
  // We use sessionStorage to remember which session IDs have been seen,
  // so navigating away and back doesn't re-show the banner for a running timer.
  const [showRecovery, setShowRecovery] = useState(false)
  const [userStarted, setUserStarted] = useState(false)

  useEffect(() => {
    if (!initialActiveSession) return
    const key = `recovery-seen-${initialActiveSession.id}`
    const alreadySeen = sessionStorage.getItem(key)
    if (!alreadySeen) {
      setShowRecovery(true)
    }
  }, [initialActiveSession?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const dismissRecovery = () => {
    if (initialActiveSession) {
      sessionStorage.setItem(`recovery-seen-${initialActiveSession.id}`, '1')
    }
    setShowRecovery(false)
  }

  // ─── Realtime sync ──────────────────────────────────────────────────────────

  const { lastPayload } = useRealtimeSession()

  useEffect(() => {
    if (!lastPayload) return

    const { eventType } = lastPayload

    // Task 7.2 — INSERT: a new session was started (possibly on another device)
    if (eventType === 'INSERT') {
      const newRow = lastPayload.new
      // Only act if this is an active session (no end_time) and it's not
      // already the session we're tracking (avoids double-applying our own
      // optimistic update).
      if (newRow.end_time === null && newRow.id !== activeSession?.id) {
        setActiveTimerId(newRow.timer_id)
        setActiveSession({
          id: newRow.id,
          timer_id: newRow.timer_id,
          start_time: newRow.start_time,
        })
      }
    }

    // Task 7.3 — UPDATE: a session was stopped (end_time is now set)
    if (eventType === 'UPDATE') {
      const updatedRow = lastPayload.new
      if (updatedRow.end_time !== null) {
        // Only clear state if this update is for the currently active session
        if (updatedRow.id === activeSession?.id || updatedRow.timer_id === activeTimerId) {
          setActiveTimerId(null)
          setActiveSession(null)
        }
      }
    }
  }, [lastPayload]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async (timer: Timer) => {
    // User is starting a timer themselves — dismiss recovery banner
    dismissRecovery()
    setUserStarted(true)

    // Optimistically update UI before server responds
    const optimisticSession = {
      id: 'pending',
      timer_id: timer.id,
      start_time: new Date().toISOString(),
    }
    setActiveTimerId(timer.id)
    setActiveSession(optimisticSession)

    const result = await startTimer(timer.id)

    if (result.error) {
      // Revert optimistic update on error
      setActiveTimerId(null)
      setActiveSession(null)
      console.error('Failed to start timer:', result.error)
      return
    }

    // Update with real session data from server
    if (result.data) {
      setActiveSession({
        id: result.data.id,
        timer_id: result.data.timer_id,
        start_time: result.data.start_time,
      })
    }
  }

  const handleStop = async (sessionId: string) => {
    // Optimistically clear running state
    setActiveTimerId(null)
    setActiveSession(null)

    const result = await stopTimer(sessionId)

    if (result.error) {
      console.error('Failed to stop timer:', result.error)
    }

    // Session was under 60s — auto-deleted, show a brief notice
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
            {dateHeading}
          </h1>
          <p
            className="text-[14px] leading-[1.5]"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            Time flies either way. Make it count.
          </p>
        </div>

        {/* Create timer button — lives in the header, not a FAB */}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-xs px-md h-9 rounded-lg text-[13px] font-semibold shrink-0 transition-all active:scale-95"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
          aria-label="Create new timer"
        >
          <i className="fa-solid fa-plus text-[12px]" aria-hidden="true" />
          New Timer
        </button>
      </div>

      {/* Timer list */}
      {timers.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-xl gap-md rounded-xl"
          style={{
            border: '2px dashed var(--color-outline-variant)',
            color: 'var(--color-on-surface-variant)',
          }}
        >
          <i className="fa-solid fa-clock text-[40px] opacity-30" aria-hidden="true" />
          <p className="text-[14px] text-center">
            No timers yet. Click <strong>New Timer</strong> to create your first one.
          </p>
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
          Session not saved — Relojito only records sessions of 1 minute or more.
        </div>
      )}

      {/* Create timer modal */}
      {showCreateModal && (
        <CreateTimerModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Recovery banner — only shown for unacknowledged orphaned sessions */}
      {showRecovery && !userStarted && initialActiveSession && (
        <RecoveryBanner
          sessionId={initialActiveSession.id}
          timerName={initialActiveSession.timerName}
          onDismiss={() => {
            dismissRecovery()
            setActiveTimerId(null)
            setActiveSession(null)
          }}
        />
      )}
    </div>
  )
}
