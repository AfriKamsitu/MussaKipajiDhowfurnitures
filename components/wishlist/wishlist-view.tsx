"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { useStore } from "@/components/store-provider"

export function WishlistView() {
  const { wishlist } = useStore()

  if (wishlist.length === 0) {
    return (
      <div className="surface-premium flex flex-col items-center justify-center gap-4 rounded-3xl px-6 py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-accent">
          <Heart className="size-7" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">Your wishlist is empty</h2>
        <p className="text-sm text-muted-foreground">Save items you love to find them easily later.</p>
        <Link
          href="/shop"
          className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-accent"
        >
          Explore Products
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 xl:grid-cols-4">
      {wishlist.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
