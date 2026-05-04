export interface Interval {
  start: Date | string // ISO string or Date
  end: Date | string
}

/**
 * Returns true if interval A overlaps interval B.
 * Two intervals overlap if A.start < B.end AND A.end > B.start.
 * Adjacent intervals (touching at a single point) are NOT considered overlapping.
 */
export function overlaps(a: Interval, b: Interval): boolean {
  const aStart = new Date(a.start).getTime()
  const aEnd = new Date(a.end).getTime()
  const bStart = new Date(b.start).getTime()
  const bEnd = new Date(b.end).getTime()
  return aStart < bEnd && aEnd > bStart
}
