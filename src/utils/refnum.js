/**
 * Generate the next reference number for a prefix (e.g. "P" -> "P03"),
 * padding to two digits, based on the numbers already in use.
 */
export function generateRefNum(prefix, existingItems) {
  const existing = existingItems
    .filter((item) => item.refNum?.startsWith(prefix))
    .map((item) => parseInt(item.refNum.substring(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const maxNum = existing.length > 0 ? Math.max(...existing) : 0
  return `${prefix}${String(maxNum + 1).padStart(2, '0')}`
}

/** Next unique numeric id for a collection of {id} items. */
export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}
