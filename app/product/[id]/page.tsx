import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { EditorialSiteHeader as SiteHeader } from "@/components/editorial-site-header"
import { EditorialSiteFooter as SiteFooter } from "@/components/editorial-site-footer"
import { ProductDetail } from "@/components/product/product-details-view"
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
    <div className="buyer-editorial-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-[1320px] flex-1 px-5 pb-16 pt-28 sm:px-8 sm:pt-32 lg:px-10 lg:pb-24">
        <nav
          aria-label="Breadcrumb"
          className="scrollbar-none mb-7 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs font-medium text-muted-foreground sm:mb-9 sm:text-sm"
        >
          <Link href="/" className="inline-flex min-h-6 items-center transition-colors hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-4" />
          <Link href="/shop" className="inline-flex min-h-6 items-center transition-colors hover:text-primary">
            Shop
          </Link>
          <ChevronRight className="size-4" />
          <Link
            href={`/shop?category=${product.category}`}
            className="inline-flex min-h-6 items-center capitalize transition-colors hover:text-primary"
          >
            {product.category.replace(/-/g, " ")}
          </Link>
          <ChevronRight className="size-4" />
          <span className="max-w-52 truncate font-bold text-foreground sm:max-w-80">
            {product.name}
          </span>
        </nav>
        <ProductDetail product={product} />
      </main>
      <SiteFooter />
    </div>
  )
}
