import type { Metadata } from "next"
import { Breadcrumb, PageShell } from "@/components/page-shell"
import { WishlistView } from "@/components/wishlist/wishlist-view"

export const metadata: Metadata = {
  title: "Wishlist",
}

export default function WishlistPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
      <WishlistView />
    </PageShell>
  )
}
