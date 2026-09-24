import { Suspense } from "react"
import type { Metadata } from "next"
import { Breadcrumb, PageIntro, PageShell } from "@/components/page-shell"
import { ShopBrowser } from "@/components/shop/shop-browser"

export const metadata: Metadata = {
  title: "Shop",
}

export default function ShopPage() {
  return (
    <PageShell wide>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <PageIntro
        compact
        eyebrow="Furniture marketplace"
        title="Source the right furniture with confidence."
        description="Compare prices, materials, minimum order quantities, availability, and workshop details—then order directly or request a quotation."
      />
      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading products…</div>}>
        <ShopBrowser />
      </Suspense>
    </PageShell>
  )
}
