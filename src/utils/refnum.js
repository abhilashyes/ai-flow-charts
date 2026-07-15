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

/**
 * Reassign every item's `refNum` to a contiguous sequence by array order
 * (e.g. "P" -> P01, P02, P03 …). Keeps ref numbers gap-free after a delete.
 * Returns a new array; element `id`s (used by connector endpoints) are untouched.
 */
export function renumber(items, prefix) {
  return items.map((item, i) => ({
    ...item,
    refNum: `${prefix}${String(i + 1).padStart(2, '0')}`,
  }))
}
