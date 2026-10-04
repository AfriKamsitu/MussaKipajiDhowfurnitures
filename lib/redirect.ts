/**
 * Only same-site paths may be used as a post-login destination. Anything else
 * (absolute URLs, protocol-relative `//host`, backslash tricks) is dropped.
 */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null
  return value
}
