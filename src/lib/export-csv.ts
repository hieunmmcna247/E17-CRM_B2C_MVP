/**
 * Converts camelCase / PascalCase keys to snake_case for CSV headers.
 * Keys that are already snake_case stay readable (lowercased consistently).
 */
function keyToSnakeCase(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function rowsToCsvString(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''

  const columnKeys = Object.keys(rows[0])
  const headers = columnKeys.map((k) => keyToSnakeCase(k))

  const lines = [headers.join(',')]
  for (const row of rows) {
    const line = columnKeys.map((k) => escapeCsvCell(row[k])).join(',')
    lines.push(line)
  }
  return lines.join('\r\n')
}

/**
 * Serializes objects to CSV (header row uses snake_case keys) and starts a browser download.
 */
export function exportToCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (typeof window === 'undefined') return

  const csv = rowsToCsvString(rows)
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.click()
  URL.revokeObjectURL(url)
}
