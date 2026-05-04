import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import DashboardSkeleton from '@/components/timers/DashboardSkeleton'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a Date as "Month Day" (e.g. "May 4", "July 24").
 * Runs server-side so we use UTC date — the shell layout note says
 * timezone conversion is client-side, but the date heading is a
 * server-rendered string. We use the server's UTC date here.
 * (A future enhancement could pass the date as a prop to a client component
 * that reads the local timezone.)
 */
function formatDateHeading(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

/**
 * Async server component that fetches all dashboard data and renders
 * DashboardClient. Wrapped in Suspense so DashboardSkeleton shows while
 * this component is streaming.
 */
async function DashboardData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch timers ordered by created_at ASC
  const { data: timers } = await supabase
    .from('timers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Compute today's UTC midnight
  const now = new Date()
  const todayMidnightUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString()

  // Fetch today's closed sessions for this user
  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('timer_id, duration_seconds')
    .eq('user_id', user.id)
    .not('end_time', 'is', null)
    .gte('start_time', todayMidnightUTC)

  // Build a map: timer_id → total seconds today
  const todaySecondsMap: Record<string, number> = {}
  for (const session of todaySessions ?? []) {
    const prev = todaySecondsMap[session.timer_id] ?? 0
    todaySecondsMap[session.timer_id] = prev + (session.duration_seconds ?? 0)
  }

  const dateHeading = formatDateHeading(now)

  // Fetch the active session (if any) to pass to DashboardClient
  const { data: activeSessionRow } = await supabase
    .from('sessions')
    .select('id, timer_id, start_time')
    .eq('user_id', user.id)
    .is('end_time', null)
    .limit(1)
    .maybeSingle()

  return (
    <DashboardClient
      timers={timers ?? []}
      todaySecondsMap={todaySecondsMap}
      dateHeading={dateHeading}
      initialActiveSession={
        activeSessionRow
          ? {
              id: activeSessionRow.id,
              timer_id: activeSessionRow.timer_id,
              start_time: activeSessionRow.start_time,
            }
          : undefined
      }
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  )
}
