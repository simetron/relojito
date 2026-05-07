'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { updateTimer, deleteTimer, archiveTimer } from '@/app/actions/timers'
import { ALLOWED_COLORS, ALLOWED_ICONS, BRAND_ICONS, type TimerActionResult } from '@/lib/utils/timerConstants'
import type { Timer } from '@/lib/utils/timerConstants'
import { useTranslation } from '@/lib/i18n/useTranslation'

// ─── Color swatch metadata ────────────────────────────────────────────────────

const COLOR_SWATCHES: { hex: string; label: string }[] = [
  { hex: '#5850EC', label: 'Indigo' },
  { hex: '#5F4B1B', label: 'Brown' },
  { hex: '#F94144', label: 'Red' },
  { hex: '#10B981', label: 'Green' },
  { hex: '#F59E0B', label: 'Amber' },
  { hex: '#8B5CF6', label: 'Purple' },
  { hex: '#0EA5E9', label: 'Sky' },
  { hex: '#EC4899', label: 'Pink' },
  { hex: '#374151', label: 'Dark Grey' },
  { hex: '#F97316', label: 'Orange' },
  { hex: '#166534', label: 'Dark Green' },
  { hex: '#84CC16', label: 'Lime' },
]

// ─── Icon metadata ────────────────────────────────────────────────────────────

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditTimerModalProps {
  timer: Timer
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditTimerModal({ timer, onClose }: EditTimerModalProps) {
  const { t } = useTranslation()
  const [selectedColor, setSelectedColor] = useState<string>(
    ALLOWED_COLORS.includes(timer.color as (typeof ALLOWED_COLORS)[number])
      ? timer.color
      : ALLOWED_COLORS[0]
  )
  const [selectedIcon, setSelectedIcon] = useState<string>(
    ALLOWED_ICONS.includes(timer.icon as (typeof ALLOWED_ICONS)[number])
      ? timer.icon
      : ALLOWED_ICONS[0]
  )
  const [nameValue, setNameValue] = useState(timer.name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  const [state, setState] = useState<TimerActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  // Close on successful save
  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state, onClose])

  // Focus trap
  const modalRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])'
    )
    focusable[0]?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else if (showArchiveConfirm) {
          setShowArchiveConfirm(false)
        } else {
          onClose()
        }
      }
      if (e.key === 'Tab') {
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
  }, [onClose, showDeleteConfirm, showArchiveConfirm])

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteTimer(timer.id)
    setIsDeleting(false)
  }

  const handleArchive = async () => {
    setIsArchiving(true)
    setArchiveError(null)
    const result = await archiveTimer(timer.id)
    setIsArchiving(false)
    if (result.error) {
      setArchiveError(result.error)
      return
    }
    setShowArchiveConfirm(false)
    onClose()
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !showDeleteConfirm) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-timer-title"
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-lg py-md flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-outline-variant)' }}
        >
          <h2
            id="edit-timer-title"
            className="text-[18px] font-semibold leading-[1.4]"
            style={{ color: 'var(--color-on-surface)' }}
          >
            {t('timerModal.editTimer')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--color-on-surface-variant)' }}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Icon preview */}
        <div className="flex justify-center py-lg flex-shrink-0">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: selectedColor }}
          >
            <i className={`fa-solid fa-${selectedIcon} text-[32px] text-white`} aria-hidden="true" />
          </div>
        </div>

        {/* Scrollable form body */}
        <form
          action={(formData) => {
            formData.set('timerId', timer.id)
            formData.set('color', selectedColor)
            formData.set('icon', selectedIcon)
            startTransition(async () => {
              const result = await updateTimer(formData)
              setState(result)
            })
          }}
          className="flex flex-col flex-1 overflow-y-auto"
        >
          <div className="px-lg pb-lg space-y-lg">
            {/* Error message */}
            {(state?.error || archiveError) && (
              <p
                className="text-[14px] px-md py-sm rounded-lg"
                style={{
                  color: 'var(--color-on-error-container)',
                  backgroundColor: 'var(--color-error-container)',
                }}
                role="alert"
              >
                {state?.error || archiveError}
              </p>
            )}

            {/* Name input */}
            <div className="space-y-sm">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="edit-timer-name"
                  className="text-[12px] font-medium tracking-[0.02em] uppercase"
                  style={{ color: 'var(--color-outline)' }}
                >
                  {t('timerModal.name')}
                </label>
                <span
                  className="text-[12px]"
                  style={{
                    color:
                      nameValue.length > 32
                        ? 'var(--color-error)'
                        : 'var(--color-on-surface-variant)',
                  }}
                >
                  {nameValue.length}/32
                </span>
              </div>
              <input
                id="edit-timer-name"
                name="name"
                type="text"
                required
                maxLength={32}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="w-full h-12 px-md rounded-xl text-[14px] outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-surface-container)',
                  border: '1px solid var(--color-outline-variant)',
                  color: 'var(--color-on-surface)',
                }}
              />
            </div>

            {/* Color picker */}
            <div className="space-y-sm">
              <label
                className="text-[12px] font-medium tracking-[0.02em] uppercase"
                style={{ color: 'var(--color-outline)' }}
              >
                {t('timerModal.color')}
              </label>
              <div className="flex flex-wrap gap-md">
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected = selectedColor === swatch.hex
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => setSelectedColor(swatch.hex)}
                      className="w-10 h-10 rounded-full transition-transform hover:scale-110 active:scale-90 flex-shrink-0"
                      style={{
                        backgroundColor: swatch.hex,
                        outline: isSelected ? `3px solid ${swatch.hex}` : 'none',
                        outlineOffset: '2px',
                        boxShadow: isSelected ? '0 0 0 2px white' : 'none',
                      }}
                      aria-label={`${swatch.label}${isSelected ? ' (selected)' : ''}`}
                      aria-pressed={isSelected}
                    />
                  )
                })}
              </div>
            </div>

            {/* Icon picker — flat grid */}
            <div className="space-y-sm">
              <label
                className="text-[12px] font-medium tracking-[0.02em] uppercase"
                style={{ color: 'var(--color-outline)' }}
              >
                {t('timerModal.icon')}
              </label>
              <div className="grid grid-cols-6 gap-sm">
                {ALLOWED_ICONS.map((iconName) => {
                  const isSelected = selectedIcon === iconName
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className="aspect-square flex items-center justify-center rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'transparent',
                        color: isSelected ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid transparent',
                      }}
                      aria-label={iconName}
                      aria-pressed={isSelected}
                      title={iconName}
                    >
                      <i className={`${BRAND_ICONS.has(iconName) ? 'fa-brands' : 'fa-solid'} fa-${iconName} text-[18px]`} aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer actions — two rows on mobile to prevent overflow */}
          <div
            className="flex flex-col gap-sm px-lg py-md flex-shrink-0"
            style={{ borderTop: '1px solid var(--color-outline-variant)' }}
          >
            {/* Row 1: Save + Cancel */}
            <div className="flex gap-sm">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl text-[14px] font-medium transition-colors"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                {t('timerModal.cancel')}
              </button>
              <button
                type="submit"
                disabled={isPending || nameValue.trim().length === 0}
                className="flex-1 h-11 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-secondary)',
                  color: 'var(--color-on-secondary)',
                }}
              >
                {isPending ? t('timerModal.saving') : t('timerModal.save')}
              </button>
            </div>
            {/* Row 2: Delete + Archive */}
            <div className="flex gap-sm">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 flex items-center justify-center gap-sm h-10 rounded-xl text-[13px] font-medium transition-colors"
                style={{ color: 'var(--color-error)' }}
              >
                <i className="fa-solid fa-trash-can" aria-hidden="true" />
                {t('timerModal.delete')}
              </button>
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(true)}
                disabled={isArchiving}
                className="flex-1 h-10 rounded-xl text-[13px] font-medium transition-colors active:scale-[0.98] disabled:opacity-50"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                {t('timerModal.archive')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Delete confirmation dialog ── */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 flex items-center justify-center p-lg"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          aria-describedby="delete-confirm-desc"
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
                id="delete-confirm-title"
                className="text-[18px] font-semibold"
                style={{ color: 'var(--color-on-surface)' }}
              >
                {t('timerModal.deleteTitle').replace('"{name}"', `"${timer.name}"`)}
              </h3>
              <p
                id="delete-confirm-desc"
                className="text-[14px] leading-[1.5]"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                {t('timerModal.deleteDesc').replace(/\{name\}/g, timer.name)}
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
                {t('timerModal.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-error)',
                  color: 'var(--color-on-error)',
                }}
              >
                {isDeleting ? t('timerModal.deleting') : t('timerModal.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive confirmation dialog ── */}
      {showArchiveConfirm && (
        <div
          className="absolute inset-0 flex items-center justify-center p-lg"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="archive-confirm-title"
          aria-describedby="archive-confirm-desc"
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
                id="archive-confirm-title"
                className="text-[18px] font-semibold"
                style={{ color: 'var(--color-on-surface)' }}
              >
                {t('timerModal.archiveTitle').replace('"{name}"', `"${timer.name}"`)}
              </h3>
              <p
                id="archive-confirm-desc"
                className="text-[14px] leading-[1.5]"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                {t('timerModal.archiveDesc').replace(/\{name\}/g, timer.name)}
              </p>
            </div>

            {archiveError && (
              <p
                className="text-[13px] px-md py-sm rounded-lg"
                style={{
                  color: 'var(--color-on-error-container)',
                  backgroundColor: 'var(--color-error-container)',
                }}
              >
                {archiveError}
              </p>
            )}

            <div className="flex gap-md">
              <button
                type="button"
                onClick={() => { setShowArchiveConfirm(false); setArchiveError(null) }}
                disabled={isArchiving}
                className="flex-1 h-12 rounded-xl text-[14px] font-medium transition-colors disabled:opacity-60"
                style={{
                  backgroundColor: 'var(--color-surface-container)',
                  color: 'var(--color-on-surface)',
                }}
              >
                {t('timerModal.cancel')}
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={isArchiving}
                className="flex-1 h-12 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-secondary)',
                  color: 'var(--color-on-secondary)',
                }}
              >
                {isArchiving ? t('timerModal.archiving') : t('timerModal.archive')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
