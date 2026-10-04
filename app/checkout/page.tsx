import type { Metadata } from "next"
import { CheckoutView } from "@/components/checkout/checkout-view"
import { Breadcrumb, PageIntro, PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "Checkout",
}

export default function CheckoutPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <PageIntro title="Checkout" />
      <CheckoutView />
    </PageShell>
  )
}
