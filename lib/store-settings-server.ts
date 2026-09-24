import "server-only"

type ServerStoreSettings = {
  storeName: string
  metaTitle: string
  metaDescription: string
  searchIndexingEnabled: boolean
  logoUrl: string
}

const fallbackSettings: ServerStoreSettings = {
  storeName: "Paje Dhow Furniture",
  metaTitle: "Paje Dhow Furniture - Handcrafted Living",
  metaDescription:
    "Discover handcrafted furniture for every room, made with care in Zanzibar.",
  searchIndexingEnabled: true,
  logoUrl: "/paje-dhow-furniture-logo.jpeg",
}

function backendUrl() {
  return (
    process.env.BACKEND_URL?.trim()
    || process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
    || ""
  ).replace(/\/$/, "")
}

export async function getServerStoreSettings(): Promise<ServerStoreSettings> {
  const base = backendUrl()
  if (!base) return fallbackSettings
  try {
    const response = await fetch(`${base}/api/config/store`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return fallbackSettings
    const payload = await response.json() as Partial<ServerStoreSettings>
    return { ...fallbackSettings, ...payload }
  } catch {
    return fallbackSettings
  }
}

export async function getPublishedProductSlugs(): Promise<string[]> {
  const base = backendUrl()
  if (!base) return []
  try {
    const response = await fetch(`${base}/api/products?size=100`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return []
    const payload = await response.json() as { content?: Array<{ slug?: string }> }
    return Array.isArray(payload.content)
      ? payload.content.map((product) => product.slug || "").filter(Boolean)
      : []
  } catch {
    return []
  }
}
