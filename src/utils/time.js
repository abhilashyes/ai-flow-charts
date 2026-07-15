import { TIME_UNITS, timeUnit } from './constants'

// Convert a (value, unit) pair to seconds for normalization/totals.
export function toSeconds(value, unit) {
  return (Number(value) || 0) * timeUnit(unit).toSeconds
}

// Short label for a value in its own unit, e.g. `60 min`, `2 hr`, `1 d`.
export function formatTime(value, unit) {
  return `${value} ${timeUnit(unit).short}`
}

// Human total from a seconds amount, picking the largest unit that reads >= 1.
export function formatDuration(seconds) {
  if (!seconds) return '0'
  const units = [...TIME_UNITS].sort((a, b) => b.toSeconds - a.toSeconds)
  const u = units.find((x) => seconds >= x.toSeconds) ?? TIME_UNITS[0]
  const v = seconds / u.toSeconds
  const rounded = Math.round(v * 10) / 10
  return `${rounded} ${u.short}`
}

// Total standard time (in seconds) across a list of processes/connectors.
export function totalStdSeconds(items) {
  return items.reduce((s, it) => s + toSeconds(it.stdTime, it.stdTimeUnit), 0)
}
