import { fetchApi } from "@/lib/api"
import {
  normalizeCategory,
  normalizeProduct,
  type Category,
  type Product,
  type SpringPage,
} from "@/lib/data"

/** Shape of GET /api/banners/active (MarketingDtos.BannerResponse). */
export type Banner = {
  id: number
  title: string
  location: string
  image: string
  headline?: string
  description?: string
  ctaLabel?: string
  price?: number | null
  discountPercentage?: number | null
  sortOrder?: number
}

export type ProductQuery = {
  q?: string
  category?: string
  page?: number
  size?: number
}

/** The backend caps page size at 100 (ProductService.validatePagination). */
export const MAX_PAGE_SIZE = 100
/** Upper bound for client-side filtering; larger catalogs need server-side filter/sort endpoints. */
const MAX_CATALOG_PAGES = 5

export function productHref(product: Pick<Product, "slug" | "id">) {
  return `/product/${encodeURIComponent(product.slug || product.id)}`
}

export function isAvailable(product: Product) {
  return product.inStock ?? (product.stock == null || product.stock > 0)
}

/** Whole-number discount, only when the compare price is genuinely higher. */
export function discountPercent(product: Product) {
  if (!product.oldPrice || product.oldPrice <= product.price || product.price <= 0) return null
  const percent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
  return percent > 0 ? percent : null
}

export function hasReviews(product: Product) {
  return product.reviews > 0 && product.rating > 0
}

export function normalizeBanner(raw: Record<string, unknown>): Banner {
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ""),
    location: String(raw.location ?? ""),
    image: String(raw.image ?? ""),
    headline: raw.headline ? String(raw.headline) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    ctaLabel: raw.ctaLabel ? String(raw.ctaLabel) : undefined,
    price: raw.price != null ? Number(raw.price) : null,
    discountPercentage: raw.discountPercentage != null ? Number(raw.discountPercentage) : null,
    sortOrder: raw.sortOrder != null ? Number(raw.sortOrder) : 0,
  }
}

export function productQueryString({ q, category, page = 0, size = 20 }: ProductQuery) {
  const params = new URLSearchParams()
  if (q?.trim()) params.set("q", q.trim())
  if (category) params.set("category", category)
  params.set("page", String(page))
  params.set("size", String(Math.min(MAX_PAGE_SIZE, Math.max(1, size))))
  return params.toString()
}

export async function listProducts(query: ProductQuery = {}): Promise<SpringPage<Product>> {
  const payload = await fetchApi<SpringPage<Record<string, unknown>>>(
    `/api/products?${productQueryString(query)}`,
  )
  const content = Array.isArray(payload?.content) ? payload.content : []
  return {
    content: content.map(normalizeProduct),
    totalElements: Number(payload?.totalElements ?? content.length),
    totalPages: Number(payload?.totalPages ?? 1),
    number: Number(payload?.number ?? 0),
    size: Number(payload?.size ?? content.length),
  }
}

/**
 * Load the published catalog for client-side filtering and sorting. The API
 * only filters by text and category, so price/material/colour facets and all
 * sort orders are applied in the browser.
 */
export async function listCatalog(query: Pick<ProductQuery, "q"> = {}): Promise<Product[]> {
  const first = await listProducts({ ...query, page: 0, size: MAX_PAGE_SIZE })
  const pages = Math.min(first.totalPages, MAX_CATALOG_PAGES)
  if (pages <= 1) return first.content
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      listProducts({ ...query, page: index + 1, size: MAX_PAGE_SIZE }),
    ),
  )
  return [first, ...rest].flatMap((page) => page.content)
}

let categoriesRequest: Promise<Category[]> | null = null

/** Categories are shared by the header, home and shop; one request serves all three. */
export function listCategories(): Promise<Category[]> {
  if (!categoriesRequest) {
    categoriesRequest = fetchApi<Record<string, unknown>[]>("/api/categories")
      .then((payload) => (Array.isArray(payload) ? payload.map(normalizeCategory) : []))
      .catch((error) => {
        categoriesRequest = null
        throw error
      })
  }
  return categoriesRequest
}

export async function listActiveBanners(): Promise<Banner[]> {
  const payload = await fetchApi<Record<string, unknown>[]>("/api/banners/active")
  return (Array.isArray(payload) ? payload : [])
    .map(normalizeBanner)
    .filter((banner) => banner.image)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}
