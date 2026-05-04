'use client'

import { useEffect, useState } from 'react'
import TimerCard from '@/components/timers/TimerCard'
import CreateTimerModal from '@/components/timers/CreateTimerModal'
import type { Timer, ActiveSession } from '@/components/timers/TimerCard'
import { startTimer, stopTimer } from '@/app/actions/sessions'
import { useRealtimeSession } from '@/lib/realtime/RealtimeSessionContext'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DashboardClientProps {
  timers: Timer[]
  todaySecondsMap: Record<string, number>
  dateHeading: string
  /** Pre-existing active session loaded server-side (if any) */
  initialActiveSession?: ActiveSession & { timer_id: string }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardClient({
  timers,
  todaySecondsMap,
  dateHeading,
  initialActiveSession,
}: DashboardClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Track which timer has an active session and the session details
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
      // Note: we leave the UI in idle state even on error to avoid confusion
    }
  }

  return (
    <div className="min-h-screen py-lg">
      {/* Date heading */}
      <div className="mb-xl flex flex-col gap-[4px]">
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
            No timers yet. Tap <strong>+</strong> to create your first one.
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

      {/* FAB — create new timer */}
      <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-20 right-lg xl:bottom-lg w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30"
        style={{
          backgroundColor: 'var(--color-secondary)',
          color: 'var(--color-on-secondary)',
        }}
        aria-label="Create new timer"
      >
        <i className="fa-solid fa-plus text-[20px]" aria-hidden="true" />
      </button>

      {/* Create timer modal */}
      {showCreateModal && (
        <CreateTimerModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
