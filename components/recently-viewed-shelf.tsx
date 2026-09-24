"use client"

import { Clock3 } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { useStore } from "@/components/store-provider"
import { cn } from "@/lib/utils"

export function RecentlyViewedShelf({
  excludeId,
  className,
  limit = 4,
}: {
  excludeId?: string
  className?: string
  limit?: number
}) {
  const { recentlyViewed } = useStore()
  const products = recentlyViewed
    .filter((product) => product.id !== excludeId)
    .slice(0, limit)

  if (products.length === 0) return null

  return (
    <section className={cn("border-t border-border pt-10 sm:pt-12", className)}>
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <Clock3 className="size-3.5" />
            Pick up where you left off
          </p>
          <h2 className="mt-1.5 text-2xl font-black tracking-[-0.025em] text-foreground sm:text-3xl">
            Recently viewed
          </h2>
        </div>
      </div>

      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:px-0 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="w-[72vw] max-w-72 shrink-0 snap-start sm:w-auto sm:max-w-none">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
