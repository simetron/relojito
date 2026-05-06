'use client'

import { useState, useEffect } from 'react'
import { changePasswordAction, deleteAccountAction, saveThemeAction, saveTimeFormatAction } from './actions'
import { useTimeFormat } from '@/lib/utils/useTimeFormat'
import type { TimeFormat } from '@/lib/utils/useTimeFormat'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the local part of an email (everything before @). */
function emailLocalPart(email: string): string {
  return email.split('@')[0] ?? email
}

/** Returns the first character of the email local part, uppercased. */
function emailInitial(email: string): string {
  return (emailLocalPart(email)[0] ?? '?').toUpperCase()
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({
  children,
  color = 'text-outline',
}: {
  children: React.ReactNode
  color?: string
}) {
  return (
    <h2
      className={`text-[12px] font-medium tracking-[0.02em] uppercase mb-md px-1 ${color}`}
    >
      {children}
    </h2>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-lg ${className}`}
    >
      {children}
    </div>
  )
}

// ─── Change Password Form ─────────────────────────────────────────────────────

function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsPending(true)
    try {
      const formData = new FormData()
      formData.set('password', newPassword)
      const result = await changePasswordAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-md">
      <p className="text-[14px] font-medium text-on-surface">Change Password</p>

      {error && (
        <div className="p-md rounded-lg bg-error-container border border-error">
          <p className="text-[14px] text-on-error-container">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-md rounded-lg bg-surface-container border border-outline-variant">
          <p className="text-[14px] text-on-surface">
            Password updated successfully.
          </p>
        </div>
      )}

      <div className="space-y-xs">
        <label
          htmlFor="new-password"
          className="text-[12px] leading-[1] tracking-[0.02em] font-medium text-on-surface-variant block px-1"
        >
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          name="password"
          placeholder="••••••••"
          minLength={6}
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full h-11 px-md rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
        />
      </div>

      <div className="space-y-xs">
        <label
          htmlFor="confirm-password"
          className="text-[12px] leading-[1] tracking-[0.02em] font-medium text-on-surface-variant block px-1"
        >
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          name="confirm-password"
          placeholder="••••••••"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full h-11 px-md rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 bg-primary text-on-primary text-[14px] font-semibold rounded-lg border-t border-white/10 hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Updating…' : 'Update Password'}
      </button>
    </form>
  )
}

// ─── Dark Mode Toggle ─────────────────────────────────────────────────────────

function DarkModeToggle({ initialTheme }: { initialTheme: 'dark' | 'light' }) {
  const [isDark, setIsDark] = useState(initialTheme === 'dark')

  // Apply theme on mount from server-provided value
  useEffect(() => {
    if (initialTheme === 'dark') {
      localStorage.setItem('theme', 'dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      localStorage.setItem('theme', 'light')
      document.documentElement.removeAttribute('data-theme')
    }
  }, [initialTheme])

  async function handleToggleDark() {
    const next = !isDark
    setIsDark(next)
    const theme = next ? 'dark' : 'light'
    // Apply locally
    if (next) {
      localStorage.setItem('theme', 'dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      localStorage.setItem('theme', 'light')
      document.documentElement.removeAttribute('data-theme')
    }
    // Persist to Supabase for cross-device sync
    await saveThemeAction(theme)
  }

  return (
    <div className="flex items-center justify-between gap-md">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-on-surface">Dark Mode</p>
        <p className="text-[12px] text-on-surface-variant mt-xs">
          Switch between light and dark theme
        </p>
      </div>
      <button
        role="switch"
        aria-checked={isDark}
        onClick={handleToggleDark}
        className="relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/30 p-[10px] -m-[10px] rounded-full"
        aria-label="Toggle dark mode"
      >
        <span
          className="relative block w-12 h-6 rounded-full transition-colors duration-200"
          style={{
            backgroundColor: isDark
              ? 'var(--color-secondary)'
              : 'var(--color-outline-variant)',
          }}
        >
          <span
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
            style={{ left: isDark ? 'calc(100% - 20px)' : '4px' }}
          />
        </span>
      </button>
    </div>
  )
}

// ─── Time Format Toggle ───────────────────────────────────────────────────────

function TimeFormatToggle({ initialTimeFormat }: { initialTimeFormat: TimeFormat }) {
  const [format, setFormatLocal] = useTimeFormat()

  // Sync from server value on mount
  useEffect(() => {
    setFormatLocal(initialTimeFormat)
  }, [initialTimeFormat]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSetFormat(f: TimeFormat) {
    setFormatLocal(f)
    await saveTimeFormatAction(f)
  }

  return (
    <div className="flex items-center justify-between gap-md">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-on-surface">Time Format</p>
        <p className="text-[12px] text-on-surface-variant mt-xs">
          Choose between 12-hour and 24-hour clock
        </p>
      </div>
      <div
        className="flex rounded-lg overflow-hidden flex-shrink-0"
        style={{ border: '1px solid var(--color-outline-variant)' }}
        role="group"
        aria-label="Time format"
      >
        {(['12h', '24h'] as TimeFormat[]).map((option) => {
          const isActive = format === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSetFormat(option)}
              className="px-md py-sm text-[13px] font-medium transition-colors"
              style={{
                backgroundColor: isActive
                  ? 'var(--color-secondary)'
                  : 'transparent',
                color: isActive
                  ? 'var(--color-on-secondary)'
                  : 'var(--color-on-surface-variant)',
              }}
              aria-pressed={isActive}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Delete Account Section ───────────────────────────────────────────────────

function DeleteAccountSection() {
  const [showDialog, setShowDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = confirmText === 'DELETE'

  async function handleDelete() {
    if (!canDelete) return
    setError(null)
    setIsPending(true)
    try {
      const result = await deleteAccountAction()
      // If we get here without a redirect, there was an error
      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      }
      // On success, the server action redirects to /login
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsPending(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-md">
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-on-surface">
            Delete Account
          </p>
          <p className="text-[12px] text-on-surface-variant mt-xs">
            Permanently delete your account and all data
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowDialog(true)
            setConfirmText('')
            setError(null)
          }}
          className="text-[14px] font-medium px-md py-sm rounded-lg border transition-colors hover:bg-error/5 active:scale-[0.98] flex-shrink-0 min-h-[44px]"
          style={{
            color: 'var(--color-error)',
            borderColor: 'var(--color-error)',
          }}
        >
          Delete Account
        </button>
      </div>

      {/* Confirmation dialog — inline, not a portal */}
      {showDialog && (
        <div className="mt-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-lg space-y-md">
          <div>
            <h3 className="text-[16px] font-semibold text-on-surface">
              Delete your account?
            </h3>
            <p className="text-[14px] text-on-surface-variant mt-xs">
              This will permanently delete your account and all your timers and
              sessions. This cannot be undone.
            </p>
          </div>

          {error && (
            <div className="p-md rounded-lg bg-error-container border border-error">
              <p className="text-[14px] text-on-error-container">{error}</p>
            </div>
          )}

          <div className="space-y-xs">
            <label
              htmlFor="delete-confirm"
              className="text-[12px] leading-[1] tracking-[0.02em] font-medium text-on-surface-variant block px-1"
            >
              Type <span className="font-bold text-on-surface">DELETE</span> to
              confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={isPending}
              className="w-full h-11 px-md rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none disabled:opacity-60"
            />
          </div>

          <div className="flex gap-sm">
            <button
              type="button"
              onClick={() => {
                setShowDialog(false)
                setConfirmText('')
                setError(null)
              }}
              disabled={isPending}
              className="flex-1 h-11 border border-outline-variant text-on-surface text-[14px] font-semibold rounded-lg hover:bg-surface-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || isPending}
              className="flex-1 h-11 text-[14px] font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: canDelete && !isPending
                  ? 'var(--color-error)'
                  : undefined,
                color: canDelete && !isPending
                  ? 'var(--color-on-error)'
                  : 'var(--color-error)',
                border: canDelete && !isPending
                  ? 'none'
                  : '1px solid var(--color-error)',
              }}
            >
              {isPending ? 'Deleting…' : 'Delete Account'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── SettingsClient ───────────────────────────────────────────────────────────

export default function SettingsClient({ email, initialTheme, initialTimeFormat }: {
  email: string
  initialTheme: 'dark' | 'light'
  initialTimeFormat: TimeFormat
}) {
  const localPart = emailLocalPart(email)
  const initial = emailInitial(email)

  return (
    <div className="min-h-screen py-lg">
      {/* Page title */}
      <h1 className="text-[24px] font-semibold tracking-[-0.015em] text-on-surface mb-lg">
        Settings
      </h1>

      {/* Profile header card */}
      <section className="mb-xl">
        <div className="flex items-center gap-lg p-lg bg-surface-container-lowest border border-outline-variant rounded-xl">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-[24px] font-semibold flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-primary-container)',
              color: 'var(--color-on-primary-container)',
            }}
          >
            {initial}
          </div>
          {/* User info */}
          <div className="min-w-0">
            <p className="text-[18px] font-semibold text-on-surface truncate">
              {localPart}
            </p>
            <p className="text-[14px] text-on-surface-variant truncate">
              {email}
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-xl">
        {/* Account Security section */}
        <section>
          <SectionHeading>Account Security</SectionHeading>
          <Card>
            <ChangePasswordForm />
          </Card>
        </section>

        {/* Appearance section */}
        <section>
          <SectionHeading>Appearance</SectionHeading>
          <Card className="space-y-lg">
            <DarkModeToggle initialTheme={initialTheme} />
            <div style={{ borderTop: '1px solid var(--color-outline-variant)' }} className="pt-lg">
              <TimeFormatToggle initialTimeFormat={initialTimeFormat} />
            </div>
          </Card>
        </section>

        {/* Danger Zone section */}
        <section>
          <SectionHeading color="text-error">Danger Zone</SectionHeading>
          <div className="bg-surface-container-lowest border border-error rounded-xl p-lg">
            <DeleteAccountSection />
          </div>
        </section>
      </div>
    </div>
  )
}
