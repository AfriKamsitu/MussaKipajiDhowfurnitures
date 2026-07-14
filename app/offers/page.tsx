import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Tag } from "lucide-react"
import { Breadcrumb, PageShell } from "@/components/page-shell"
import { OffersProducts } from "@/components/offers/offers-products"

export const metadata: Metadata = {
  title: "Offers & Deals — pajedhowfurnitures",
  description: "Save big on stylish furniture with pajedhowfurnitures's seasonal offers and discounts.",
}

export default function OffersPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Offers" }]} />

      <section className="relative mt-6 min-h-[260px] overflow-hidden rounded-xl bg-secondary">
        <Image src="/summer-sale.png" alt="Summer sale promotion" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-transparent" />
        <div className="relative grid max-w-xl gap-3 px-8 py-14 text-primary-foreground lg:px-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Limited Time</p>
          <h1 className="text-balance text-4xl font-bold">Summer Sale — Up to 30% Off</h1>
          <p className="max-w-sm text-pretty text-primary-foreground/85">
            Refresh your home with our seasonal collection. Discounts applied automatically at checkout.
          </p>
          <Link
            href="/shop"
            className="mt-2 inline-flex w-fit rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Shop the Sale
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-foreground">Active Promo Codes</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Promo codes are managed from the admin coupons API and confirmed at checkout.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Tag className="size-4 text-accent" />
          Check available coupons in your account or with the store team.
        </div>
      </section>

      <OffersProducts />
    </PageShell>
  )
}
