import { Suspense } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { PageShell, Breadcrumb } from "@/components/page-shell"
import { ShopBrowser } from "@/components/shop/shop-browser"

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore small-batch furniture made from reclaimed dhow timber on the Swahili coast.",
}

export default function ShopPage() {
  return (
    <PageShell wide>
      <div className="mb-7">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
      </div>

      <section className="shop-cinematic-hero relative isolate -mx-3 mb-14 min-h-[430px] overflow-hidden bg-[#11130f] text-[#f1eee6] sm:-mx-6 sm:min-h-[500px] lg:-mx-8">
        <Image
          src="/reference-site/gallery.jpg"
          alt="A calm interior furnished with handcrafted wooden pieces"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-75"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,15,0.92),rgba(17,19,15,0.56)_55%,rgba(17,19,15,0.18)),linear-gradient(0deg,rgba(17,19,15,0.84),transparent_70%)]" />

        <div className="relative flex min-h-[430px] flex-col justify-between px-5 py-8 sm:min-h-[500px] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="flex items-center justify-between gap-6">
            <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#c5a274]">
              <Sparkles className="size-3.5" /> New workshop furniture
            </p>
            <span className="hidden text-[9px] uppercase tracking-[0.2em] text-white/55 sm:block">
              Small batch · Made in Zanzibar
            </span>
          </div>

          <div className="max-w-2xl">
            <h1 className="max-w-[10ch] text-[clamp(3.7rem,8vw,7.2rem)] font-medium leading-[0.86] tracking-[-0.075em]">
              Furniture made from
              <br />
              <span className="font-light italic text-[#c5a274]">a past.</span>
            </h1>
            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-lg text-[14px] font-light leading-7 text-white/70 sm:text-base">
                Browse the latest furniture from our Bwejuu workshop. Each piece is made in small
                numbers, finished by hand, and shaped by the timber we find.
              </p>
              <Link
                href="#catalog"
                className="group inline-flex min-h-11 w-fit items-center gap-3 border-b border-white/35 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] transition hover:border-[#c5a274] hover:text-[#c5a274]"
              >
                Browse the release
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div id="catalog" className="scroll-mt-8">
        <div className="mb-8 flex items-end justify-between border-t border-black/15 pt-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9b5e3b]">
              The collection
            </p>
            <h2 className="mt-2 text-3xl font-medium tracking-[-0.055em] text-[#11130f] sm:text-4xl">
              Choose your furniture.
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm font-light leading-6 text-muted-foreground sm:block">
            Filter by material, colour, and what is ready to ship.
          </p>
        </div>

        <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading products…</div>}>
          <ShopBrowser />
        </Suspense>
      </div>
    </PageShell>
  )
}
