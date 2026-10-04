"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { BadgePercent } from "lucide-react"
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card"
import { SectionHeader } from "@/components/product-rail"
import { EmptyState, ErrorState } from "@/components/state-panels"
import { discountPercent, listCatalog } from "@/lib/catalog"
import type { Product } from "@/lib/data"

/** Products whose compare price is genuinely higher than the selling price. */
export function OffersProducts() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    setFailed(false)
    setProducts(null)
    listCatalog()
      .then((list) =>
        setProducts(
          list
            .filter((product) => discountPercent(product))
            .sort((a, b) => (discountPercent(b) ?? 0) - (discountPercent(a) ?? 0)),
        ),
      )
      .catch(() => setFailed(true))
  }, [])

  useEffect(load, [load])

  return (
    <section aria-labelledby="offers-products" className="mt-6">
      <SectionHeader id="offers-products" title="On sale now" href="/shop" linkLabel="Shop all" />
      {failed ? (
        <ErrorState title="We couldn't load the offers" onRetry={load} />
      ) : products === null ? (
        <ProductGridSkeleton count={4} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={BadgePercent}
          title="No reduced prices right now"
          description="Check back soon, or browse the full range."
        >
          <Link href="/shop" className="sf-btn sf-btn-primary">
            Shop furniture
          </Link>
        </EmptyState>
      ) : (
        <ProductGrid products={products} priorityCount={4} />
      )}
    </section>
  )
}
