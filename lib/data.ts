/** Types and helpers aligned with the Spring Boot API (com.pajedhow.backend.dto). */

export type Supplier = {
  id: number | string
  name: string
  location: string
  country: string
  rating: number
  responseTime: string
  verified: boolean
}

export type Product = {
  id: string
  slug: string
  name: string
  category: string
  price: number
  oldPrice?: number
  image: string
  rating: number
  reviews: number
  isNew?: boolean
  colors: string[]
  material: string
  status?: string
  stock?: number
  inStock?: boolean
  sku?: string
  moq?: number
  warrantyMonths?: number
  deliveryDays?: number
  supplier?: Supplier | null
}

export type Category = {
  id?: string
  slug: string
  name: string
  description?: string
  image: string
  status?: string
  /** Mapped from backend `productCount`. */
  count: number
}

export type ProductMeta = {
  supplier: Supplier | null
  stock: number
  inStock: boolean
  moq: number
  warrantyMonths: number
  deliveryDays: number
  sku: string
  specs: { label: string; value: string }[]
}

export type SpringPage<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function num(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function str(value: unknown, fallback = "") {
  return value == null ? fallback : String(value)
}

/** Normalize a ProductResponse from the backend into the storefront Product shape. */
export function normalizeProduct(raw: Record<string, unknown>): Product {
  const supplierRaw = raw.supplier as Record<string, unknown> | null | undefined
  return {
    id: str(raw.id),
    slug: str(raw.slug || raw.id),
    name: str(raw.name),
    category: str(raw.category),
    price: num(raw.price),
    oldPrice: raw.oldPrice != null ? num(raw.oldPrice) : undefined,
    image: str(raw.image, "/placeholder.svg"),
    rating: num(raw.rating),
    reviews: num(raw.reviews),
    isNew: Boolean(raw.isNew),
    colors: Array.isArray(raw.colors) ? raw.colors.map(String) : [],
    material: str(raw.material),
    status: raw.status != null ? str(raw.status) : undefined,
    stock: raw.stock != null ? num(raw.stock) : undefined,
    inStock: raw.inStock != null ? Boolean(raw.inStock) : undefined,
    sku: raw.sku != null ? str(raw.sku) : undefined,
    moq: raw.moq != null ? num(raw.moq) : undefined,
    warrantyMonths: raw.warrantyMonths != null ? num(raw.warrantyMonths) : undefined,
    deliveryDays: raw.deliveryDays != null ? num(raw.deliveryDays) : undefined,
    supplier: supplierRaw
      ? {
          id: supplierRaw.id as number | string,
          name: str(supplierRaw.name),
          location: str(supplierRaw.location),
          country: str(supplierRaw.country),
          rating: num(supplierRaw.rating),
          responseTime: str(supplierRaw.responseTime),
          verified: Boolean(supplierRaw.verified),
        }
      : null,
  }
}

export function normalizeCategory(raw: Record<string, unknown>): Category {
  return {
    id: raw.id != null ? str(raw.id) : undefined,
    slug: str(raw.slug),
    name: str(raw.name),
    description: raw.description != null ? str(raw.description) : undefined,
    image: str(raw.image, "/placeholder.svg"),
    status: raw.status != null ? str(raw.status) : undefined,
    count: num(raw.productCount ?? raw.count),
  }
}

/** Build product meta from fields already present on ProductResponse. */
export function productMetaFromProduct(product: Product): ProductMeta {
  const stock = product.stock ?? 0
  return {
    supplier: product.supplier ?? null,
    stock,
    inStock: product.inStock ?? stock > 0,
    moq: product.moq ?? 1,
    warrantyMonths: product.warrantyMonths ?? 12,
    deliveryDays: product.deliveryDays ?? 5,
    sku: product.sku ?? `SKU-${product.id}`,
    specs: [
      { label: "Material", value: product.material || "—" },
      { label: "SKU", value: product.sku || "—" },
      { label: "MOQ", value: String(product.moq ?? 1) },
      {
        label: "Warranty",
        value: `${product.warrantyMonths ?? 12} months`,
      },
      {
        label: "Delivery",
        value: `${product.deliveryDays ?? 5} days`,
      },
      {
        label: "Origin",
        value: product.supplier
          ? `${product.supplier.location}, ${product.supplier.country}`
          : "Tanzania",
      },
    ],
  }
}

/** Title-case enum-style statuses: PUBLISHED → Published. */
export function prettifyStatus(status: string) {
  if (!status) return status
  if (status.includes(" ") || status.includes("_")) {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
  if (status === status.toUpperCase()) {
    return status.charAt(0) + status.slice(1).toLowerCase()
  }
  return status
}

export function formatPrice(amount: number) {
  return `TZS ${amount.toLocaleString("en-US")}`
}
