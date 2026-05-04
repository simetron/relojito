'use client'

import { useState } from 'react'
import Link from 'next/link'
import { registerAction } from './actions'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleRegister(formData: FormData) {
    setError(null)
    setIsPending(true)
    try {
      const result = await registerAction(formData)
      if (result?.error) {
        setError(result.error)
      }
      // On success, the server action redirects — no client-side action needed
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <main className="flex-grow flex items-center justify-center p-gutter">
        <div className="max-w-[400px] w-full flex flex-col items-center">
          {/* Logo and tagline */}
          <div className="mb-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-surface-container-highest border border-outline-variant/30 mb-md">
              <i className="fa-solid fa-hourglass text-primary text-4xl"></i>
            </div>
            <h1 className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold mb-xs text-on-surface">
              Relojito
            </h1>
            <p className="text-[14px] leading-[1.5] text-on-surface-variant">
              Focus on what matters, one second at a time.
            </p>
          </div>

          {/* Register form card */}
          <div className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-lg shadow-sm">
            <form action={handleRegister} className="space-y-md">
              {error && (
                <div className="p-md rounded-lg bg-error-container border border-error">
                  <p className="text-[14px] text-on-error-container">{error}</p>
                </div>
              )}

              <div className="space-y-xs">
                <label
                  className="text-[12px] leading-[1] tracking-[0.02em] font-medium text-on-surface-variant block px-1"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  className="w-full h-11 px-md rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                  id="email"
                  name="email"
                  placeholder="name@company.com"
                  type="email"
                  required
                />
              </div>

              <div className="space-y-xs">
                <label
                  className="text-[12px] leading-[1] tracking-[0.02em] font-medium text-on-surface-variant block px-1"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  className="w-full h-11 px-md rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  minLength={6}
                />
                <p className="text-[12px] text-on-surface-variant px-1">
                  Must be at least 6 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-primary text-on-primary text-[14px] font-semibold rounded-lg border-t border-white/10 hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-sm mt-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? 'Creating account…' : 'Sign Up'}
              </button>
            </form>
          </div>

          {/* Sign in link */}
          <div className="mt-lg text-center">
            <p className="text-[14px] text-on-surface-variant">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold hover:underline decoration-primary underline-offset-4 text-primary"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-screen-2xl mx-auto px-gutter py-lg flex justify-between items-center text-[12px] leading-[1] tracking-[0.02em] font-medium text-on-surface-variant">
        <div className="flex gap-lg">
          <a href="#" className="transition-colors hover:text-on-surface">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-on-surface">
            Terms
          </a>
          <a href="#" className="transition-colors hover:text-on-surface">
            Help
          </a>
        </div>
        <div>© 2026 Relojito</div>
      </footer>
    </div>
  )
}
