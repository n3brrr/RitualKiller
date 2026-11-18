import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Locale, Ritual, RitualLog } from '@/types'
import { useI18n } from '@/i18n'
import { formatDateKey, toDateKey } from '@/utils/dates'

interface RitualCalendarProps {
  rituals: Ritual[]
  logs: RitualLog[]
}

const WEEKDAYS: Record<Locale, string[]> = {
  es: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}

export function RitualCalendar({ rituals, logs }: RitualCalendarProps) {
  const { t, locale } = useI18n()
  const [cursor, setCursor] = useState(() => new Date())
  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const logsByDate = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const log of logs) {
      const date = log.date.slice(0, 10)
      const completed = map.get(date) ?? new Set<string>()
      completed.add(log.ritualId)
      map.set(date, completed)
    }
    return map
  }, [logs])

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  const todayKey = toDateKey()

  const monthLabel = cursor.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })

  // Weeks of the month as rows of 7 cells (null = day of another month).
  const weeks: Array<Array<number | null>> = []
  const days: Array<number | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  while (days.length % 7 !== 0) days.push(null)
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7))
  }
  const weekdayNames = Array.from({ length: 7 }, (_, index) =>
    new Date(2024, 0, 1 + index).toLocaleDateString(locale, {
      weekday: 'long',
    }),
  )

  const shiftMonth = (delta: number) => {
    setCursor(new Date(year, month + delta, 1))
  }

  return (
    <section aria-label={t('calendar.label')}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-300">
          {t('calendar.title')}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label={t('calendar.previous')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span
            aria-live="polite"
            className="min-w-32 text-center text-xs uppercase tracking-wider text-zinc-400"
          >
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label={t('calendar.next')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* A real table: screen readers announce the weekday column and the
          completion summary of each day. */}
      <table className="w-full table-fixed border-separate border-spacing-1 text-center">
        <caption className="sr-only">{monthLabel}</caption>
        <thead>
          <tr>
            {WEEKDAYS[locale].map((day, index) => (
              <th
                key={index}
                scope="col"
                abbr={weekdayNames[index]}
                className="pb-1 text-xs font-bold uppercase text-zinc-400"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                if (day === null)
                  return <td key={`blank-${dayIndex}`} aria-hidden="true" />
                const dateKey = toDateKey(new Date(year, month, day))
                const completed = logsByDate.get(dateKey)?.size ?? 0
                // Only rituals that already existed that day could be completed.
                const possible = rituals.filter(
                  (ritual) => toDateKey(new Date(ritual.created_at)) <= dateKey,
                ).length
                const ratio =
                  possible > 0 ? Math.min(1, completed / possible) : 0
                const isToday = dateKey === todayKey

                return (
                  <td
                    key={dateKey}
                    aria-current={isToday ? 'date' : undefined}
                    className={`relative aspect-square rounded-md border p-0 align-middle text-xs ${
                      isToday ? 'border-ritual-accent/60' : 'border-zinc-900'
                    } ${completed > 0 ? 'bg-ritual-accent/10 text-zinc-100' : 'text-zinc-400'}`}
                  >
                    <span aria-hidden="true">{day}</span>
                    <span className="sr-only">
                      {t('calendar.dayLabel', {
                        date: formatDateKey(dateKey, locale),
                        done: completed,
                        total: possible,
                      })}
                    </span>
                    {completed > 0 && (
                      <span
                        className="absolute bottom-1 left-1/2 h-0.5 w-3/4 -translate-x-1/2 overflow-hidden rounded-full bg-zinc-800"
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full bg-ritual-accent"
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default RitualCalendar
