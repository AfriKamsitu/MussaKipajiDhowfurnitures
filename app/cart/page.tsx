import type { Metadata } from "next"
import { Breadcrumb, PageIntro, PageShell } from "@/components/page-shell"
import { CartView } from "@/components/cart/cart-view"
import { PurchaseSteps } from "@/components/checkout/purchase-steps"
import { RecentlyViewedShelf } from "@/components/recently-viewed-shelf"

export const metadata: Metadata = {
  title: "Shopping Cart",
}

export default function CartPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <PageIntro eyebrow="Your selection" title="Shopping cart" description="Review your pieces and quantities before moving to order confirmation.">
        <PurchaseSteps current="cart" />
      </PageIntro>
      <CartView />
      <RecentlyViewedShelf className="mt-14" />
    </PageShell>
  )
}
