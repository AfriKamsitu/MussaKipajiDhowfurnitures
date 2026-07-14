/** Shared admin formatting helpers (no mock catalogs). */

export function formatTZS(value: number) {
  return "TZS " + Number(value || 0).toLocaleString("en-US")
}

export function prettifyStatus(status: string) {
  if (!status) return status
  const normalized = status.replace(/_/g, " ")
  if (normalized === normalized.toUpperCase()) {
    return normalized
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return normalized
}
