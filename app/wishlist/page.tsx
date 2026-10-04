import type { Metadata } from "next"
import { Breadcrumb, PageIntro, PageShell } from "@/components/page-shell"
import { WishlistView } from "@/components/wishlist/wishlist-view"

export const metadata: Metadata = {
  title: "Saved Furniture",
}

export default function WishlistPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Saved items" }]} />
      <PageIntro title="Saved items" description="Furniture you have saved on this device." />
      <WishlistView />
    </PageShell>
  )
}
