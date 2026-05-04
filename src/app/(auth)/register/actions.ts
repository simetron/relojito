'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    // Handle duplicate email specifically
    if (
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('user already exists') ||
      error.code === 'user_already_exists'
    ) {
      return {
        error:
          'An account with this email already exists. Please sign in instead.',
      }
    }
    return { error: error.message || 'Registration failed. Please try again.' }
  }

  // On success, redirect to dashboard
  redirect('/dashboard')
}
