"use client"

import Image from "next/image"
import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { MobileBuyerNav } from "@/components/mobile-buyer-nav"
import { useStoreSettings } from "@/components/store-settings-provider"
import { WhatsAppGlyph } from "@/components/whatsapp-glyph"

const shopLinks = [
  { label: "All furniture", href: "/shop" },
  { label: "New arrivals", href: "/shop?sort=newest" },
  { label: "Offers", href: "/offers" },
  { label: "Saved items", href: "/wishlist" },
]

const accountLinks = [
  { label: "Your account", href: "/account" },
  { label: "Your orders", href: "/account/orders" },
  { label: "Cart", href: "/cart" },
  { label: "Contact us", href: "/contact" },
]

/** Every contact detail comes from the store settings managed in the admin panel. */
export function SiteFooter() {
  const settings = useStoreSettings()
  const address = [settings.addressLine1, settings.addressLine2, settings.city, settings.country]
    .filter(Boolean)
    .join(", ")
  const whatsapp = settings.whatsappNumber.replace(/\D/g, "")
  const socials = [
    { label: "Facebook", href: settings.facebookUrl },
    { label: "Instagram", href: settings.instagramUrl },
    { label: "TikTok", href: settings.tiktokUrl },
  ].filter((item) => item.href)

  return (
    <>
      <footer className="mt-auto bg-header pb-20 text-[#f6f0e6] lg:pb-0">
        <div className="sf-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label={`${settings.storeName} home`}>
              <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-white">
                <Image src={settings.logoUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
              </span>
              <span className="text-base font-bold">{settings.storeName}</span>
            </Link>
            {settings.tagline && <p className="mt-3 max-w-xs text-sm text-white/70">{settings.tagline}</p>}
            {socials.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {socials.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white/80 underline-offset-4 hover:text-white hover:underline"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Shop">
            <h2 className="text-sm font-bold text-white">Shop</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/75 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Customer service">
            <h2 className="text-sm font-bold text-white">Customer service</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/75 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/about" className="text-white/75 hover:text-white">
                  About us
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold text-white">Get in touch</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-white/75">
              {address && (
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[#d9b98a]" aria-hidden="true" />
                  {address}
                </li>
              )}
              {settings.storePhone && (
                <li>
                  <a href={`tel:${settings.storePhone.replace(/\s+/g, "")}`} className="flex gap-2 hover:text-white">
                    <Phone className="mt-0.5 size-4 shrink-0 text-[#d9b98a]" aria-hidden="true" />
                    {settings.storePhone}
                  </a>
                </li>
              )}
              {settings.storeEmail && (
                <li>
                  <a href={`mailto:${settings.storeEmail}`} className="flex gap-2 break-all hover:text-white">
                    <Mail className="mt-0.5 size-4 shrink-0 text-[#d9b98a]" aria-hidden="true" />
                    {settings.storeEmail}
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex gap-2 hover:text-white"
                  >
                    <WhatsAppGlyph className="mt-0.5 size-4 shrink-0 text-[#d9b98a]" />
                    Chat on WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="sf-container py-4 text-xs text-white/60">
            © {new Date().getFullYear()} {settings.storeName}. Prices in {settings.currency}.
          </p>
        </div>
      </footer>
      <MobileBuyerNav />
    </>
  )
}
