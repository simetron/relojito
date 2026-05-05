'use client'

import { useEffect, useState } from 'react'

export type TimeFormat = '12h' | '24h'

const STORAGE_KEY = 'time-format'
const DEFAULT: TimeFormat = '24h'

/**
 * Reads/writes the user's preferred time format from localStorage.
 * Returns the current format and a setter.
 */
export function useTimeFormat(): [TimeFormat, (f: TimeFormat) => void] {
  const [format, setFormatState] = useState<TimeFormat>(DEFAULT)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === '12h' || stored === '24h') {
      setFormatState(stored)
    }
  }, [])

  function setFormat(f: TimeFormat) {
    setFormatState(f)
    localStorage.setItem(STORAGE_KEY, f)
  }

  return [format, setFormat]
}

/**
 * Format a UTC ISO string as a local time string respecting the given format.
 */
export function formatLocalTime(utcIso: string, format: TimeFormat): string {
  return new Date(utcIso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h',
  })
}
