'use client'

import { useState, useEffect, useRef } from 'react'
import EditTimerModal from './EditTimerModal'
import { formatHHMMSS } from '@/lib/utils/time'
import { BRAND_ICONS } from '@/lib/utils/timerConstants'
import { useTranslation } from '@/lib/i18n/useTranslation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Timer {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  position: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ActiveSession {
  id: string
  start_time: string
}

interface TimerCardProps {
  timer: Timer
  todaySeconds: number
  onStart: (timer: Timer) => void
  onStop?: (sessionId: string) => void
  activeSession?: ActiveSession
  disabled?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format total seconds as a human-readable "Today: Xm" or "Today: 1h 23m" string.
 * Returns null if there are no sessions today.
 * The prefix label is passed in to support i18n.
 */
function formatTodayTime(totalSeconds: number, todayLabel: string): string | null {
  if (totalSeconds <= 0) return null
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  let timeStr: string
  if (hours > 0 && minutes > 0) timeStr = `${hours}h ${minutes}m`
  else if (hours > 0) timeStr = `${hours}h`
  else timeStr = `${minutes}m`
  return todayLabel.replace('{time}', timeStr)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimerCard({
  timer,
  todaySeconds,
  onStart,
  onStop,
  activeSession,
  disabled = false,
}: TimerCardProps) {
  const { t } = useTranslation()
  const [showEditModal, setShowEditModal] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isRunning = !!activeSession

  // Set up / tear down the 1-second interval when activeSession changes
  useEffect(() => {
    if (activeSession) {
      const startMs = new Date(activeSession.start_time).getTime()

      // Compute immediately so there's no 1-second blank
      setElapsed(Math.floor((Date.now() - startMs) / 1000))

      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startMs) / 1000))
      }, 1000)
    } else {
      setElapsed(0)
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [activeSession])

  const handleCardClick = () => {
    // Don't open edit modal when running or disabled
    if (isRunning || disabled) return
    setShowEditModal(true)
  }

  const handleStartClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onStart(timer)
  }

  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeSession && onStop) {
      onStop(activeSession.id)
    }
  }

  // ── Running state ──────────────────────────────────────────────────────────
  if (isRunning) {
    return (
      <div
        className="group rounded-xl flex items-center justify-between px-lg py-xl transition-all duration-200 gap-md"
        style={{ backgroundColor: timer.color }}
        role="region"
        aria-label={`${timer.name} is running`}
      >
        {/* Left: icon + info */}
        <div className="flex items-center gap-md min-w-0 flex-1">
          {/* White icon square */}
          <div
            className="w-16 h-16 xl:w-20 xl:h-20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            aria-hidden="true"
          >
            <i className={`${BRAND_ICONS.has(timer.icon) ? 'fa-brands' : 'fa-solid'} fa-${timer.icon} text-[28px] xl:text-[36px] text-white`} />
          </div>

          {/* Name + counter */}
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] xl:text-[22px] leading-[1.3] tracking-[-0.02em] font-semibold text-white truncate">
              {timer.name}
            </h3>
            <p
              className="text-[22px] xl:text-[28px] leading-[1.2] mt-[2px] text-white font-semibold tracking-[-0.02em]"
              aria-live="polite"
              aria-label={`Elapsed time: ${formatHHMMSS(elapsed)}`}
            >
              {formatHHMMSS(elapsed)}
            </p>
          </div>
        </div>

        {/* Right: STOP button */}
        <button
          type="button"
          className="px-md xl:px-lg py-sm xl:py-md rounded-xl text-[12px] xl:text-[13px] font-semibold tracking-[0.04em] transition-transform active:scale-95 flex-shrink-0 text-white"
          style={{
            border: '2px solid rgba(255,255,255,0.8)',
            backgroundColor: 'transparent',
          }}
          onClick={handleStopClick}
          aria-label={`Stop ${timer.name}`}
        >
          {t('timer.stop')}
        </button>
      </div>
    )
  }

  // ── Idle state ─────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={`group rounded-xl flex items-center justify-between gap-md p-lg transition-all duration-200 ${
          disabled ? 'opacity-50' : 'cursor-pointer'
        }`}
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
        }}
        onClick={handleCardClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setShowEditModal(true)
          }
        }}
        aria-label={`Edit ${timer.name}`}
        aria-disabled={disabled}
      >
        {/* Left: icon + info */}
        <div className="flex items-center gap-lg min-w-0 flex-1">
          {/* Colored icon square */}
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
            style={{ backgroundColor: timer.color }}
            aria-hidden="true"
          >
            <i className={`${BRAND_ICONS.has(timer.icon) ? 'fa-brands' : 'fa-solid'} fa-${timer.icon} text-[24px] text-white`} />
          </div>

          {/* Name + today time */}
          <div className="min-w-0 flex-1">
            <h3
              className="text-[18px] leading-[1.4] tracking-[-0.01em] font-medium truncate"
              style={{ color: 'var(--color-on-surface)' }}
            >
              {timer.name}
            </h3>
            {formatTodayTime(todaySeconds, t('timer.todayTime')) && (
              <p
                className="text-[14px] leading-[1.5] mt-[2px] truncate"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                {formatTodayTime(todaySeconds, t('timer.todayTime'))}
              </p>
            )}
          </div>
        </div>

        {/* Right: START button */}
        <button
          type="button"
          className={`px-md py-sm rounded-lg text-[12px] font-medium tracking-[0.02em] flex-shrink-0 ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'transition-transform active:scale-95'
          }`}
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onClick={handleStartClick}
          disabled={disabled}
          aria-label={`Start ${timer.name}`}
          aria-disabled={disabled}
        >
          {t('timer.start')}
        </button>
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <EditTimerModal
          timer={timer}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  )
}
