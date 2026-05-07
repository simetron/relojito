import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const meta = user.user_metadata ?? {}
  const theme: 'dark' | 'light' = meta.theme === 'dark' ? 'dark' : 'light'
  const timeFormat: '12h' | '24h' = meta.time_format === '12h' ? '12h' : '24h'
  const initialLanguage: 'en' | 'es' = meta.language === 'es' ? 'es' : 'en'

  return (
    <SettingsClient
      email={user.email ?? ''}
      initialTheme={theme}
      initialTimeFormat={timeFormat}
      initialLanguage={initialLanguage}
    />
  )
}
