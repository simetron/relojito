'use client'

import { useState } from 'react'
import { loginAction, forgotPasswordAction } from './actions'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function LoginForm() {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function handleLogin(formData: FormData) {
    setError(null)
    setIsPending(true)
    try {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`Something went wrong: ${msg}`)
    } finally {
      setIsPending(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const formData = new FormData()
      formData.set('email', forgotEmail)
      const result = await forgotPasswordAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setForgotMessage(result?.message ?? t('auth.resetSent') as string)
        setShowForgot(false)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  if (showForgot) {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-md">
        <div>
          <h2 className="text-[18px] leading-[1.4] tracking-[-0.01em] font-medium text-on-surface mb-xs">
            {t('auth.resetPassword') as string}
          </h2>
          <p className="text-[14px] text-on-surface-variant">
            {t('auth.resetPasswordDesc') as string}
          </p>
        </div>

        {error && (
          <div className="p-md rounded-lg bg-error-container border border-error">
            <p className="text-[14px] text-on-error-container">{error}</p>
          </div>
        )}

        <div className="space-y-xs">
          <label
            className="text-[12px] leading-[1] tracking-[0.02em] font-medium text-on-surface-variant block px-1"
            htmlFor="forgot-email"
          >
            {t('auth.emailAddress') as string}
          </label>
          <input
            className="w-full h-11 px-md rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
            id="forgot-email"
            name="email"
            placeholder="name@company.com"
            type="email"
            required
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-primary text-on-primary text-[14px] font-semibold rounded-lg border-t border-white/10 hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-sm mt-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? t('auth.sending') as string : t('auth.sendResetLink') as string}
        </button>

        <button
          type="button"
          onClick={() => { setShowForgot(false); setError(null) }}
          className="w-full text-center text-[14px] text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {t('auth.backToSignIn') as string}
        </button>
      </form>
    )
  }

  return (
    <>
      {forgotMessage && (
        <div className="mb-md p-md rounded-lg bg-surface-container border border-outline-variant">
          <p className="text-[14px] text-on-surface">{forgotMessage}</p>
        </div>
      )}

      <form action={handleLogin} className="space-y-md">
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
            {t('auth.emailAddress') as string}
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
          <div className="flex justify-between items-center px-1">
            <label
              className="text-[12px] leading-[1] tracking-[0.02em] font-medium text-on-surface-variant block"
              htmlFor="password"
            >
              {t('auth.password') as string}
            </label>
            <button
              type="button"
              onClick={() => { setShowForgot(true); setError(null) }}
              className="text-[12px] leading-[1] tracking-[0.02em] font-medium text-secondary hover:text-secondary/80 transition-colors"
            >
              {t('auth.forgotPassword') as string}
            </button>
          </div>
          <input
            className="w-full h-11 px-md rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
            id="password"
            name="password"
            placeholder="••••••••"
            type="password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-primary text-on-primary text-[14px] font-semibold rounded-lg border-t border-white/10 hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-sm mt-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? t('auth.signingIn') as string : t('auth.signInButton') as string}
        </button>
      </form>
    </>
  )
}
