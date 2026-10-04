import type { Metadata } from "next"
import { CartView } from "@/components/cart/cart-view"
import { Breadcrumb, PageIntro, PageShell } from "@/components/page-shell"
import { RecentlyViewedShelf } from "@/components/recently-viewed-shelf"

export const metadata: Metadata = {
  title: "Shopping Cart",
}

export default function CartPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <PageIntro title="Shopping cart" />
      <CartView />
      <RecentlyViewedShelf className="mt-8" />
    </PageShell>
  )
}
