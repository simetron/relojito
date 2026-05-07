'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function LoginPageText({ type }: { type: 'tagline' | 'signupLink' }) {
  const { t } = useTranslation()

  if (type === 'tagline') {
    return (
      <p className="text-[14px] leading-[1.5] text-on-surface-variant">
        {t('auth.tagline') as string}
      </p>
    )
  }

  return (
    <p className="text-[14px] text-on-surface-variant">
      {t('auth.noAccount') as string}{' '}
      <Link
        href="/register"
        className="font-semibold hover:underline decoration-primary underline-offset-4 text-primary"
      >
        {t('auth.signUpButton') as string}
      </Link>
    </p>
  )
}
