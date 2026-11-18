// Public i18n API. The provider component lives in ./I18nProvider so this
// module only exports hooks, types and helpers (keeps React Fast Refresh happy).
export { useI18n, type I18nContextValue } from './context'
export {
  achievementKey,
  difficultyKeys,
  frequencyKeys,
  interpolate,
  rarityKeys,
  shopItemKey,
  translateRank,
  type PluralKey,
  type Translate,
  type TranslationKey,
  type TranslationParams,
} from './keys'
