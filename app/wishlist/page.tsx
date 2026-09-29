import type { Metadata } from "next"
import Image from "next/image"

import { Breadcrumb, PageShell } from "@/components/page-shell"
import { WishlistView } from "@/components/wishlist/wishlist-view"

export const metadata: Metadata = {
  title: "Saved Furniture",
}

export default function WishlistPage() {
  return (
    <PageShell>
      <div className="mb-7">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Saved furniture" }]} />
      </div>

      <section className="buyer-cinematic-banner relative isolate -mx-5 mb-14 min-h-[330px] overflow-hidden bg-[#11130f] text-[#f1eee6] sm:-mx-8 sm:min-h-[390px] lg:-mx-10">
        <Image
          src="/reference-site/sofa.jpg"
          alt="Comfortable handcrafted furniture in a Zanzibar home"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,15,0.94),rgba(17,19,15,0.6)_58%,rgba(17,19,15,0.2)),linear-gradient(0deg,rgba(17,19,15,0.85),transparent_70%)]" />
        <div className="relative flex min-h-[330px] flex-col justify-end px-5 py-8 sm:min-h-[390px] sm:px-10 sm:py-11 lg:px-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c5a274]">
            Your saved furniture
          </p>
          <h1 className="mt-4 max-w-[10ch] text-[clamp(3.3rem,7vw,6.4rem)] font-medium leading-[0.87] tracking-[-0.075em]">
            Keep the pieces
            <br />
            <span className="font-light italic text-[#c5a274]">you like.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[14px] font-light leading-7 text-white/68 sm:text-base">
            Save furniture while you compare finishes, sizes, and prices.
          </p>
        </div>
      </section>

      <WishlistView />
    </PageShell>
  )
}
