"use client"

import { ProductRail } from "@/components/product-rail"
import { useStore } from "@/components/store-provider"

/** Products this browser has opened recently (kept locally, never sent to the server). */
export function RecentlyViewedShelf({
  excludeId,
  className,
  limit = 8,
}: {
  excludeId?: string
  className?: string
  limit?: number
}) {
  const { recentlyViewed } = useStore()
  const products = recentlyViewed.filter((product) => product.id !== excludeId).slice(0, limit)

  return <ProductRail title="Recently viewed" products={products} className={className} />
}
