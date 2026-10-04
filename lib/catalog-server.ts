import "server-only"

import { normalizeCategory, normalizeProduct, type Category, type Product } from "@/lib/data"
import { normalizeBanner, type Banner } from "@/lib/catalog"

/**
 * Server Components read the Spring Boot API directly instead of looping back
 * through this app's own /api gateway. Every reader returns null when the
 * backend is unreachable so pages can fall back to fetching in the browser.
 */
function backendUrl() {
  return (
    process.env.BACKEND_URL?.trim()
    || process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
    || ""
  ).replace(/\/$/, "")
}

async function readBackend<T>(path: string, revalidate: number): Promise<T | null> {
  const base = backendUrl()
  if (!base) return null
  try {
    const response = await fetch(`${base}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(6000),
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

export async function getCatalogProducts(): Promise<Product[] | null> {
  const payload = await readBackend<{ content?: Record<string, unknown>[] }>(
    "/api/products?size=100",
    60,
  )
  if (!payload) return null
  return Array.isArray(payload.content) ? payload.content.map(normalizeProduct) : []
}

export async function getCategories(): Promise<Category[] | null> {
  const payload = await readBackend<Record<string, unknown>[]>("/api/categories", 300)
  if (!payload) return null
  return Array.isArray(payload) ? payload.map(normalizeCategory) : []
}

export async function getActiveBanners(): Promise<Banner[] | null> {
  const payload = await readBackend<Record<string, unknown>[]>("/api/banners/active", 120)
  if (!payload) return null
  return (Array.isArray(payload) ? payload : [])
    .map(normalizeBanner)
    .filter((banner) => banner.image)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

/** Other published products in the same category as `product`, newest first. */
export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[] | null> {
  const payload = await readBackend<{ content?: Record<string, unknown>[] }>(
    `/api/products?category=${encodeURIComponent(product.category)}&size=${limit + 1}`,
    60,
  )
  if (!payload) return null
  return (Array.isArray(payload.content) ? payload.content.map(normalizeProduct) : [])
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, limit)
}

/** Resolve a product by slug, falling back to its numeric id for older links. */
export async function getProduct(idOrSlug: string): Promise<Product | null> {
  const bySlug = await readBackend<Record<string, unknown>>(
    `/api/products/slug/${encodeURIComponent(idOrSlug)}`,
    30,
  )
  if (bySlug) return normalizeProduct(bySlug)
  if (/^\d+$/.test(idOrSlug)) {
    const byId = await readBackend<Record<string, unknown>>(`/api/products/${idOrSlug}`, 30)
    if (byId) return normalizeProduct(byId)
  }
  return null
}
