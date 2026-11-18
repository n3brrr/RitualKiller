import { describe, expect, it } from 'vitest'
import { AppError, errorKey } from '../errors'

describe('errorKey', () => {
  it('keeps our own translated errors', () => {
    expect(errorKey(new AppError('settings.avatarInvalid'))).toBe(
      'settings.avatarInvalid',
    )
  })

  it('maps database exceptions raised on purpose', () => {
    expect(
      errorKey({ message: 'binding_contract_required', code: 'P0001' }),
    ).toBe('errors.bindingContract')
    expect(errorKey({ message: 'rate_limited' })).toBe('errors.rateLimited')
  })

  it('maps Postgres and Auth codes', () => {
    expect(errorKey({ code: '23505', message: 'duplicate key value' })).toBe(
      'errors.duplicate',
    )
    expect(errorKey({ code: '42501', message: 'permission denied' })).toBe(
      'errors.forbidden',
    )
    expect(errorKey({ code: 'invalid_credentials' })).toBe(
      'errors.invalidCredentials',
    )
    expect(errorKey({ status: 429 })).toBe('errors.rateLimited')
  })

  it('falls back to a generic message for anything else', () => {
    expect(errorKey(new Error('something technical'))).toBe('common.error')
    expect(errorKey(undefined)).toBe('common.error')
  })
})
