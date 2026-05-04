import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStatsData } from '@/app/actions/stats'
import StatsClient from '@/components/stats/StatsClient'
import StatsSkeleton from '@/components/stats/StatsSkeleton'

// ─── StatsContent ─────────────────────────────────────────────────────────────

async function StatsContent() {
  const { stats, sessions, error } = await getStatsData(7)
  return (
    <StatsClient
      initialStats={stats ?? []}
      initialSessions={sessions ?? []}
      initialError={error}
    />
  )
}

// ─── StatsPage ────────────────────────────────────────────────────────────────

export default async function StatsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsContent />
    </Suspense>
  )
}
