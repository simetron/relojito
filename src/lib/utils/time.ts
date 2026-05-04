/**
 * Format elapsed seconds as HH:MM:SS.
 * Satisfies Req 3.2 — live counter format.
 *
 * @param elapsed - Non-negative integer number of seconds
 * @returns String in "HH:MM:SS" format (hours may exceed 99)
 */
export function formatHHMMSS(elapsed: number): string {
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0')
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

/**
 * Parse a "HH:MM:SS" string back to total seconds.
 * Inverse of formatHHMMSS.
 *
 * @param hhmmss - String in "HH:MM:SS" format
 * @returns Total number of seconds as a non-negative integer
 */
export function parseHHMMSS(hhmmss: string): number {
  const parts = hhmmss.split(':')
  const hh = parseInt(parts[0], 10)
  const mm = parseInt(parts[1], 10)
  const ss = parseInt(parts[2], 10)
  return hh * 3600 + mm * 60 + ss
}
