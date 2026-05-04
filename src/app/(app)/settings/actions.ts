'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function changePasswordAction(formData: FormData) {
  const password = formData.get('password') as string

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message || 'Failed to update password.' }

  return { success: true }
}

export async function deleteAccountAction() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  // If service role key is available, use admin API to fully delete the account
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { error } = await adminClient.auth.admin.deleteUser(user.id)
    if (error) return { error: error.message || 'Failed to delete account.' }
  } else {
    // Fallback: delete all user data (timers cascade to sessions via FK)
    await supabase.from('timers').delete().eq('user_id', user.id)
  }

  await supabase.auth.signOut()
  redirect('/login')
}
