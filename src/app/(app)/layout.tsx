import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
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

  return (
    <RealtimeProvider userId={user.id}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface)' }}>
        {/* Sidebar — visible at ≥ 1280px */}
        <Sidebar />

        {/* Bottom navigation — visible below 1280px */}
        <BottomNav />

        {/* Main content area */}
        <main className="xl:ml-60 min-h-screen">
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
      </div>
    </RealtimeProvider>
  )
}
