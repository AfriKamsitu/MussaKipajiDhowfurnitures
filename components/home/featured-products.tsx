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
        title="Featured Products"
        subtitle="Handpicked pieces our customers love most"
        actionLabel="View All"
        actionHref="/shop"
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
