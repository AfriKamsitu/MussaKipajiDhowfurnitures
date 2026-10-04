import { Suspense } from "react"
import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { ProductGridSkeleton } from "@/components/product-card"
import { ShopBrowser } from "@/components/shop/shop-browser"

export const metadata: Metadata = {
  title: "Shop All Furniture",
  description: "Browse, search and filter our full range of handcrafted furniture.",
}

export default function ShopPage() {
  return (
    <PageShell>
      <Suspense fallback={<ProductGridSkeleton count={8} className="mt-16" />}>
        <ShopBrowser />
      </Suspense>
    </PageShell>
  )
}
