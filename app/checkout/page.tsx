import type { Metadata } from "next"
import { Breadcrumb, PageIntro, PageShell } from "@/components/page-shell"
import { CheckoutView } from "@/components/checkout/checkout-view"
import { PurchaseSteps } from "@/components/checkout/purchase-steps"

export const metadata: Metadata = {
  title: "Checkout",
}

export default function CheckoutPage() {
  return (
    <PageShell>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />
      <PageIntro eyebrow="Order details" title="Complete your request" description="Confirm your contact, delivery, and product details before continuing with our team on WhatsApp.">
        <PurchaseSteps current="details" />
      </PageIntro>
      <CheckoutView />
    </PageShell>
  )
}
