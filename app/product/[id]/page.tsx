import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TrustBar } from "@/components/trust-bar"
import { ProductDetail } from "@/components/product/product-detail"
import { fetchApi } from "@/lib/api"
import { normalizeProduct, type Product } from "@/lib/data"

async function loadProduct(idOrSlug: string): Promise<Product | null> {
  // Prefer slug route; fall back to numeric id for admin/deep links.
  const bySlug = await fetchApi<Record<string, unknown>>(`/api/products/slug/${idOrSlug}`).catch(
    () => null,
  )
  if (bySlug) return normalizeProduct(bySlug)

  if (/^\d+$/.test(idOrSlug)) {
    const byId = await fetchApi<Record<string, unknown>>(`/api/products/${idOrSlug}`).catch(() => null)
    if (byId) return normalizeProduct(byId)
  }
  return null
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await loadProduct(id)

  if (!product) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <ChevronRight className="size-4" />
          <Link href="/shop" className="hover:text-accent">
            Shop
          </Link>
          <ChevronRight className="size-4" />
          <Link href={`/shop?category=${product.category}`} className="hover:text-accent capitalize">
            {product.category.replace(/-/g, " ")}
          </Link>
          <ChevronRight className="size-4" />
          <span className="font-medium text-foreground">{product.name}</span>
        </nav>
        <ProductDetail product={product} />
        <TrustBar className="mt-12" />
      </main>
      <SiteFooter />
    </div>
  )
}
