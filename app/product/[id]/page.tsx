import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Breadcrumb, PageShell } from "@/components/page-shell"
import { ProductDetail } from "@/components/product/product-details-view"
import { getCategories, getProduct, getRelatedProducts } from "@/lib/catalog-server"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: "Product not found" }
  const description = product.shortDescription || product.description?.slice(0, 160)
  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.image ? [{ url: product.image }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const [product, categories] = await Promise.all([getProduct(id), getCategories()])

  if (!product) notFound()

  const related = await getRelatedProducts(product)

  const categoryName =
    categories?.find((category) => category.slug === product.category)?.name
    ?? product.category.replace(/-/g, " ")

  return (
    <PageShell>
      <Breadcrumb
        className="mb-4 capitalize"
        items={[
          { label: "Home", href: "/" },
          { label: "All Furniture", href: "/shop" },
          { label: categoryName, href: `/shop?category=${encodeURIComponent(product.category)}` },
          { label: product.name },
        ]}
      />
      <ProductDetail key={product.id} product={product} initialRelated={related} />
    </PageShell>
  )
}
