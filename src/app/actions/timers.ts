'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  ALLOWED_COLORS,
  ALLOWED_ICONS,
  type TimerActionResult,
  type Timer,
} from '@/lib/utils/timerConstants'

// ─── createTimer ──────────────────────────────────────────────────────────────

export async function createTimer(
  formData: FormData
): Promise<TimerActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const rawName = formData.get('name')
  const color = formData.get('color') as string
  const icon = formData.get('icon') as string

  // Validate name
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  if (!name || name.length < 1) {
    return { error: 'Name is required.' }
  }
  if (name.length > 32) {
    return { error: 'Name must be 32 characters or fewer.' }
  }

  // Validate color
  if (!ALLOWED_COLORS.includes(color as (typeof ALLOWED_COLORS)[number])) {
    return { error: 'Please select a valid color.' }
  }

  // Validate icon
  if (!ALLOWED_ICONS.includes(icon as (typeof ALLOWED_ICONS)[number])) {
    return { error: 'Please select a valid icon.' }
  }

  const { error: dbError } = await supabase.from('timers').insert({
    user_id: user.id,
    name,
    color,
    icon,
    position: 0,
  })

  if (dbError) {
    // Unique constraint violation — duplicate name
    if (dbError.code === '23505') {
      return { error: `A timer named "${name}" already exists.` }
    }
    return { error: 'Failed to create timer. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── updateTimer ──────────────────────────────────────────────────────────────

export async function updateTimer(
  formData: FormData
): Promise<TimerActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const timerId = formData.get('timerId') as string
  const rawName = formData.get('name')
  const color = formData.get('color') as string
  const icon = formData.get('icon') as string

  if (!timerId) {
    return { error: 'Timer ID is required.' }
  }

  // Validate name
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  if (!name || name.length < 1) {
    return { error: 'Name is required.' }
  }
  if (name.length > 32) {
    return { error: 'Name must be 32 characters or fewer.' }
  }

  // Validate color
  if (!ALLOWED_COLORS.includes(color as (typeof ALLOWED_COLORS)[number])) {
    return { error: 'Please select a valid color.' }
  }

  // Validate icon
  if (!ALLOWED_ICONS.includes(icon as (typeof ALLOWED_ICONS)[number])) {
    return { error: 'Please select a valid icon.' }
  }

  const { error: dbError } = await supabase
    .from('timers')
    .update({ name, color, icon, updated_at: new Date().toISOString() })
    .eq('id', timerId)
    .eq('user_id', user.id)

  if (dbError) {
    if (dbError.code === '23505') {
      return { error: `A timer named "${name}" already exists.` }
    }
    return { error: 'Failed to update timer. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── getUserTimers ────────────────────────────────────────────────────────────

/**
 * Returns all timers belonging to the authenticated user.
 * Used to populate the timer selector in modals.
 */
export async function getUserTimers(): Promise<{ timers: Timer[]; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { timers: [], error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('timers')
    .select('id, name, color, icon')
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  if (error) {
    return { timers: [], error: 'Failed to fetch timers.' }
  }

  return { timers: (data ?? []) as Timer[] }
}

// ─── deleteTimer ──────────────────────────────────────────────────────────────

export async function deleteTimer(timerId: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await supabase
    .from('timers')
    .delete()
    .eq('id', timerId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// ─── reorderTimers ────────────────────────────────────────────────────────────

/**
 * Saves a new order for the user's timers by updating the position field.
 * Receives an ordered array of timer IDs.
 */
export async function reorderTimers(orderedIds: string[]): Promise<TimerActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Update each timer's position in parallel
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('timers')
      .update({ position: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    return { error: 'Failed to save order. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── archiveTimer ─────────────────────────────────────────────────────────────

export async function archiveTimer(timerId: string): Promise<TimerActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('timers')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', timerId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to archive timer.' }
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── restoreTimer ─────────────────────────────────────────────────────────────

export async function restoreTimer(timerId: string): Promise<TimerActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('timers')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', timerId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to restore timer.' }
  revalidatePath('/dashboard')
  return { success: true }
}
