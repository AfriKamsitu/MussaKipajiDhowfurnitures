import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import { CartView } from "@/components/cart/cart-view"
import { PageShell } from "@/components/page-shell"
import { RecentlyViewedShelf } from "@/components/recently-viewed-shelf"

export const metadata: Metadata = {
  title: "Shopping Cart",
}

const promises = ["Workshop checked", "Delivery confirmed with you", "Made to last"]

export default function CartPage() {
  return (
    <PageShell>
      <section className="cart-cinematic-intro relative isolate -mx-5 mb-12 min-h-[360px] overflow-hidden bg-[#11130f] text-[#f1eee6] sm:-mx-8 sm:min-h-[410px] lg:-mx-10">
        <Image
          src="/reference-site/table.jpg"
          alt="A handcrafted wooden table in a sunlit interior"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,15,0.94),rgba(17,19,15,0.62)_58%,rgba(17,19,15,0.2)),linear-gradient(0deg,rgba(17,19,15,0.86),transparent_65%)]" />

        <div className="relative flex min-h-[360px] flex-col justify-end px-5 py-8 sm:min-h-[410px] sm:px-10 sm:py-12 lg:px-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c5a274]">
            Your selection
          </p>
          <h1 className="mt-5 max-w-[10ch] text-[clamp(3.4rem,7vw,6.5rem)] font-medium leading-[0.86] tracking-[-0.075em]">
            Your cart
            <br />
            <span className="font-light italic text-[#c5a274]">ready to review.</span>
          </h1>
          <p className="mt-6 max-w-lg text-[14px] font-light leading-7 text-white/68 sm:text-base">
            Review your items before we prepare them for delivery.
          </p>
        </div>
      </section>

      <section className="mb-14 grid gap-4 border-y border-black/12 py-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#66675f] sm:grid-cols-3">
        {promises.map((label) => (
          <div key={label} className="flex items-center gap-2">
            <Check className="size-3.5 text-[#9b5e3b]" />
            {label}
          </div>
        ))}
      </section>

      <CartView />

      <RecentlyViewedShelf className="mt-20" />

      <div className="mt-12 flex justify-end">
        <Link
          href="/contact"
          className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#263228]"
        >
          Need a custom piece?
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </PageShell>
  )
}
