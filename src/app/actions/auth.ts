'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function logoutAction() {
  const supabase = await createClient()

  // Sign out clears the session cookie via @supabase/ssr
  await supabase.auth.signOut()

  redirect('/login')
}
