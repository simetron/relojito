'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Session {
  id: string
  timer_id: string
  user_id: string
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  source: 'automatic' | 'manual'
  created_at: string
  updated_at: string
}

export interface HistorySession {
  id: string
  timer_id: string
  user_id: string
  start_time: string
  end_time: string
  duration_seconds: number
  source: 'automatic' | 'manual'
  created_at: string
  updated_at: string
  timer_name: string
  timer_color: string
  timer_icon: string
}

export interface GetHistoryResult {
  sessions: HistorySession[]
  error?: string
}

export type SessionActionResult =
  | { data: Session; error?: never; discarded?: never }
  | { data?: never; error: string; discarded?: never }
  | { data?: never; error?: never; discarded: true }

// ─── startTimer ───────────────────────────────────────────────────────────────

/**
 * Creates a new active session for the given timer.
 * The DB unique index `one_active_session_per_user` prevents two active sessions.
 * Satisfies Req 3.1.
 */
export async function startTimer(timerId: string): Promise<SessionActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      timer_id: timerId,
      user_id: user.id,
      start_time: new Date().toISOString(),
      end_time: null,
      source: 'automatic',
    })
    .select()
    .single()

  if (error) {
    // Unique constraint violation — another session is already active
    if (error.code === '23505') {
      return { error: 'Another timer is already running.' }
    }
    return { error: 'Failed to start timer. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { data: data as Session }
}

// ─── stopTimer ────────────────────────────────────────────────────────────────

/**
 * Closes an active session by setting end_time and computing duration_seconds.
 * Satisfies Req 3.3.
 */
export async function stopTimer(sessionId: string): Promise<SessionActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Fetch the session to get start_time
  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !session) {
    return { error: 'Session not found.' }
  }

  const endTime = new Date()
  const startTime = new Date(session.start_time)
  const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

  // Sessions under 60 seconds are discarded automatically
  if (durationSeconds < 60) {
    await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id)

    revalidatePath('/dashboard')
    return { discarded: true }
  }

  const { data, error } = await supabase
    .from('sessions')
    .update({
      end_time: endTime.toISOString(),
      duration_seconds: durationSeconds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: 'Failed to stop timer. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { data: data as Session }
}

// ─── discardSession ───────────────────────────────────────────────────────────

/**
 * Permanently deletes an active (orphaned) session without recording duration.
 * Satisfies Req 3.7 (Discard action).
 */
export async function discardSession(sessionId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to discard session. Please try again.' }
  }

  revalidatePath('/dashboard')
  return {}
}

// ─── deleteSession ────────────────────────────────────────────────────────────

/**
 * Permanently deletes a closed session by id, scoped to the authenticated user.
 * Works for sessions of any source (automatic or manual).
 * Satisfies Req 7 AC 7 & 8.
 */
export async function deleteSession(sessionId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (!sessionId || sessionId.trim() === '') {
    return { error: 'Session ID is required.' }
  }

  const { error, count } = await supabase
    .from('sessions')
    .delete({ count: 'exact' })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete session. Please try again.' }
  }

  if (count === 0) {
    return { error: 'Session not found.' }
  }

  revalidatePath('/history')
  revalidatePath('/dashboard')
  return {}
}

// ─── saveManualSession ────────────────────────────────────────────────────────

/**
 * Creates or updates a session with source = 'manual'.
 * If sessionId is provided, updates the existing session (edit mode).
 * If sessionId is omitted, inserts a new session (create mode).
 * Satisfies Req 7.3, 7.5, 7.6.
 */
export async function saveManualSession(params: {
  sessionId?: string
  timerId: string
  startTime: string  // UTC ISO string
  endTime: string    // UTC ISO string
}): Promise<SessionActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { sessionId, timerId, startTime, endTime } = params

  // ── Server-side validation ──────────────────────────────────────────────────

  if (!timerId || timerId.trim() === '') {
    return { error: 'Timer is required.' }
  }

  const startDate = new Date(startTime)
  const endDate = new Date(endTime)

  if (isNaN(startDate.getTime())) {
    return { error: 'Invalid start time.' }
  }

  if (isNaN(endDate.getTime())) {
    return { error: 'Invalid end time.' }
  }

  if (endDate <= startDate) {
    return { error: 'End time must be after start time.' }
  }

  const now = new Date()
  if (startDate > now) {
    return { error: 'Start time cannot be in the future.' }
  }
  if (endDate > now) {
    return { error: 'End time cannot be in the future.' }
  }

  const durationSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000)

  if (durationSeconds <= 0) {
    return { error: 'Session duration must be greater than zero.' }
  }

  // ── Upsert ──────────────────────────────────────────────────────────────────

  let data: Session | null = null
  let error: { code?: string; message: string } | null = null

  if (sessionId) {
    // Edit mode: update existing session
    const result = await supabase
      .from('sessions')
      .update({
        timer_id: timerId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_seconds: durationSeconds,
        source: 'manual',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    data = result.data as Session | null
    error = result.error
  } else {
    // Create mode: insert new session
    const result = await supabase
      .from('sessions')
      .insert({
        timer_id: timerId,
        user_id: user.id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_seconds: durationSeconds,
        source: 'manual',
      })
      .select()
      .single()

    data = result.data as Session | null
    error = result.error
  }

  if (error) {
    // Check constraint violation (end_time > start_time or duration_seconds > 0)
    if (error.code === '23514') {
      return { error: 'Invalid session: end time must be after start time.' }
    }
    // Foreign key violation (timer not found)
    if (error.code === '23503') {
      return { error: 'Timer not found.' }
    }
    return { error: 'Failed to save session. Please try again.' }
  }

  revalidatePath('/history')
  revalidatePath('/dashboard')
  return { data: data as Session }
}

// ─── getHistorySessions ───────────────────────────────────────────────────────

/**
 * Fetches closed sessions joined with timer data for the History screen.
 * Ordered by start_time DESC with pagination (LIMIT 50, OFFSET based on page).
 * Satisfies Req 6.1.
 */
export async function getHistorySessions(page: number = 0): Promise<GetHistoryResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { sessions: [], error: 'Not authenticated' }
  }

  const LIMIT = 50
  const offset = page * LIMIT

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      timer_id,
      user_id,
      start_time,
      end_time,
      duration_seconds,
      source,
      created_at,
      updated_at,
      timers!inner (
        name,
        color,
        icon
      )
    `)
    .eq('user_id', user.id)
    .not('end_time', 'is', null)
    .order('start_time', { ascending: false })
    .range(offset, offset + LIMIT - 1)

  if (error) {
    return { sessions: [], error: 'Failed to fetch history.' }
  }

  // Flatten the joined timer data into the session object
  const sessions: HistorySession[] = (data ?? []).map((row) => {
    const timer = Array.isArray(row.timers) ? row.timers[0] : row.timers
    return {
      id: row.id,
      timer_id: row.timer_id,
      user_id: row.user_id,
      start_time: row.start_time,
      end_time: row.end_time as string,
      duration_seconds: row.duration_seconds as number,
      source: row.source as 'automatic' | 'manual',
      created_at: row.created_at,
      updated_at: row.updated_at,
      timer_name: (timer as { name: string; color: string; icon: string }).name,
      timer_color: (timer as { name: string; color: string; icon: string }).color,
      timer_icon: (timer as { name: string; color: string; icon: string }).icon,
    }
  })

  return { sessions }
}
