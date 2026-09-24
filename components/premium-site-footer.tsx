"use client"

import Image from "next/image"
import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { useStoreSettings } from "@/components/store-settings-provider"

const exploreLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Offers", href: "/offers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export function SiteFooter() {
  const settings = useStoreSettings()
  const address = [settings.addressLine1, settings.addressLine2, settings.city, settings.country]
    .filter(Boolean)
    .join(", ")

  return (
    <footer className="relative isolate mt-10 overflow-hidden border-t border-white/10 bg-[linear-gradient(135deg,#281912_0%,#1b1411_100%)] text-background sm:mt-14">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(216,199,174,0.14),transparent_26rem),radial-gradient(circle_at_92%_110%,rgba(89,101,76,0.16),transparent_24rem)]" aria-hidden="true" />
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid items-start gap-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(20rem,0.9fr)] lg:gap-12">
          <div>
            <Link href="/" className="flex w-fit items-center gap-3" aria-label={settings.storeName + " home"}>
              <Image src={settings.logoUrl} alt={settings.storeName + " logo"} width={56} height={56} className="size-12 rounded-xl object-cover shadow-lg ring-1 ring-white/15 sm:size-14" unoptimized />
              <span>
                <span className="block max-w-48 text-sm font-black uppercase tracking-[0.045em] text-white">{settings.storeName}</span>
                <span className="mt-0.5 block max-w-52 text-xs leading-5 text-white/55">Handcrafted in Zanzibar.</span>
              </span>
            </Link>
            <div className="mt-4 flex items-center gap-2">
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-white/65 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white">
                  <span className="text-[10px] font-black tracking-tight">IG</span>
                </a>
              )}
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-white/65 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white">
                  <span className="text-sm font-black lowercase">f</span>
                </a>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8c7ae]">Navigate</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 lg:grid-cols-1">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="group inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"><span className="size-1 rounded-full bg-[#d8c7ae]/45 transition-transform group-hover:scale-150" />{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-5">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8c7ae]">Contact the workshop</h2>
            <div className="mt-5 grid gap-4 text-sm">
              <a href={"tel:" + settings.storePhone.replace(/[^\d+]/g, "")} className="group flex items-center gap-3 text-white/65 transition-colors hover:text-white">
                <Phone className="mt-0.5 size-4 shrink-0 text-[#d8c7ae]" />
                <span>{settings.storePhone}</span>
              </a>
              <a href={"mailto:" + settings.storeEmail} className="group flex min-w-0 items-center gap-3 text-white/65 transition-colors hover:text-white">
                <Mail className="mt-0.5 size-4 shrink-0 text-[#d8c7ae]" />
                <span className="break-all">{settings.storeEmail}</span>
              </a>
              <Link href="/contact#visit-workshop" className="group flex items-center gap-3 text-white/65 transition-colors hover:text-white">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#d8c7ae]" />
                <span>{address || "Bwejuu, Zanzibar, Tanzania"}</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5 text-center text-[11px] text-white/40 sm:text-left">
          <p>&copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
