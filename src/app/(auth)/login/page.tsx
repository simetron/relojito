import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; forgot?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const message = params.message
  const forgotMessage = params.forgot

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

          {/* Login form card */}
          <div className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-lg shadow-sm">
            {forgotMessage && (
              <div className="mb-md p-md rounded-lg bg-surface-container border border-outline-variant">
                <p className="text-[14px] text-on-surface">{forgotMessage}</p>
              </div>
            )}

            {message && (
              <div className="mb-md p-md rounded-lg bg-error-container border border-error">
                <p className="text-[14px] text-on-error-container">{message}</p>
              </div>
            )}

            <LoginForm />
          </div>

          {/* Sign up link */}
          <div className="mt-lg text-center">
            <p className="text-[14px] text-on-surface-variant">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-semibold hover:underline decoration-primary underline-offset-4 text-primary"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-screen-2xl mx-auto px-gutter py-lg flex justify-between items-center text-[12px] leading-[1] tracking-[0.02em] font-medium text-on-surface-variant">
        <div className="flex gap-lg">
          <a
            href="#"
            className="transition-colors hover:text-on-surface"
          >
            Privacy
          </a>
          <a
            href="#"
            className="transition-colors hover:text-on-surface"
          >
            Terms
          </a>
          <a
            href="#"
            className="transition-colors hover:text-on-surface"
          >
            Help
          </a>
        </div>
        <div>© 2026 Relojito</div>
      </footer>
    </div>
  )
}
