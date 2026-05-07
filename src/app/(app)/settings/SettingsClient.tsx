'use client'

import { useState, useEffect } from 'react'
import { changePasswordAction, deleteAccountAction, saveThemeAction, saveTimeFormatAction, saveLanguageAction } from './actions'
import { useTimeFormat } from '@/lib/utils/useTimeFormat'
import type { TimeFormat } from '@/lib/utils/useTimeFormat'
import { useLanguage, useTranslation } from '@/lib/i18n/useTranslation'
import type { Language } from '@/lib/i18n/translations'

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

function ChangePasswordForm({ t }: { t: (key: Parameters<ReturnType<typeof useTranslation>['t']>[0]) => string }) {
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
      setError(t('settings.errorPasswordTooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('settings.errorPasswordsNoMatch'))
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
      <p className="text-[14px] font-medium text-on-surface">{t('settings.changePassword')}</p>

      {error && (
        <div className="p-md rounded-lg bg-error-container border border-error">
          <p className="text-[14px] text-on-error-container">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-md rounded-lg bg-surface-container border border-outline-variant">
          <p className="text-[14px] text-on-surface">
            {t('settings.passwordUpdated')}
          </p>
        </div>
      )}

      <div className="space-y-xs">
        <label
          htmlFor="new-password"
          className="text-[12px] leading-[1] tracking-[0.02em] font-medium text-on-surface-variant block px-1"
        >
          {t('settings.newPassword')}
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
          {t('settings.confirmPassword')}
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
        {isPending ? t('settings.updating') : t('settings.updatePassword')}
      </button>
    </form>
  )
}

// ─── Dark Mode Toggle ─────────────────────────────────────────────────────────

function DarkModeToggle({ initialTheme, t }: { initialTheme: 'dark' | 'light'; t: (key: Parameters<ReturnType<typeof useTranslation>['t']>[0]) => string }) {
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
        <p className="text-[14px] font-medium text-on-surface">{t('settings.darkMode')}</p>
        <p className="text-[12px] text-on-surface-variant mt-xs">
          {t('settings.darkModeDesc')}
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

function TimeFormatToggle({ initialTimeFormat, t }: { initialTimeFormat: TimeFormat; t: (key: Parameters<ReturnType<typeof useTranslation>['t']>[0]) => string }) {
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
        <p className="text-[14px] font-medium text-on-surface">{t('settings.timeFormat')}</p>
        <p className="text-[12px] text-on-surface-variant mt-xs">
          {t('settings.timeFormatDesc')}
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

// ─── Language Selector ────────────────────────────────────────────────────────

function LanguageSelector({
  initialLanguage,
  t,
}: {
  initialLanguage: Language
  t: (key: Parameters<ReturnType<typeof useTranslation>['t']>[0]) => string
}) {
  const [, setLang] = useLanguage()

  // Sync from server value on mount
  useEffect(() => {
    setLang(initialLanguage)
  }, [initialLanguage]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLang = e.target.value as Language
    setLang(newLang)
    await saveLanguageAction(newLang)
    window.location.reload()
  }

  // Read current value from localStorage via the hook
  const [currentLang] = useLanguage()

  return (
    <div className="flex items-center justify-between gap-md">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-on-surface">{t('settings.language')}</p>
        <p className="text-[12px] text-on-surface-variant mt-xs">
          {t('settings.languageDesc')}
        </p>
      </div>
      <select
        value={currentLang}
        onChange={handleChange}
        className="flex-shrink-0 h-9 px-md rounded-lg text-[13px] font-medium outline-none transition-all cursor-pointer"
        style={{
          backgroundColor: 'var(--color-surface-container)',
          border: '1px solid var(--color-outline-variant)',
          color: 'var(--color-on-surface)',
        }}
        aria-label={t('settings.language')}
      >
        <option value="en">{t('settings.languageEnglish')}</option>
        <option value="es">{t('settings.languageSpanish')}</option>
      </select>
    </div>
  )
}



type TFn = (key: Parameters<ReturnType<typeof useTranslation>['t']>[0]) => string

function getManualSections(t: TFn) {
  return [
    {
      id: 'timers',
      icon: 'fa-clock',
      title: t('manual.timers.title'),
      content: [
        {
          heading: t('manual.timers.creating.heading'),
          body: t('manual.timers.creating.body'),
          example: (
            <div className="rounded-xl p-3 flex items-center gap-3 mt-2" style={{ border: '2px dashed var(--color-outline-variant)' }}>
              <span className="text-[13px] font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>New Timer +</span>
            </div>
          ),
        },
        {
          heading: t('manual.timers.startStop.heading'),
          body: t('manual.timers.startStop.body'),
          example: (
            <div className="rounded-xl flex items-center gap-3 px-3 py-3 mt-2" style={{ backgroundColor: '#5850EC' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <i className="fa-solid fa-briefcase text-white text-[16px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white">Work</p>
                <p className="text-[18px] font-bold text-white">00:04:32</p>
              </div>
              <div className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.8)' }}>STOP</div>
            </div>
          ),
        },
        {
          heading: t('manual.timers.editing.heading'),
          body: t('manual.timers.editing.body'),
        },
        {
          heading: t('manual.timers.archiving.heading'),
          body: t('manual.timers.archiving.body'),
        },
        {
          heading: t('manual.timers.deleting.heading'),
          body: t('manual.timers.deleting.body'),
        },
        {
          heading: t('manual.timers.reordering.heading'),
          body: t('manual.timers.reordering.body'),
        },
      ],
    },
    {
      id: 'history',
      icon: 'fa-clock-rotate-left',
      title: t('manual.history.title'),
      content: [
        {
          heading: t('manual.history.viewing.heading'),
          body: t('manual.history.viewing.body'),
          example: (
            <div className="space-y-1.5 mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-outline)' }}>Today · 2 sessions</p>
              {[
                { name: 'Work', icon: 'briefcase', color: '#5850EC', time: '09:00 – 11:30', dur: '2h 30m' },
                { name: 'Sport', icon: 'person-running', color: '#10B981', time: '12:00 – 12:45', dur: '45m' },
              ].map(s => (
                <div key={s.name} className="rounded-lg p-2.5 flex items-center gap-2" style={{ backgroundColor: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.color }}>
                    <i className={`fa-solid fa-${s.icon} text-[11px] text-white`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>{s.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-outline)' }}>{s.time}</p>
                  </div>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)' }}>{s.dur}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          heading: t('manual.history.editing.heading'),
          body: t('manual.history.editing.body'),
        },
        {
          heading: t('manual.history.adding.heading'),
          body: t('manual.history.adding.body'),
        },
        {
          heading: t('manual.history.deleting.heading'),
          body: t('manual.history.deleting.body'),
        },
      ],
    },
    {
      id: 'stats',
      icon: 'fa-chart-simple',
      title: t('manual.stats.title'),
      content: [
        {
          heading: t('manual.stats.reading.heading'),
          body: t('manual.stats.reading.body'),
          example: (
            <div className="flex justify-center mt-2">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#e7e8e9" strokeWidth="14" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#5850EC" strokeWidth="14" strokeDasharray="143 96" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="14" strokeDasharray="57 182" strokeDashoffset="-143" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="14" strokeDasharray="39 200" strokeDashoffset="-200" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[12px] font-bold" style={{ color: 'var(--color-on-surface)' }}>9h 59m</span>
                  <span className="text-[9px]" style={{ color: 'var(--color-outline)' }}>7 days</span>
                </div>
              </div>
            </div>
          ),
        },
        {
          heading: t('manual.stats.range.heading'),
          body: t('manual.stats.range.body'),
        },
        {
          heading: t('manual.stats.breakdown.heading'),
          body: t('manual.stats.breakdown.body'),
        },
      ],
    },
    {
      id: 'settings-help',
      icon: 'fa-gear',
      title: t('manual.settings.title'),
      content: [
        {
          heading: t('manual.settings.password.heading'),
          body: t('manual.settings.password.body'),
        },
        {
          heading: t('manual.settings.darkMode.heading'),
          body: t('manual.settings.darkMode.body'),
        },
        {
          heading: t('manual.settings.timeFormat.heading'),
          body: t('manual.settings.timeFormat.body'),
        },
        {
          heading: t('manual.settings.deleteAccount.heading'),
          body: t('manual.settings.deleteAccount.body'),
        },
      ],
    },
  ]
}

function ManualSection({ section }: { section: ReturnType<typeof getManualSections>[number] }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-outline-variant)' }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-lg py-md transition-colors"
        style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
      >
        <div className="flex items-center gap-md">
          <i className={`fa-solid ${section.icon} text-[15px]`} style={{ color: 'var(--color-secondary)' }} aria-hidden="true" />
          <span className="text-[15px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>{section.title}</span>
        </div>
        <i
          className={`fa-solid fa-chevron-down text-[12px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-outline)' }}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className="px-lg pb-lg space-y-lg"
          style={{ borderTop: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-lowest)' }}
        >
          {section.content.map((item) => (
            <div key={item.heading} className="pt-lg">
              <h4 className="text-[14px] font-semibold mb-xs" style={{ color: 'var(--color-on-surface)' }}>
                {item.heading}
              </h4>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
                {item.body}
              </p>
              {item.example && item.example}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UserManual({ t }: { t: TFn }) {
  return (
    <div className="space-y-sm">
      {getManualSections(t).map((section) => (
        <ManualSection key={section.id} section={section} />
      ))}
    </div>
  )
}

// ─── Delete Account Section ───────────────────────────────────────────────────

function DeleteAccountSection({ t }: { t: (key: Parameters<ReturnType<typeof useTranslation>['t']>[0]) => string }) {
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
            {t('settings.deleteAccount')}
          </p>
          <p className="text-[12px] text-on-surface-variant mt-xs">
            {t('settings.deleteAccountDesc')}
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
          {t('settings.deleteAccount')}
        </button>
      </div>

      {/* Confirmation dialog — inline, not a portal */}
      {showDialog && (
        <div className="mt-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-lg space-y-md">
          <div>
            <h3 className="text-[16px] font-semibold text-on-surface">
              {t('settings.deleteAccountTitle')}
            </h3>
            <p className="text-[14px] text-on-surface-variant mt-xs">
              {t('settings.deleteAccountBody')}
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
              {t('settings.deleteAccountConfirmLabel')}
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
              {t('settings.cancel')}
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
              {isPending ? t('settings.deleting') : t('settings.deleteAccount')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── SettingsClient ───────────────────────────────────────────────────────────

export default function SettingsClient({ email, initialTheme, initialTimeFormat, initialLanguage }: {
  email: string
  initialTheme: 'dark' | 'light'
  initialTimeFormat: TimeFormat
  initialLanguage: Language
}) {
  const { t } = useTranslation()
  const localPart = emailLocalPart(email)
  const initial = emailInitial(email)

  return (
    <div className="min-h-screen py-lg">
      {/* Page title */}
      <h1 className="text-[24px] font-semibold tracking-[-0.015em] text-on-surface mb-lg">
        {t('settings.title')}
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
          <SectionHeading>{t('settings.accountSecurity')}</SectionHeading>
          <Card>
            <ChangePasswordForm t={t} />
          </Card>
        </section>

        {/* Appearance section */}
        <section>
          <SectionHeading>{t('settings.appearance')}</SectionHeading>
          <Card className="space-y-lg">
            <DarkModeToggle initialTheme={initialTheme} t={t} />
            <div style={{ borderTop: '1px solid var(--color-outline-variant)' }} className="pt-lg">
              <TimeFormatToggle initialTimeFormat={initialTimeFormat} t={t} />
            </div>
            <div style={{ borderTop: '1px solid var(--color-outline-variant)' }} className="pt-lg">
              <LanguageSelector initialLanguage={initialLanguage} t={t} />
            </div>
          </Card>
        </section>

        {/* User Manual section */}
        <section>
          <SectionHeading>{t('settings.userManual')}</SectionHeading>
          <UserManual t={t} />
        </section>

        {/* Danger Zone section */}
        <section>
          <SectionHeading color="text-error">{t('settings.dangerZone')}</SectionHeading>
          <div className="bg-surface-container-lowest border border-error rounded-xl p-lg">
            <DeleteAccountSection t={t} />
          </div>
        </section>
      </div>
    </div>
  )
}
