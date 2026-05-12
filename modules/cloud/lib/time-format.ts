/**
 * Time- and byte-formatting helpers shared by the Database tab UI.
 *
 * Extracted from `dump-row.tsx` so the upcoming `BackupSchedulePanel` can
 * reuse `timeUntil` for the "next run in Xh" line without duplicating the
 * formatting rules.
 */

/** Compact relative-past formatter ("3m ago", "2h ago", "5d ago"). */
export function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const d = Date.now() - new Date(iso).getTime()
  const s = Math.max(1, Math.round(d / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 48) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

/** Compact relative-future formatter; returns `'expired'` for past dates. */
export function timeUntil(iso: string): string {
  const d = new Date(iso).getTime() - Date.now()
  if (d < 0) return 'expired'
  const m = Math.round(d / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const remM = m % 60
  if (h < 48) return remM > 0 ? `${h}h ${remM}m` : `${h}h`
  return `${Math.round(h / 24)}d`
}

/** Byte-count formatter ("1.2 MB", "340 KB"). Empty string for null/0. */
export function fmtBytes(n: number | null): string {
  if (n === null || n === 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}
