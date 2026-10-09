import type { Metadata } from "next"
import { CheckoutView } from "@/components/checkout/checkout-view"
import { PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "Checkout",
}

export default function CheckoutPage() {
  return (
    <PageShell variant="checkout">
      <CheckoutView />
    </PageShell>
  )
}
