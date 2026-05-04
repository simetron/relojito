'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get('password') as string

  if (!password) {
    return { error: 'Password is required.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message || 'Failed to update password. Please try again.' }
  }

  // On success, redirect to login
  redirect('/login')
}
