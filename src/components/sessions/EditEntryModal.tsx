'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { checkOverlap } from '@/lib/utils/overlap'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditSessionData {
  id: string
  timer_id: string
  start_time: string // UTC ISO string
  end_time: string   // UTC ISO string
  duration_seconds: number
}

export interface TimerOption {
  id: string
  name: string
  color: string
  icon: string
}

export interface SavePayload {
  timerId: string
  startTime: Date
  endTime: Date
}

interface EditEntryModalProps {
  session: EditSessionData
  timers: TimerOption[]
  onClose: () => void
  onSave: (payload: SavePayload) => void
  onDelete: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a UTC ISO string to a local YYYY-MM-DD string.
 */
function toLocalDateValue(utcIso: string): string {
  const d = new Date(utcIso)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convert a UTC ISO string to a local HH:MM string (for <input type="time">).
 */
function toLocalTimeValue(utcIso: string): string {
  const d = new Date(utcIso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * Combine a local YYYY-MM-DD date string and a local HH:MM time string into a Date.
 * Returns null if either value is empty.
 */
function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

/**
 * Format a duration in seconds as "Xh Ym Zs" or "--:--:--" if invalid.
 * Shows HH:MM:SS for precision.
 */
function formatDuration(seconds: number): string {
  if (seconds <= 0) return '--:--:--'
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditEntryModal({
  session,
  timers,
  onClose,
  onSave,
  onDelete,
}: EditEntryModalProps) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedTimerId, setSelectedTimerId] = useState<string>(session.timer_id)
  const [dateValue, setDateValue] = useState<string>(toLocalDateValue(session.start_time))
  const [startTimeValue, setStartTimeValue] = useState<string>(toLocalTimeValue(session.start_time))
  const [endTimeValue, setEndTimeValue] = useState<string>(toLocalTimeValue(session.end_time))
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isCheckingOverlap, setIsCheckingOverlap] = useState(false)
  const [showOverlapWarning, setShowOverlapWarning] = useState(false)
  const [pendingSavePayload, setPendingSavePayload] = useState<SavePayload | null>(null)

  // ── Computed duration ──────────────────────────────────────────────────────
  const durationDisplay = useMemo(() => {
    const start = combineDateAndTime(dateValue, startTimeValue)
    const end = combineDateAndTime(dateValue, endTimeValue)
    if (!start || !end) return '--:--:--'
    const diffSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
    return formatDuration(diffSeconds)
  }, [dateValue, startTimeValue, endTimeValue])

  const isValidRange = useMemo(() => {
    const start = combineDateAndTime(dateValue, startTimeValue)
    const end = combineDateAndTime(dateValue, endTimeValue)
    if (!start || !end) return false
    return end.getTime() > start.getTime()
  }, [dateValue, startTimeValue, endTimeValue])

  // ── Focus trap ─────────────────────────────────────────────────────────────
  const modalRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = modalRef.current
    if (!el) return

    const focusable = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable[0]?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else {
          onClose()
        }
      }
      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showDeleteConfirm])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const start = combineDateAndTime(dateValue, startTimeValue)
    const end = combineDateAndTime(dateValue, endTimeValue)
    if (!start || !end || end.getTime() <= start.getTime()) {
      setValidationError('End time must be after start time.')
      return
    }
    setValidationError(null)

    const payload: SavePayload = { timerId: selectedTimerId, startTime: start, endTime: end }

    setIsCheckingOverlap(true)
    const { hasOverlap } = await checkOverlap(start, end, session.id)
    setIsCheckingOverlap(false)

    if (hasOverlap) {
      setPendingSavePayload(payload)
      setShowOverlapWarning(true)
      return
    }

    onSave(payload)
  }

  const handleOverlapAccept = () => {
    if (pendingSavePayload) {
      onSave(pendingSavePayload)
    }
    setShowOverlapWarning(false)
    setPendingSavePayload(null)
  }

  const handleOverlapCancel = () => {
    setShowOverlapWarning(false)
    setPendingSavePayload(null)
  }

  const handleDeleteConfirm = () => {
    onDelete()
  }

  // ── Portal target ──────────────────────────────────────────────────────────
  // Guard for SSR — createPortal requires document
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  // ── Render ─────────────────────────────────────────────────────────────────
  const modal = (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !showDeleteConfirm) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-entry-title"
    >
      {/* Modal panel */}
      <div
        ref={modalRef}
        className="w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-lg py-md flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-outline-variant)' }}
        >
          <h2
            id="edit-entry-title"
            className="text-[18px] font-semibold leading-[1.4]"
            style={{ color: 'var(--color-on-surface)' }}
          >
            Edit Entry
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--color-on-surface-variant)' }}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-lg py-lg space-y-lg">

          {/* Timer selector */}
          <section>
            <label
              className="block text-[12px] font-medium tracking-[0.02em] uppercase mb-md"
              style={{ color: 'var(--color-outline)' }}
            >
              Activity
            </label>
            <div className="grid grid-cols-4 gap-sm">
              {timers.map((timer) => {
                const isSelected = selectedTimerId === timer.id
                return (
                  <button
                    key={timer.id}
                    type="button"
                    onClick={() => { setSelectedTimerId(timer.id); setValidationError(null) }}
                    className="flex flex-col items-center gap-xs p-sm rounded-lg transition-all active:scale-95"
                    style={{
                      backgroundColor: isSelected ? timer.color : 'transparent',
                      color: isSelected ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                      outline: isSelected ? `2px solid ${timer.color}` : '2px solid transparent',
                      outlineOffset: '2px',
                    }}
                    aria-label={`${timer.name}${isSelected ? ' (selected)' : ''}`}
                    aria-pressed={isSelected}
                  >
                    {/* Icon square */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(255,255,255,0.2)'
                          : timer.color,
                      }}
                      aria-hidden="true"
                    >
                      <i
                        className={`fa-solid fa-${timer.icon} text-[18px] text-white`}
                      />
                    </div>
                    <span
                      className="text-[10px] font-medium leading-tight text-center w-full truncate"
                      style={{
                        color: isSelected ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                      }}
                    >
                      {timer.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Date picker */}
          <section>
            <label
              htmlFor="edit-entry-date"
              className="block text-[12px] font-medium tracking-[0.02em] uppercase mb-md"
              style={{ color: 'var(--color-outline)' }}
            >
              Date
            </label>
            <div
              className="flex items-center gap-sm px-md rounded-xl"
              style={{
                backgroundColor: 'var(--color-surface-container)',
                border: '1px solid var(--color-outline-variant)',
              }}
            >
              <i
                className="fa-regular fa-calendar text-[16px] flex-shrink-0"
                style={{ color: 'var(--color-outline)' }}
                aria-hidden="true"
              />
              <input
                id="edit-entry-date"
                type="date"
                value={dateValue}
                onChange={(e) => { setDateValue(e.target.value); setValidationError(null) }}
                className="flex-1 h-12 bg-transparent text-[14px] outline-none"
                style={{ color: 'var(--color-on-surface)' }}
              />
            </div>
          </section>

          {/* Start / End time pickers */}
          <section className="grid grid-cols-2 gap-md">
            {/* Start time */}
            <div>
              <label
                htmlFor="edit-entry-start"
                className="block text-[12px] font-medium tracking-[0.02em] uppercase mb-md"
                style={{ color: 'var(--color-outline)' }}
              >
                Start Time
              </label>
              <div
                className="flex items-center gap-sm px-md rounded-xl"
                style={{
                  backgroundColor: 'var(--color-surface-container)',
                  border: '1px solid var(--color-outline-variant)',
                }}
              >
                <i
                  className="fa-regular fa-clock text-[16px] flex-shrink-0"
                  style={{ color: 'var(--color-outline)' }}
                  aria-hidden="true"
                />
                <input
                  id="edit-entry-start"
                  type="time"
                  value={startTimeValue}
                  onChange={(e) => { setStartTimeValue(e.target.value); setValidationError(null) }}
                  className="flex-1 h-12 bg-transparent text-[14px] outline-none"
                  style={{ color: 'var(--color-on-surface)' }}
                />
              </div>
            </div>

            {/* End time */}
            <div>
              <label
                htmlFor="edit-entry-end"
                className="block text-[12px] font-medium tracking-[0.02em] uppercase mb-md"
                style={{ color: 'var(--color-outline)' }}
              >
                End Time
              </label>
              <div
                className="flex items-center gap-sm px-md rounded-xl"
                style={{
                  backgroundColor: 'var(--color-surface-container)',
                  border: '1px solid var(--color-outline-variant)',
                }}
              >
                <i
                  className="fa-regular fa-clock text-[16px] flex-shrink-0"
                  style={{ color: 'var(--color-outline)' }}
                  aria-hidden="true"
                />
                <input
                  id="edit-entry-end"
                  type="time"
                  value={endTimeValue}
                  onChange={(e) => { setEndTimeValue(e.target.value); setValidationError(null) }}
                  className="flex-1 h-12 bg-transparent text-[14px] outline-none"
                  style={{ color: 'var(--color-on-surface)' }}
                />
              </div>
            </div>
          </section>

          {/* Validation error */}
          {validationError && (
            <div className="flex items-center gap-sm px-md py-sm rounded-lg" style={{ backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}>
              <i className="fa-solid fa-circle-exclamation text-[14px]" aria-hidden="true" />
              <span className="text-[13px]">{validationError}</span>
            </div>
          )}

          {/* Duration display (read-only, live-updating) */}
          <section
            className="flex items-center justify-between px-md py-sm rounded-xl"
            style={{ backgroundColor: 'var(--color-surface-container-low)' }}
          >
            <span
              className="text-[12px] font-medium tracking-[0.02em] uppercase"
              style={{ color: 'var(--color-outline)' }}
            >
              Duration
            </span>
            <span
              className="text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] font-mono"
              style={{
                color: isValidRange
                  ? 'var(--color-primary)'
                  : 'var(--color-outline)',
              }}
              aria-live="polite"
              aria-label={`Duration: ${durationDisplay}`}
            >
              {durationDisplay}
            </span>
          </section>

        </div>

        {/* ── Overlap warning banner ── */}
        {showOverlapWarning && (
          <div
            className="flex-shrink-0 mx-lg mb-0 mt-0 px-md py-sm rounded-xl flex items-start gap-sm"
            style={{
              backgroundColor: 'var(--color-tertiary-container)',
              color: 'var(--color-on-tertiary-container)',
              margin: '0 var(--spacing-lg)',
            }}
            role="alert"
          >
            <i
              className="fa-solid fa-triangle-exclamation text-[16px] flex-shrink-0 mt-[2px]"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-[1.5]">
                Some sessions overlap. Total time may exceed real elapsed time.
              </p>
              <div className="flex gap-sm mt-sm">
                <button
                  type="button"
                  onClick={handleOverlapAccept}
                  className="px-md py-xs rounded-lg text-[13px] font-semibold transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: 'var(--color-on-tertiary-container)',
                    color: 'var(--color-tertiary-container)',
                  }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={handleOverlapCancel}
                  className="px-md py-xs rounded-lg text-[13px] font-medium transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-on-tertiary-container)',
                    border: '1px solid var(--color-on-tertiary-container)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer actions ── */}
        <div
          className="flex items-center gap-md px-lg py-md flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-outline-variant)' }}
        >
          {/* Delete button */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-sm px-md py-sm rounded-lg text-[14px] font-medium transition-colors"
            style={{ color: 'var(--color-error)' }}
            aria-label="Delete this session"
          >
            <i className="fa-solid fa-trash-can" aria-hidden="true" />
            Delete
          </button>

          <div className="flex-1" />

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedTimerId || isCheckingOverlap}
            className="h-12 px-lg rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--color-on-secondary)',
            }}
          >
            {isCheckingOverlap ? 'Checking…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Delete confirmation dialog ── */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 flex items-center justify-center p-lg"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-session-title"
          aria-describedby="delete-session-desc"
        >
          <div
            className="w-full max-w-sm rounded-2xl p-lg space-y-lg"
            style={{
              backgroundColor: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)',
            }}
          >
            <div className="space-y-sm">
              <h3
                id="delete-session-title"
                className="text-[18px] font-semibold"
                style={{ color: 'var(--color-on-surface)' }}
              >
                Delete this session?
              </h3>
              <p
                id="delete-session-desc"
                className="text-[14px] leading-[1.5]"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                This will permanently delete the session. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-md">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 rounded-xl text-[14px] font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface-container)',
                  color: 'var(--color-on-surface)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 h-12 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--color-error)',
                  color: 'var(--color-on-error)',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return createPortal(modal, document.body)
}
