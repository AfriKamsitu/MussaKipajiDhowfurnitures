import type { Metadata } from "next"
import { OffersBannerCarousel } from "@/components/offers/offers-banner-carousel"
import { OffersProducts } from "@/components/offers/offers-products"
import { Breadcrumb, PageIntro, PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "Offers",
  description: "Furniture currently on offer.",
}

export default function OffersPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Offers" }]} />
      <PageIntro title="Offers" description="Furniture with a reduced price right now." />
      <OffersBannerCarousel />
      <OffersProducts />
    </PageShell>
  )
}
