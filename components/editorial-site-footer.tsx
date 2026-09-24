"use client"

import Image from "next/image"
import Link from "next/link"
import { useStoreSettings } from "@/components/store-settings-provider"
import { MobileBuyerNav } from "@/components/mobile-buyer-nav"

export function EditorialSiteFooter() {
  const settings = useStoreSettings()

  return (
    <>
      <footer className="border-t border-white/10 bg-[#11130f] pb-20 text-[#f1eee6] md:pb-0">
        <div className="mx-auto grid min-h-24 max-w-[1320px] gap-4 px-5 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-8 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${settings.storeName} home`}>
            <span className="relative size-7 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white">
              <Image src={settings.logoUrl} alt="" fill sizes="28px" className="object-cover" unoptimized />
            </span>
            <span className="truncate text-[12px] font-bold tracking-[-0.02em]">{settings.storeName}</span>
            <span className="hidden text-[11px] text-white/65 md:inline">Handcrafted on the Swahili coast</span>
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/70" aria-label="Footer navigation">
            <Link href="/shop" className="inline-flex min-h-6 items-center transition hover:text-white">Collections</Link>
            <Link href="/about" className="inline-flex min-h-6 items-center transition hover:text-white">Craft</Link>
            <Link href="/contact" className="inline-flex min-h-6 items-center transition hover:text-white">Contact</Link>
          </nav>
          <p className="text-[11px] text-white/65">© {new Date().getFullYear()} {settings.storeName}</p>
        </div>
      </footer>
      <MobileBuyerNav />
    </>
  )
}
