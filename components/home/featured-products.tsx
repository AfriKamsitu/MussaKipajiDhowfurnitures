"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product-card"
import { SectionHeading } from "@/components/section-heading"
import { fetchApi } from "@/lib/api"
import { normalizeProduct, type Product } from "@/lib/data"

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetchApi<{ products: Record<string, unknown>[] }>("/api/featured")
      .then((payload) => {
        const list = Array.isArray(payload?.products) ? payload.products : []
        setProducts(list.map(normalizeProduct))
      })
      .catch(() => setProducts([]))
  }, [])

  return (
    <section>
      <SectionHeading
        title="Top picks for you"
        subtitle="Fast access to popular furniture"
        actionLabel="View more"
        actionHref="/shop"
      />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
