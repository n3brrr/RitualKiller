import { createContext, useContext } from 'react'
import type { Locale } from '../types'
import type { PluralKey, Translate, TranslationParams } from './keys'

export interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Translates a key, replacing `{placeholders}` with params. */
  t: Translate
  /** Plural-aware translation: picks `<key>.one` or `<key>.other` and fills {count}. */
  tn: (key: PluralKey, count: number, params?: TranslationParams) => string
}

export const I18nContext = createContext<I18nContextValue | undefined>(
  undefined,
)

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}
