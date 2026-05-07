'use client'

import { useState, useMemo } from 'react'
import type { HistorySession } from '@/app/actions/sessions'
import { saveManualSession, deleteSession } from '@/app/actions/sessions'
import EditEntryModal, { type TimerOption, type SavePayload } from '@/components/sessions/EditEntryModal'
import ManualEntryModal, { type ManualSavePayload } from '@/components/sessions/ManualEntryModal'
import { useTimeFormat, formatLocalTime } from '@/lib/utils/useTimeFormat'
import { BRAND_ICONS } from '@/lib/utils/timerConstants'
import { useTranslation } from '@/lib/i18n/useTranslation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayGroup {
  date: string // YYYY-MM-DD in local time
  label: string // "Today", "Yesterday", or "Monday, July 24"
  sessions: HistorySession[]
}

interface HistoryClientProps {
  sessions: HistorySession[]
  timers: TimerOption[]
  page: number
  hasMore: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a UTC ISO string to a local YYYY-MM-DD date string.
 * Satisfies Req 13.2 — timezone conversion on the client.
 */
function toLocalDateString(utcIso: string): string {
  const d = new Date(utcIso)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a local YYYY-MM-DD string as a human-readable label.
 * Returns "Today", "Yesterday", or e.g. "Monday, July 24".
 * Satisfies Req 6.1 (day grouping with local timezone).
 */
function formatDayLabel(localDate: string, todayLabel: string, yesterdayLabel: string, locale: string): string {
  const today = toLocalDateString(new Date().toISOString())
  if (localDate === today) return todayLabel

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toLocalDateString(yesterday.toISOString())
  if (localDate === yesterdayStr) return yesterdayLabel

  // Parse the YYYY-MM-DD as a local date (avoid UTC offset issues)
  const [year, month, day] = localDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Group sessions by local calendar date, sorted descending.
 * Satisfies Req 6.1 and 6.2.
 */
function groupSessionsByDay(sessions: HistorySession[], todayLabel: string, yesterdayLabel: string, locale: string): DayGroup[] {
  const map = new Map<string, HistorySession[]>()

  for (const session of sessions) {
    const localDate = toLocalDateString(session.start_time)
    const existing = map.get(localDate)
    if (existing) {
      existing.push(session)
    } else {
      map.set(localDate, [session])
    }
  }

  // Sort dates descending
  const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a))

  return sortedDates.map((date) => ({
    date,
    label: formatDayLabel(date, todayLabel, yesterdayLabel, locale),
    sessions: map.get(date)!,
  }))
}

/**
 * Format a UTC ISO string as a local time string respecting user preference.
 * Moved to useTimeFormat.ts — imported above.
 */

/**
 * Format duration in seconds as a human-readable badge.
 * < 60s → "Xs"
 * < 3600s → "Xm" or "Xm Ys"
 * ≥ 3600s → "Xh Ym"
 * Satisfies Req 6.3 (duration badge).
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HistoryClient({ sessions, timers, page, hasMore }: HistoryClientProps) {
  const { t, locale } = useTranslation()
  const [selectedSession, setSelectedSession] = useState<HistorySession | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [timeFormat] = useTimeFormat()

  // Group sessions by local calendar date (client-side, uses browser timezone)
  const dayGroups = useMemo(
    () => groupSessionsByDay(sessions, t('history.today'), t('history.yesterday'), locale),
    [sessions, t, locale]
  )

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSave = async (payload: SavePayload) => {
    if (!selectedSession) return
    setIsSaving(true)
    setActionError(null)
    const result = await saveManualSession({
      sessionId: selectedSession.id,
      timerId: payload.timerId,
      startTime: payload.startTime.toISOString(),
      endTime: payload.endTime.toISOString(),
    })
    setIsSaving(false)
    if (result.error) {
      setActionError(result.error)
    } else {
      setSelectedSession(null)
      setActionError(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedSession) return
    setIsSaving(true)
    setActionError(null)
    const result = await deleteSession(selectedSession.id)
    setIsSaving(false)
    if (result.error) {
      setActionError(result.error)
    } else {
      setSelectedSession(null)
      setActionError(null)
    }
  }

  const handleManualSave = async (payload: ManualSavePayload) => {
    setIsSaving(true)
    setActionError(null)
    const result = await saveManualSession({
      timerId: payload.timerId,
      startTime: payload.startTime.toISOString(),
      endTime: payload.endTime.toISOString(),
    })
    setIsSaving(false)
    if (result.error) {
      setActionError(result.error)
    } else {
      setShowManualEntry(false)
      setActionError(null)
    }
  }

  return (
    <div className="min-h-screen py-lg">
      {/* Page header */}
      <div className="mb-xl flex items-center justify-between">
        <h1
          className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('history.title')}
        </h1>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div
          className="mb-md flex items-center gap-sm px-md py-sm rounded-xl"
          style={{
            backgroundColor: 'var(--color-error-container)',
            color: 'var(--color-on-error-container)',
          }}
          role="alert"
        >
          <i className="fa-solid fa-circle-exclamation text-[14px] flex-shrink-0" aria-hidden="true" />
          <span className="flex-1 text-[13px]">{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
            aria-label="Dismiss error"
          >
            <i className="fa-solid fa-xmark text-[12px]" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Empty state */}
      {dayGroups.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-xl gap-md rounded-xl"
          style={{
            border: '2px dashed var(--color-outline-variant)',
            color: 'var(--color-on-surface-variant)',
          }}
        >
          <i className="fa-solid fa-clock-rotate-left text-[40px] opacity-30" aria-hidden="true" />
          <p className="text-[14px] text-center">
            {t('history.empty')}
          </p>
        </div>
      )}

      {/* Day groups */}
      {dayGroups.map((group) => (
        <section key={group.date} className="mb-10">
          {/* Day group header — Req 6.2 */}
          <header className="flex items-center justify-between mb-4 px-2">
            <h2
              className="text-[18px] leading-[1.4] tracking-[-0.01em] font-medium"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              {group.label}
            </h2>
            <span
              className="text-[12px] font-medium tracking-[0.02em] px-2 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--color-surface-container)',
                color: 'var(--color-outline)',
              }}
            >
              {group.sessions.length} {group.sessions.length === 1 ? t('history.sessions_one') : t('history.sessions_other')}
            </span>
          </header>

          {/* Session rows */}
          <div className="flex flex-col gap-3">
            {group.sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className="group w-full rounded-xl p-4 flex items-center gap-4 text-left transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  border: '1px solid var(--color-outline-variant)',
                }}
                onClick={() => setSelectedSession(session)}
                aria-label={`Edit session: ${session.timer_name}, ${formatLocalTime(session.start_time, timeFormat)} to ${formatLocalTime(session.end_time, timeFormat)}`}
              >
                {/* Timer icon square — Req 6.3 */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: session.timer_color }}
                  aria-hidden="true"
                >
                  <i
                    className={`${BRAND_ICONS.has(session.timer_icon) ? 'fa-brands' : 'fa-solid'} fa-${session.timer_icon} text-[16px] text-white`}
                  />
                </div>

                {/* Session info */}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3
                      className="text-[16px] leading-[1.6] font-semibold truncate"
                      style={{ color: 'var(--color-on-surface)' }}
                    >
                      {session.timer_name}
                    </h3>
                    {/* Duration badge */}
                    <span
                      className="text-[12px] font-medium tracking-[0.02em] px-2 py-0.5 rounded flex-shrink-0"
                      style={{
                        backgroundColor: 'var(--color-surface-container-high)',
                        color: 'var(--color-on-surface-variant)',
                      }}
                    >
                      {formatDuration(session.duration_seconds)}
                    </span>
                  </div>
                  {/* Time range */}
                  <p
                    className="text-[12px] font-medium tracking-[0.02em] mt-1"
                    style={{ color: 'var(--color-outline)' }}
                  >
                    {formatLocalTime(session.start_time, timeFormat)} – {formatLocalTime(session.end_time, timeFormat)}
                  </p>
                </div>

                {/* Chevron — Req 6.3 */}
                <i
                  className="fa-solid fa-chevron-right text-[14px] flex-shrink-0 transition-colors"
                  style={{ color: 'var(--color-outline)' }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Pagination hint */}
      {hasMore && (
        <div className="flex justify-center py-md">
          <p
            className="text-[12px]"
            style={{ color: 'var(--color-outline)' }}
          >
            {t('history.showingFirst').replace('{count}', String(sessions.length))}
          </p>
        </div>
      )}

      {/* "+" FAB — Req 6.5 */}
      <button
        type="button"
        onClick={() => setShowManualEntry(true)}
        className="fixed bottom-20 right-lg xl:bottom-lg w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30"
        style={{
          backgroundColor: 'var(--color-secondary)',
          color: 'var(--color-on-secondary)',
        }}
        aria-label={t('history.addEntry')}
      >
        <i className="fa-solid fa-plus text-[20px]" aria-hidden="true" />
      </button>

      {/* Edit Entry Modal — wired to selectedSession state (Req 6 AC 4) */}
      {selectedSession && (
        <EditEntryModal
          session={{
            id: selectedSession.id,
            timer_id: selectedSession.timer_id,
            start_time: selectedSession.start_time,
            end_time: selectedSession.end_time,
            duration_seconds: selectedSession.duration_seconds,
          }}
          timers={timers}
          onClose={() => setSelectedSession(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Manual Entry Modal — wired to "+" FAB (Req 6 AC 5) */}
      {showManualEntry && (
        <ManualEntryModal
          timers={timers}
          onClose={() => setShowManualEntry(false)}
          onSave={handleManualSave}
        />
      )}
    </div>
  )
}
