/** Shared admin formatting helpers (no mock catalogs). */

export function formatTZS(value: number, currency = "TZS") {
  const normalized = ["TZS", "USD", "KES"].includes(currency) ? currency : "TZS"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalized,
    currencyDisplay: "code",
    maximumFractionDigits: normalized === "USD" ? 2 : 0,
  }).format(Number(value || 0))
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
