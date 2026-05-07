'use client'

import { useEffect, useState } from 'react'
import { translations, type Language, type TranslationKey } from './translations'

const STORAGE_KEY = 'language'
const DEFAULT_LANG: Language = 'en'

// ─── useLanguage ──────────────────────────────────────────────────────────────

/**
 * Reads/writes the user's preferred language from localStorage.
 * Returns [currentLanguage, setLanguage].
 */
export function useLanguage(): [Language, (lang: Language) => void] {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANG)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'es') {
      setLangState(stored)
    }
  }, [])

  function setLang(l: Language) {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  return [lang, setLang]
}

// ─── useTranslation ───────────────────────────────────────────────────────────

/**
 * Returns a `t(key)` function that resolves a translation string for the
 * current language. Falls back to English if the key is missing in the
 * selected language.
 *
 * For keys whose value is a function (e.g. 'timer.nameDuplicate'),
 * call the returned value as a function:
 *   const fn = t('timer.nameDuplicate') as (name: string) => string
 *   fn('Work')
 */
export function useTranslation() {
  const [lang] = useLanguage()

  function t(key: TranslationKey): string {
    const dict = translations[lang] as Record<string, unknown>
    const fallback = translations.en as Record<string, unknown>
    const value = dict[key] ?? fallback[key]
    if (typeof value === 'function') return value as unknown as string
    return (value as string) ?? key
  }

  const locale = lang === 'es' ? 'es-ES' : 'en-US'

  return { t, lang, locale }
}

// ─── getLanguage (non-hook, for server-safe reads) ────────────────────────────

/**
 * Synchronously reads the language from localStorage.
 * Safe to call only in browser context (not during SSR).
 */
export function getLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANG
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'en' || stored === 'es' ? stored : DEFAULT_LANG
}
