'use client'

import { useEffect, useRef, useState } from 'react'

interface TimeInputProps {
  value: string // always "HH:MM" 24h internally
  onChange: (value: string) => void // always emits "HH:MM" 24h
  use12h?: boolean
  hoursRef?: React.RefObject<HTMLInputElement>
  minutesRef?: React.RefObject<HTMLInputElement>
  nextRef?: React.RefObject<HTMLInputElement>
  id?: string
  'aria-label'?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert 24h hour (0-23) to 12h display hour (1-12) */
function to12h(h24: number): number {
  const h = h24 % 12
  return h === 0 ? 12 : h
}

/** Convert 12h hour + period to 24h hour */
function to24h(h12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return h12 === 12 ? 0 : h12
  return h12 === 12 ? 12 : h12 + 12
}

export default function TimeInput({
  value,
  onChange,
  use12h = false,
  hoursRef: externalHoursRef,
  minutesRef: externalMinutesRef,
  nextRef,
  id,
  'aria-label': ariaLabel,
}: TimeInputProps) {
  const internalHoursRef = useRef<HTMLInputElement>(null)
  const internalMinutesRef = useRef<HTMLInputElement>(null)
  const hoursRef = externalHoursRef ?? internalHoursRef
  const minutesRef = externalMinutesRef ?? internalMinutesRef

  // Parse 24h "HH:MM" value into display state
  const parseValue = (v: string) => {
    if (!v) return { h: '', m: '', period: 'AM' as 'AM' | 'PM' }
    const [hStr, mStr] = v.split(':')
    const h24 = parseInt(hStr ?? '0', 10)
    const period: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM'
    const hDisplay = use12h ? (isNaN(h24) ? '' : String(to12h(h24))) : (hStr ?? '')
    return { h: hDisplay, m: mStr ?? '', period }
  }

  const initial = parseValue(value)
  const [hours, setHours] = useState(initial.h)
  const [minutes, setMinutes] = useState(initial.m)
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period)

  const lastHoursKey = useRef<string | null>(null)
  const lastMinutesKey = useRef<string | null>(null)
  const isTyping = useRef(false)
  const lastEmitted = useRef(value)

  // Sync from external value changes only when not typing
  useEffect(() => {
    if (value !== lastEmitted.current && !isTyping.current) {
      const { h, m, period: p } = parseValue(value)
      setHours(h)
      setMinutes(m)
      setPeriod(p)
      lastEmitted.current = value
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Emit always as 24h "HH:MM"
  function emit(h: string, m: string, p: 'AM' | 'PM') {
    const hNum = parseInt(h, 10)
    const mNum = parseInt(m, 10)
    if (!isNaN(hNum) && !isNaN(mNum)) {
      const h24 = use12h ? to24h(hNum, p) : Math.min(hNum, 23)
      const hh = String(h24).padStart(2, '0')
      const mm = String(Math.min(mNum, 59)).padStart(2, '0')
      const next = `${hh}:${mm}`
      lastEmitted.current = next
      onChange(next)
    } else if (h === '' && m === '') {
      lastEmitted.current = ''
      onChange('')
    }
  }

  function togglePeriod() {
    const next: 'AM' | 'PM' = period === 'AM' ? 'PM' : 'AM'
    setPeriod(next)
    emit(hours, minutes, next)
  }

  // ── Hours ──────────────────────────────────────────────────────────────────

  const maxHour = use12h ? 12 : 23

  function handleHoursKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (/^\d$/.test(e.key)) {
      lastHoursKey.current = e.key
    } else {
      lastHoursKey.current = null
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const n = Math.min((parseInt(hours || '0', 10) + 1), maxHour)
      const v = String(n).padStart(2, '0')
      setHours(v); emit(v, minutes || '00', period)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const min = use12h ? 1 : 0
      const n = Math.max((parseInt(hours || '0', 10) - 1), min)
      const v = String(n).padStart(2, '0')
      setHours(v); emit(v, minutes || '00', period)
    }
    if (e.key === ':') {
      e.preventDefault()
      minutesRef.current?.focus()
    }
  }

  function handleHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    isTyping.current = true
    const incoming = e.target.value.replace(/\D/g, '')
    let raw: string
    if (lastHoursKey.current !== null) {
      const key = lastHoursKey.current
      if (hours.length >= 2) {
        raw = key
      } else {
        raw = (hours + key).slice(0, 2)
      }
    } else if (incoming.length < hours.length) {
      raw = incoming
    } else {
      raw = incoming.slice(0, 2)
    }
    lastHoursKey.current = null
    setHours(raw)
    if (raw && minutes) emit(raw, minutes, period)
  }

  function handleHoursBlur() {
    isTyping.current = false
    lastHoursKey.current = null
    if (hours === '') return
    const n = parseInt(hours, 10)
    if (!isNaN(n)) {
      const clamped = use12h
        ? String(Math.min(Math.max(n, 1), 12)).padStart(2, '0')
        : String(Math.min(n, 23)).padStart(2, '0')
      setHours(clamped)
      if (minutes) emit(clamped, minutes, period)
    }
  }

  // ── Minutes ────────────────────────────────────────────────────────────────

  function handleMinutesKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (/^\d$/.test(e.key)) {
      lastMinutesKey.current = e.key
    } else {
      lastMinutesKey.current = null
    }
    if (e.key === 'Tab' && !e.shiftKey && nextRef?.current) {
      if (minutes === '') {
        setMinutes('00')
        emit(hours, '00', period)
      }
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const n = Math.min((parseInt(minutes || '0', 10) + 1), 59)
      const v = String(n).padStart(2, '0')
      setMinutes(v); emit(hours, v, period)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const n = Math.max((parseInt(minutes || '0', 10) - 1), 0)
      const v = String(n).padStart(2, '0')
      setMinutes(v); emit(hours, v, period)
    }
  }

