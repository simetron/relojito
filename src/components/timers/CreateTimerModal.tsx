'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createTimer } from '@/app/actions/timers'
import { ALLOWED_COLORS, ALLOWED_ICONS, type TimerActionResult } from '@/lib/utils/timerConstants'

// ─── Color swatch metadata ────────────────────────────────────────────────────

const COLOR_SWATCHES: { hex: string; label: string }[] = [
  { hex: '#5850EC', label: 'Indigo' },
  { hex: '#5F4B1B', label: 'Brown' },
  { hex: '#F94144', label: 'Red' },
  { hex: '#10B981', label: 'Green' },
  { hex: '#F59E0B', label: 'Amber' },
  { hex: '#8B5CF6', label: 'Purple' },
  { hex: '#0EA5E9', label: 'Sky' },
]

// ─── Icon metadata ────────────────────────────────────────────────────────────

const ICON_OPTIONS: { name: string; label: string }[] = [
  { name: 'person-running', label: 'Running' },
  { name: 'book-open', label: 'Reading' },
  { name: 'person-praying', label: 'Meditation' },
  { name: 'dumbbell', label: 'Workout' },
  { name: 'code', label: 'Coding' },
  { name: 'headphones', label: 'Music' },
  { name: 'mug-saucer', label: 'Coffee' },
  { name: 'paintbrush', label: 'Art' },
  { name: 'moon', label: 'Sleep' },
  { name: 'briefcase', label: 'Work' },
  { name: 'music', label: 'Instrument' },
  { name: 'pen-to-square', label: 'Writing' },
]

// ─── Random defaults ──────────────────────────────────────────────────────────

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateTimerModalProps {
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateTimerModal({ onClose }: CreateTimerModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>(() => randomPick(COLOR_SWATCHES).hex)
  const [selectedIcon, setSelectedIcon] = useState<string>(() => randomPick(ICON_OPTIONS).name)
  const [nameValue, setNameValue] = useState('')

  const [state, setState] = useState<TimerActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  // Close on success
  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state, onClose])

  // Trap focus inside modal
  const modalRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])'
    )
    focusable[0]?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
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
  }, [onClose])

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-timer-title"
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
            id="create-timer-title"
            className="text-[18px] font-semibold leading-[1.4]"
            style={{ color: 'var(--color-on-surface)' }}
          >
            New Timer
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
            formData.set('color', selectedColor)
            formData.set('icon', selectedIcon)
            startTransition(async () => {
              const result = await createTimer(formData)
              setState(result)
            })
          }}
          className="flex flex-col flex-1 overflow-y-auto"
        >
          <div className="px-lg pb-lg space-y-lg">
            {/* Error message */}
            {state?.error && (
              <p
                className="text-[14px] px-md py-sm rounded-lg"
                style={{
                  color: 'var(--color-on-error-container)',
                  backgroundColor: 'var(--color-error-container)',
                }}
                role="alert"
              >
                {state.error}
              </p>
            )}

            {/* Name input */}
            <div className="space-y-sm">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="timer-name"
                  className="text-[12px] font-medium tracking-[0.02em] uppercase"
                  style={{ color: 'var(--color-outline)' }}
                >
                  Name
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
                id="timer-name"
                name="name"
                type="text"
                required
                maxLength={32}
                placeholder="Deep Work, Meditation…"
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
                Color
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

            {/* Icon picker */}
            <div className="space-y-sm">
              <label
                className="text-[12px] font-medium tracking-[0.02em] uppercase"
                style={{ color: 'var(--color-outline)' }}
              >
                Icon
              </label>
              <div className="grid grid-cols-6 gap-sm">
                {ICON_OPTIONS.map((icon) => {
                  const isSelected = selectedIcon === icon.name
                  return (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => setSelectedIcon(icon.name)}
                      className="aspect-square flex items-center justify-center rounded-lg transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? 'var(--color-primary-container)'
                          : 'transparent',
                        color: isSelected
                          ? 'var(--color-on-primary-container)'
                          : 'var(--color-on-surface-variant)',
                        border: isSelected
                          ? '1px solid var(--color-outline-variant)'
                          : '1px solid transparent',
                      }}
                      aria-label={`${icon.label}${isSelected ? ' (selected)' : ''}`}
                      aria-pressed={isSelected}
                      title={icon.label}
                    >
                      <i className={`fa-solid fa-${icon.name} text-[18px]`} aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div
            className="flex gap-md px-lg py-md flex-shrink-0"
            style={{ borderTop: '1px solid var(--color-outline-variant)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-[14px] font-medium transition-colors"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || nameValue.trim().length === 0}
              className="flex-1 h-12 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-secondary)',
                color: 'var(--color-on-secondary)',
              }}
            >
              {isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
