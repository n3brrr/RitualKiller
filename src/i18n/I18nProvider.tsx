import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Locale } from '../types'
import { I18nContext, type I18nContextValue } from './context'
import { en } from './en'
import { es } from './es'
import {
  interpolate,
  type PluralKey,
  type TranslationKey,
  type TranslationParams,
} from './keys'

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { es, en }

const STORAGE_KEY = 'rk_locale'

/**
 * Stored choice first, then the browser language. Storage can be missing or
 * throw (private mode, blocked site data), so every access is guarded.
 */
function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'es'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'es') return stored
  } catch {
    // Ignore: fall back to the browser language.
  }
  const preferred = window.navigator?.language?.toLowerCase() ?? ''
  return preferred.startsWith('en') ? 'en' : 'es'
}

function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Not persisted; the choice still applies to this session.
  }
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    storeLocale(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) =>
      interpolate(
        dictionaries[locale][key] ?? dictionaries.es[key] ?? key,
        params,
      ),
    [locale],
  )

  const tn = useCallback(
    (key: PluralKey, count: number, params?: TranslationParams) => {
      const form =
        new Intl.PluralRules(locale).select(count) === 'one' ? 'one' : 'other'
      return t(`${key}.${form}` as TranslationKey, { count, ...params })
    },
    [locale, t],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, tn }),
    [locale, setLocale, t, tn],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
