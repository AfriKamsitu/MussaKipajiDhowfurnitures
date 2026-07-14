"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product-card"
import { fetchApi } from "@/lib/api"
import { normalizeProduct, type Product, type SpringPage } from "@/lib/data"

export function OffersProducts() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetchApi<SpringPage<Record<string, unknown>>>("/api/products?size=48")
      .then((payload) => {
        const content = Array.isArray(payload?.content) ? payload.content : []
        const mapped = content.map(normalizeProduct)
        const onSale = mapped.filter((p) => p.oldPrice && p.oldPrice > p.price)
        setProducts(onSale.length ? onSale : mapped.slice(0, 4))
      })
      .catch(() => setProducts([]))
  }, [])

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-foreground">On Sale Now</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {!products.length && (
          <p className="col-span-full text-sm text-muted-foreground">No sale products available right now.</p>
        )}
      </div>
    </section>
  )
}
