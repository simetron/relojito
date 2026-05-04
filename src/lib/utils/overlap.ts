import { createClient } from '@/lib/supabase/client'

/**
 * Check if a proposed session time range overlaps with any existing closed session
 * for the current user. Excludes the session being edited (by excludeSessionId).
 *
 * Two intervals [A_start, A_end] and [B_start, B_end] overlap if:
 *   A_start < B_end AND A_end > B_start
 */
export async function checkOverlap(
  startTime: Date,
  endTime: Date,
  excludeSessionId?: string
): Promise<{ hasOverlap: boolean; error?: string }> {
  try {
    const supabase = createClient()

    let query = supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .not('end_time', 'is', null)
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString())

    if (excludeSessionId) {
      query = query.neq('id', excludeSessionId)
    }

    const { count, error } = await query

    if (error) {
      console.error('Overlap check error:', error)
      return { hasOverlap: false, error: error.message }
    }

    return { hasOverlap: (count ?? 0) > 0 }
  } catch (err) {
    console.error('Overlap check unexpected error:', err)
    return { hasOverlap: false, error: 'Unexpected error during overlap check' }
  }
}
