import type { Metadata } from "next"
import { OffersBannerCarousel } from "@/components/offers/offers-banner-carousel"
import { OffersProducts } from "@/components/offers/offers-products"
import { PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "Offers",
  description: "Browse the latest furniture offers from Paje Dhow Furniture.",
}

export default function OffersPage() {
  return (
    <PageShell>
      <section className="reveal-up mb-6 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Limited offers</p>
        <h1 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">
          Special prices for a better home.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Browse current furniture promotions. Product pages show the active price, availability,
          and delivery information before you order.
        </p>
      </section>
      <div className="reveal-scale">
        <OffersBannerCarousel />
      </div>
      <OffersProducts />
    </PageShell>
  )
}