  function handleMinutesChange(e: React.ChangeEvent<HTMLInputElement>) {
    isTyping.current = true
    const incoming = e.target.value.replace(/\D/g, '')
    let raw: string
    if (lastMinutesKey.current !== null) {
      const key = lastMinutesKey.current
      if (minutes.length >= 2) {
        raw = key
      } else {
        raw = (minutes + key).slice(0, 2)
      }
    } else if (incoming.length < minutes.length) {
      raw = incoming
    } else {
      raw = incoming.slice(0, 2)
    }
    lastMinutesKey.current = null
    setMinutes(raw)
    if (hours && raw) emit(hours, raw, period)
  }

  function handleMinutesBlur() {
    isTyping.current = false
    lastMinutesKey.current = null
    if (minutes === '') {
      setMinutes('00')
      emit(hours, '00', period)
      return
    }
    const n = parseInt(minutes, 10)
    if (!isNaN(n)) {
      const clamped = String(Math.min(n, 59)).padStart(2, '0')
      setMinutes(clamped)
      emit(hours, clamped, period)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex items-center h-12 px-md rounded-xl gap-xs"
      style={{
        backgroundColor: 'var(--color-surface-container)',
        border: '1px solid var(--color-outline-variant)',
      }}
      aria-label={ariaLabel}
    >
      <i
        className="fa-regular fa-clock text-[16px] flex-shrink-0 mr-xs"
        style={{ color: 'var(--color-outline)' }}
        aria-hidden="true"
      />
      <input
        ref={hoursRef}
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="HH"
        maxLength={2}
        value={hours}
        onChange={handleHoursChange}
        onBlur={handleHoursBlur}
        onKeyDown={handleHoursKeyDown}
        className="w-8 bg-transparent text-[14px] outline-none text-center"
        style={{ color: 'var(--color-on-surface)' }}
        aria-label="Hours"
      />
      <span
        className="text-[14px] font-medium select-none"
        style={{ color: 'var(--color-outline)' }}
      >
        :
      </span>
      <input
        ref={minutesRef}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        maxLength={2}
        value={minutes}
        onChange={handleMinutesChange}
        onBlur={handleMinutesBlur}
        onKeyDown={handleMinutesKeyDown}
        className="w-8 bg-transparent text-[14px] outline-none text-center"
        style={{ color: 'var(--color-on-surface)' }}
        aria-label="Minutes"
      />
      {use12h && (
        <button
          type="button"
          onClick={togglePeriod}
          className="ml-xs text-[11px] font-semibold tracking-wide px-xs py-[2px] rounded transition-colors flex-shrink-0"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
          aria-label={`Switch to ${period === 'AM' ? 'PM' : 'AM'}`}
        >
          {period}
        </button>
      )}
    </div>
  )
}
