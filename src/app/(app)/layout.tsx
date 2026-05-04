import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import RecoveryBanner from '@/components/layout/RecoveryBanner'
import { RealtimeProvider } from '@/lib/realtime/RealtimeSessionContext'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Query for an orphaned session (end_time IS NULL) for recovery banner.
  // Joins timers to get the timer name for the banner message.
  // Satisfies Req 3.7.
  const { data: orphanedSession } = await supabase
    .from('sessions')
    .select('id, timer_id, timers(name)')
    .eq('user_id', user.id)
    .is('end_time', null)
    .limit(1)
    .maybeSingle()

  // Extract timer name from the join result
  const orphanedTimerName =
    orphanedSession && orphanedSession.timers
      ? (Array.isArray(orphanedSession.timers)
          ? (orphanedSession.timers[0] as { name: string })?.name
          : (orphanedSession.timers as unknown as { name: string }).name)
      : null

  return (
    <RealtimeProvider userId={user.id}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface)' }}>
        {/* Sidebar — visible at ≥ 1280px */}
        <Sidebar />

        {/* Bottom navigation — visible below 1280px */}
        <BottomNav />

        {/* Main content area */}
        <main
          className="xl:ml-60 min-h-screen"
        >
          {/* Content constraint: max-width 800px on desktop, full width on mobile */}
          <div
            className="
              mx-auto
              w-full
              max-w-full
              xl:max-w-[800px]
              px-md
              xl:px-0
              pb-16
              xl:pb-0
            "
          >
            {children}
          </div>
        </main>

        {/* Recovery banner — shown when an orphaned active session exists */}
        {orphanedSession && orphanedTimerName && (
          <RecoveryBanner
            sessionId={orphanedSession.id}
            timerName={orphanedTimerName}
          />
        )}
      </div>
    </RealtimeProvider>
  )
}
