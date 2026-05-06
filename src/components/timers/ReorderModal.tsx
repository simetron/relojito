'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { reorderTimers, restoreTimer } from '@/app/actions/timers'
import type { Timer } from '@/components/timers/TimerCard'
import { BRAND_ICONS } from '@/lib/utils/timerConstants'

interface ReorderModalProps {
  timers: Timer[]
  onClose: () => void
}

export default function ReorderModal({ timers, onClose }: ReorderModalProps) {
  const router = useRouter()
  const activeTimers = timers.filter((t) => t.is_active !== false)
  const archivedTimers = timers.filter((t) => t.is_active === false)

  const [order, setOrder] = useState<Timer[]>([...activeTimers])
  const [isSaving, setIsSaving] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...order]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setOrder(next)
  }

  function moveDown(index: number) {
    if (index === order.length - 1) return
    const next = [...order]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setOrder(next)
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    const result = await reorderTimers(order.map((t) => t.id))
    setIsSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
    router.refresh()
  }

  async function handleRestore(timerId: string) {
    setRestoringId(timerId)
    const result = await restoreTimer(timerId)
    setRestoringId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
    onClose()
  }

  if (!mounted) return null

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reorder-title"
    >
      <div
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
            id="reorder-title"
            className="text-[18px] font-semibold leading-[1.4]"
            style={{ color: 'var(--color-on-surface)' }}
          >
            Reorder Timers
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

        {/* List */}
        <div className="flex-1 overflow-y-auto px-lg py-lg space-y-sm">
          {error && (
            <div
              className="px-md py-sm rounded-lg text-[13px] mb-sm"
              style={{
                backgroundColor: 'var(--color-error-container)',
                color: 'var(--color-on-error-container)',
              }}
            >
              {error}
            </div>
          )}

          {/* Active timers — reorderable */}
          {order.map((timer, index) => (
            <div
              key={timer.id}
              className="flex items-center gap-md px-md py-sm rounded-xl"
              style={{
                backgroundColor: 'var(--color-surface-container)',
                border: '1px solid var(--color-outline-variant)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: timer.color }}
                aria-hidden="true"
              >
                <i className={`${BRAND_ICONS.has(timer.icon) ? 'fa-brands' : 'fa-solid'} fa-${timer.icon} text-[14px] text-white`} />
              </div>
              <span
                className="flex-1 text-[14px] font-medium truncate"
                style={{ color: 'var(--color-on-surface)' }}
              >
                {timer.name}
              </span>
              <div className="flex flex-col gap-[2px] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="w-7 h-7 flex items-center justify-center rounded transition-colors disabled:opacity-30"
                  style={{ color: 'var(--color-on-surface-variant)' }}
                  aria-label={`Move ${timer.name} up`}
                >
                  <i className="fa-solid fa-chevron-up text-[11px]" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === order.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded transition-colors disabled:opacity-30"
                  style={{ color: 'var(--color-on-surface-variant)' }}
                  aria-label={`Move ${timer.name} down`}
                >
                  <i className="fa-solid fa-chevron-down text-[11px]" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}

          {/* Archived timers — not reorderable, show Restore button */}
          {archivedTimers.length > 0 && (
            <>
              <div
                className="pt-md pb-xs"
                style={{ borderTop: order.length > 0 ? '1px solid var(--color-outline-variant)' : 'none' }}
              >
                <p
                  className="text-[11px] font-medium tracking-[0.04em] uppercase"
                  style={{ color: 'var(--color-outline)' }}
                >
                  Archived
                </p>
              </div>
              {archivedTimers.map((timer) => (
                <div
                  key={timer.id}
                  className="flex items-center gap-md px-md py-sm rounded-xl opacity-60"
                  style={{
                    backgroundColor: 'var(--color-surface-container)',
                    border: '1px solid var(--color-outline-variant)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: timer.color }}
                    aria-hidden="true"
                  >
                    <i className={`${BRAND_ICONS.has(timer.icon) ? 'fa-brands' : 'fa-solid'} fa-${timer.icon} text-[14px] text-white`} />
                  </div>
                  <span
                    className="flex-1 text-[14px] font-medium truncate"
                    style={{ color: 'var(--color-on-surface)' }}
                  >
                    {timer.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRestore(timer.id)}
                    disabled={restoringId === timer.id}
                    className="text-[12px] font-semibold px-md py-xs rounded-lg flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-on-primary)',
                    }}
                    aria-label={`Restore ${timer.name}`}
                  >
                    {restoringId === timer.id ? '…' : 'Restore'}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-md px-lg py-md flex-shrink-0"
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
            type="button"
            onClick={handleSave}
            disabled={isSaving || order.length === 0}
            className="flex-1 h-12 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--color-on-secondary)',
            }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
