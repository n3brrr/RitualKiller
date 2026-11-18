import { describe, expect, it } from 'vitest'
import { es } from '@/i18n/es'
import type { TranslationKey } from '@/i18n'
import { notificationText } from '../notificationText'

const t = (key: TranslationKey) => es[key] ?? key

describe('notificationText', () => {
  it('translates achievement and reminder notifications', () => {
    expect(
      notificationText(
        {
          type: 'achievement',
          title: 'Achievement unlocked',
          message: 'ach-streak-7',
          data: { achievementId: 'ach-streak-7' },
        },
        t,
      ),
    ).toEqual({ title: 'Logro desbloqueado', message: 'Primera semana' })
    expect(
      notificationText(
        { type: 'reminder', title: 'x', message: 'y', data: {} },
        t,
      ).title,
    ).toBe('Rituales pendientes')
  })

  it('keeps the stored text for other types', () => {
    expect(
      notificationText(
        { type: 'info', title: 'Hola', message: 'Mundo', data: {} },
        t,
      ),
    ).toEqual({ title: 'Hola', message: 'Mundo' })
  })
})
