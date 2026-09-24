"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, BadgePercent } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { fetchApi } from "@/lib/api"
import { normalizeProduct, type Product, type SpringPage } from "@/lib/data"

export function OffersProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApi<SpringPage<Record<string, unknown>>>("/api/products?size=48")
      .then((payload) => {
        const content = Array.isArray(payload?.content) ? payload.content : []
        const mapped = content.map(normalizeProduct)
        setProducts(mapped.filter((product) => product.oldPrice && product.oldPrice > product.price))
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mt-10 border-t border-border pt-8 sm:mt-12 sm:pt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <BadgePercent className="size-4" />
            Live discounts
          </p>
          <h2 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">On sale now</h2>
        </div>
        <Link
          href="/shop"
          className="hidden items-center gap-1.5 text-sm font-bold text-primary hover:underline sm:inline-flex"
        >
          Shop all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-square animate-pulse bg-secondary" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-4/5 animate-pulse rounded bg-secondary" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="stagger-item"
              style={{ "--stagger-index": index } as React.CSSProperties}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-border bg-card px-5 py-10 text-center">
          <BadgePercent className="mx-auto size-8 text-primary" />
          <h3 className="mt-3 font-bold text-foreground">No product discounts are active</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Promotional banners may still be available, or you can browse the full collection.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            Browse furniture
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </section>
  )
}
