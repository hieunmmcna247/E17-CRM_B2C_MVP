/** UUID v4 for primary keys when the DB has no default on `id`. */
export function generateUuidV4(): string {
  if (typeof globalThis !== 'undefined') {
    const c = globalThis.crypto as Crypto | undefined
    if (c && typeof c.randomUUID === 'function') {
      return c.randomUUID()
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const n = (Math.random() * 16) | 0
    const v = ch === 'x' ? n : (n & 0x3) | 0x8
    return v.toString(16)
  })
}
