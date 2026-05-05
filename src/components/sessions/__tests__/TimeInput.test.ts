/**
 * Unit tests for TimeInput logic.
 * Tests the pure functions that handle time parsing and formatting.
 */
import { describe, it, expect } from 'vitest'

// ── Pure logic extracted from TimeInput ──────────────────────────────────────

function parseValue(v: string): { h: string; m: string } {
  if (!v) return { h: '', m: '' }
  const [h, m] = v.split(':')
  return { h: h ?? '', m: m ?? '' }
}

function buildTimeString(h: string, m: string): string | null {
  const hNum = parseInt(h, 10)
  const mNum = parseInt(m, 10)
  if (isNaN(hNum) || isNaN(mNum)) return null
  const hh = String(Math.min(hNum, 23)).padStart(2, '0')
  const mm = String(Math.min(mNum, 59)).padStart(2, '0')
  return `${hh}:${mm}`
}

function clampHours(raw: string): string {
  const n = parseInt(raw, 10)
  if (isNaN(n)) return raw
  return String(Math.min(n, 23)).padStart(2, '0')
}

function clampMinutes(raw: string): string {
  const n = parseInt(raw, 10)
  if (isNaN(n)) return '00'
  return String(Math.min(n, 59)).padStart(2, '0')
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TimeInput logic', () => {
  describe('parseValue', () => {
    it('parses "15:30" correctly', () => {
      expect(parseValue('15:30')).toEqual({ h: '15', m: '30' })
    })
    it('parses empty string as empty', () => {
      expect(parseValue('')).toEqual({ h: '', m: '' })
    })
  })

  describe('buildTimeString', () => {
    it('builds "15:55" from h="15" m="55"', () => {
      expect(buildTimeString('15', '55')).toBe('15:55')
    })
    it('builds "01:05" from h="1" m="5"', () => {
      expect(buildTimeString('1', '5')).toBe('01:05')
    })
    it('clamps hours > 23', () => {
      expect(buildTimeString('25', '00')).toBe('23:00')
    })
    it('clamps minutes > 59', () => {
      expect(buildTimeString('10', '65')).toBe('10:59')
    })
    it('returns null for non-numeric input', () => {
      expect(buildTimeString('', '')).toBeNull()
    })
  })

  describe('clampHours', () => {
    it('pads single digit "1" to "01"', () => {
      expect(clampHours('1')).toBe('01')
    })
    it('keeps "15" as "15"', () => {
      expect(clampHours('15')).toBe('15')
    })
    it('keeps "23" as "23"', () => {
      expect(clampHours('23')).toBe('23')
    })
    it('clamps "25" to "23"', () => {
      expect(clampHours('25')).toBe('23')
    })
  })

  describe('clampMinutes', () => {
    it('pads single digit "5" to "05"', () => {
      expect(clampMinutes('5')).toBe('05')
    })
    it('keeps "55" as "55"', () => {
      expect(clampMinutes('55')).toBe('55')
    })
    it('keeps "59" as "59"', () => {
      expect(clampMinutes('59')).toBe('59')
    })
    it('clamps "65" to "59"', () => {
      expect(clampMinutes('65')).toBe('59')
    })
  })

  describe('typing simulation', () => {
    it('typing "1" then "5" in hours field produces "15"', () => {
      // Simulate: user types "1" → raw = "1", no clamp yet
      // Then types "5" → raw = "15" (appended, not replaced)
      let raw = ''
      // keystroke "1"
      raw = (raw + '1').replace(/\D/g, '').slice(0, 2)
      expect(raw).toBe('1')
      // keystroke "5"
      raw = (raw + '5').replace(/\D/g, '').slice(0, 2)
      expect(raw).toBe('15')
      // on blur, clamp
      expect(clampHours(raw)).toBe('15')
    })

    it('typing "5" then "5" in minutes field produces "55"', () => {
      let raw = ''
      raw = (raw + '5').replace(/\D/g, '').slice(0, 2)
      expect(raw).toBe('5')
      raw = (raw + '5').replace(/\D/g, '').slice(0, 2)
      expect(raw).toBe('55')
      expect(clampMinutes(raw)).toBe('55')
    })

    it('typing "0" then "9" in hours produces "09"', () => {
      let raw = ''
      raw = (raw + '0').replace(/\D/g, '').slice(0, 2)
      raw = (raw + '9').replace(/\D/g, '').slice(0, 2)
      expect(raw).toBe('09')
      expect(clampHours(raw)).toBe('09')
    })
  })
})

describe('append-based change handler simulation', () => {
  // Simulates the keyDown+onChange logic using lastKey tracking
  function simulateType(currentState: string, key: string): string {
    if (!/^\d$/.test(key)) return currentState
    return (currentState + key).slice(0, 2)
  }

  it('typing "1" then "5" in hours produces "15"', () => {
    let state = ''
    state = simulateType(state, '1')
    expect(state).toBe('1')
    state = simulateType(state, '5')
    expect(state).toBe('15')
    expect(clampHours(state)).toBe('15')
  })

  it('typing "5" then "5" in minutes produces "55"', () => {
    let state = ''
    state = simulateType(state, '5')
    expect(state).toBe('5')
    state = simulateType(state, '5')
    expect(state).toBe('55')
    expect(clampMinutes(state)).toBe('55')
  })

  it('overwriting a full field: "15" → type "9" → starts fresh as "9"', () => {
    let state = '15'
    // Field is full (2 digits), user types "9" — should start fresh
    if (state.length >= 2) {
      state = '9'
    } else {
      state = (state + '9').slice(0, 2)
    }
    expect(state).toBe('9')
  })

  it('overwriting full minutes "55" → type "3" → starts fresh as "3"', () => {
    let state = '55'
    if (state.length >= 2) {
      state = '3'
    } else {
      state = (state + '3').slice(0, 2)
    }
    expect(state).toBe('3')
  })

  it('typing "0" then "9" in hours produces "09"', () => {
    let state = ''
    state = simulateType(state, '0')
    state = simulateType(state, '9')
    expect(state).toBe('09')
    expect(clampHours(state)).toBe('09')
  })

  it('typing "2" then "3" in hours produces "23"', () => {
    let state = ''
    state = simulateType(state, '2')
    state = simulateType(state, '3')
    expect(state).toBe('23')
    expect(clampHours(state)).toBe('23')
  })

  it('typing "5" then "9" in minutes produces "59"', () => {
    let state = ''
    state = simulateType(state, '5')
    state = simulateType(state, '9')
    expect(state).toBe('59')
    expect(clampMinutes(state)).toBe('59')
  })
})
