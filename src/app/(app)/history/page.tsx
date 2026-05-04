import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHistorySessions } from '@/app/actions/sessions'
import { getUserTimers } from '@/app/actions/timers'
import HistoryClient from '@/components/sessions/HistoryClient'
import HistorySkeleton from '@/components/sessions/HistorySkeleton'

// ─── Page ─────────────────────────────────────────────────────────────────────

interface HistoryPageProps {
  searchParams: Promise<{ page?: string }>
}

async function HistoryContent({ page }: { page: number }) {
  const [{ sessions, error }, { timers }] = await Promise.all([
    getHistorySessions(page),
    getUserTimers(),
  ])

  if (error && error !== 'Not authenticated') {
    // Non-auth errors: show empty state via client component
    return <HistoryClient sessions={[]} timers={timers} page={page} hasMore={false} />
  }

  // hasMore: if we got exactly 50 results, there may be more
  const hasMore = sessions.length === 50

  return <HistoryClient sessions={sessions} timers={timers} page={page} hasMore={hasMore} />
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const page = Math.max(0, parseInt(params.page ?? '0', 10) || 0)

  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryContent page={page} />
    </Suspense>
  )
}
