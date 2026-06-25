import type { TimeUnit } from '../types'

// Canonical storage is seconds. These are the number of seconds in one of each unit.
// Days/weeks/months use simple calendar-ish conventions common in VSM practice.
const SECONDS_PER_UNIT: Record<TimeUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  months: 2592000, // 30 days
}

/** Convert a canonical seconds value into the given display unit. */
export function fromSeconds(seconds: number, unit: TimeUnit): number {
  return seconds / SECONDS_PER_UNIT[unit]
}

/** Convert a value expressed in the given display unit back to canonical seconds. */
export function toSeconds(value: number, unit: TimeUnit): number {
  return value * SECONDS_PER_UNIT[unit]
}

/** Format seconds for display in the active unit, trimming trailing zeros. */
export function formatTime(seconds: number, unit: TimeUnit, withUnit = true): string {
  const v = fromSeconds(seconds, unit)
  const rounded = Math.round(v * 1000) / 1000
  const str = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2)
  const short = SECONDS_PER_UNIT[unit] === 1 ? 's' : unitShort(unit)
  return withUnit ? `${str} ${short}` : str
}

/** Single-token prefix used to label time-axis columns (D, D+1, M-1, …). */
export function unitLetter(unit: TimeUnit): string {
  switch (unit) {
    case 'seconds':
      return 'S'
    case 'minutes':
      return 'Min'
    case 'hours':
      return 'H'
    case 'days':
      return 'D'
    case 'weeks':
      return 'W'
    case 'months':
      return 'M'
  }
}

/** Column label for a relative time offset, e.g. (D, 0)→"D", (D, -1)→"D-1". */
export function axisLabel(unit: TimeUnit, offset: number): string {
  const letter = unitLetter(unit)
  if (offset === 0) return letter
  return offset > 0 ? `${letter}+${offset}` : `${letter}${offset}`
}

export function unitShort(unit: TimeUnit): string {
  switch (unit) {
    case 'seconds':
      return 's'
    case 'minutes':
      return 'min'
    case 'hours':
      return 'hr'
    case 'days':
      return 'd'
    case 'weeks':
      return 'wk'
    case 'months':
      return 'mo'
  }
}

/**
 * Render a duration in a "humanized" form that auto-scales to a sensible unit,
 * useful for the metrics summary where one fixed unit can read awkwardly.
 */
export function humanizeDuration(seconds: number): string {
  if (seconds <= 0) return '0'
  const units: [TimeUnit, number][] = [
    ['months', SECONDS_PER_UNIT.months],
    ['weeks', SECONDS_PER_UNIT.weeks],
    ['days', SECONDS_PER_UNIT.days],
    ['hours', SECONDS_PER_UNIT.hours],
    ['minutes', SECONDS_PER_UNIT.minutes],
    ['seconds', 1],
  ]
  for (const [unit, factor] of units) {
    if (seconds >= factor) {
      const v = seconds / factor
      const rounded = Math.round(v * 10) / 10
      return `${rounded} ${unitShort(unit)}`
    }
  }
  return `${seconds} s`
}
