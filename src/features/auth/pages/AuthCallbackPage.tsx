import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useI18n, type TranslationKey } from '@/i18n'
import Loading from '@/components/animations/Loading'

/** Reads `error`/`error_code` that Supabase appends to failed auth links. */
function linkError(): TranslationKey | null {
  const params = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const code = params.get('error_code') ?? hash.get('error_code')
  const error = params.get('error') ?? hash.get('error')
  if (!code && !error) return null
  return code === 'otp_expired' ? 'errors.linkExpired' : 'auth.callbackError'
}

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  useEffect(() => {
    const failure = linkError()
    if (failure) {
      navigate('/login', { replace: true, state: { authError: failure } })
      return undefined
    }

    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      navigate(data.session ? '/app/dashboard' : '/login', { replace: true })
    })
    return () => {
      active = false
    }
  }, [navigate])

  return (
    <main className="flex min-h-screen items-center justify-center bg-ritual-black">
      <Loading label={t('auth.verifying')} />
    </main>
  )
}
