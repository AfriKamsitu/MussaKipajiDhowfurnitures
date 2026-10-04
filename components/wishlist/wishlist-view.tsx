"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card"
import { EmptyState } from "@/components/state-panels"
import { useStore } from "@/components/store-provider"

export function WishlistView() {
  const { wishlist, hydrated } = useStore()

  if (!hydrated) return <ProductGridSkeleton count={4} />

  if (wishlist.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Nothing saved yet"
        description="Tap the heart on any product to keep it here while you decide."
      >
        <Link href="/shop" className="sf-btn sf-btn-primary">
          Shop furniture
        </Link>
      </EmptyState>
    )
  }

  return <ProductGrid products={wishlist} priorityCount={4} />
}
