import type { TranslationKey } from '@/i18n'

const DIFFICULTIES = ['novice', 'adept', 'master'] as const
const FREQUENCIES = ['daily', 'weekly'] as const

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** NIST SP 800-63B minimum; Supabase Auth must use the same value. */
export const PASSWORD_MIN_LENGTH = 8

export function validatePassword(password: string): {
  valid: boolean
  message?: string
  messageKey?: TranslationKey
} {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: 'La contraseña debe tener al menos 8 caracteres',
      messageKey: 'validation.passwordMin',
    }
  }
  return { valid: true }
}

export function validateUsername(username: string): {
  valid: boolean
  message?: string
  messageKey?: TranslationKey
} {
  if (username.trim().length < 2 || username.trim().length > 30) {
    return {
      valid: false,
      message: 'El usuario debe tener entre 2 y 30 caracteres',
      messageKey: 'validation.usernameLength',
    }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return {
      valid: false,
      message: 'Solo letras, números y guiones bajos',
      messageKey: 'validation.usernameChars',
    }
  }
  return { valid: true }
}

export function validateRitual(ritual: {
  title: string
  description: string
  difficulty: string
}): { valid: boolean; message?: string; messageKey?: TranslationKey } {
  if (!ritual.title || ritual.title.trim().length === 0) {
    return {
      valid: false,
      message: 'El título del ritual es requerido',
      messageKey: 'validation.ritualTitleRequired',
    }
  }
  if (ritual.title.length > 100) {
    return {
      valid: false,
      message: 'El título no puede exceder 100 caracteres',
      messageKey: 'validation.ritualTitleMax',
    }
  }
  if (ritual.description.length > 500) {
    return {
      valid: false,
      message: 'La descripción no puede exceder 500 caracteres',
      messageKey: 'validation.ritualDescriptionMax',
    }
  }
  if (
    !DIFFICULTIES.includes(ritual.difficulty as (typeof DIFFICULTIES)[number])
  ) {
    return {
      valid: false,
      message: 'Dificultad inválida',
      messageKey: 'validation.difficulty',
    }
  }
  return { valid: true }
}

export function validateContent(
  content: string,
  max = 500,
): {
  valid: boolean
  message?: string
  messageKey?: TranslationKey
} {
  const clean = content.trim()
  if (!clean) {
    return {
      valid: false,
      message: 'El contenido no puede estar vacío',
      messageKey: 'validation.contentEmpty',
    }
  }
  if (clean.length > max) {
    return {
      valid: false,
      message: `El contenido no puede exceder ${max} caracteres`,
      messageKey: 'validation.contentMax',
    }
  }
  return { valid: true }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export const BACKUP_LIMITS = {
  bytes: 2 * 1024 * 1024,
  rituals: 200,
  logs: 20_000,
} as const

/**
 * Validates the backup shape before sending it to import_backup. Errors are
 * stable codes (e.g. "ritual.3.title"), not user-facing text; the UI shows a
 * translated summary.
 */
export function validateImportData(data: unknown): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  if (!isRecord(data)) return { valid: false, errors: ['root.object'] }
  if (!Array.isArray(data.rituals)) errors.push('rituals.array')
  if (!Array.isArray(data.logs)) errors.push('logs.array')
  if (
    Array.isArray(data.rituals) &&
    data.rituals.length > BACKUP_LIMITS.rituals
  ) {
    errors.push('rituals.limit')
  }
  if (Array.isArray(data.logs) && data.logs.length > BACKUP_LIMITS.logs) {
    errors.push('logs.limit')
  }
  if (errors.length > 0) return { valid: false, errors }

  ;(data.rituals as unknown[]).forEach((ritual, index) => {
    const at = `ritual.${index + 1}`
    if (!isRecord(ritual)) return errors.push(`${at}.object`)
    if (typeof ritual.id !== 'string' || !ritual.id) errors.push(`${at}.id`)
    if (
      typeof ritual.title !== 'string' ||
      !ritual.title.trim() ||
      ritual.title.length > 100
    ) {
      errors.push(`${at}.title`)
    }
    if (
      ritual.description !== undefined &&
      (typeof ritual.description !== 'string' ||
        ritual.description.length > 500)
    ) {
      errors.push(`${at}.description`)
    }
    if (
      !DIFFICULTIES.includes(ritual.difficulty as (typeof DIFFICULTIES)[number])
    ) {
      errors.push(`${at}.difficulty`)
    }
    if (
      !FREQUENCIES.includes(ritual.frequency as (typeof FREQUENCIES)[number])
    ) {
      errors.push(`${at}.frequency`)
    }
    return undefined
  })

  ;(data.logs as unknown[]).forEach((log, index) => {
    if (
      !isRecord(log) ||
      typeof log.ritualId !== 'string' ||
      typeof log.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(log.date)
    ) {
      errors.push(`log.${index + 1}`)
    }
  })

  return { valid: errors.length === 0, errors }
}
