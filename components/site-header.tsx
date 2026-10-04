"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useCategories } from "@/components/categories-provider"
import { SearchBar } from "@/components/search-bar"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { formatPrice } from "@/lib/data"
import { cn } from "@/lib/utils"

/** How many categories sit directly in the bar; the rest live under "More". */
const INLINE_CATEGORIES = 4

const iconButton =
  "relative grid size-10 place-items-center rounded-full text-[#2a211b] transition-colors hover:bg-black/5"

/** Running service line above the header. Every message is read from the store settings. */
function AnnouncementBar() {
  const settings = useStoreSettings()
  const messages = [
    settings.freeShippingThreshold > 0
      && `Free delivery on orders over ${formatPrice(settings.freeShippingThreshold, settings.currency)}`,
    settings.estimatedDeliveryDays > 0 && `Delivery in about ${settings.estimatedDeliveryDays} days`,
    settings.storePickupEnabled && "Store pickup available",
    settings.cashOnDeliveryEnabled && "Pay on delivery",
  ].filter(Boolean) as string[]

  if (messages.length === 0) return null
  // Repeated so the strip is always wider than the screen; the second half mirrors the first for a seamless loop.
  const run = Array.from({ length: 6 }, () => messages).flat()

  return (
    <div className="overflow-hidden bg-[#6b2b2b] text-white">
      <p className="sr-only">{messages.join(". ")}</p>
      <div className="home-announce-track flex w-max whitespace-nowrap py-2 text-[11px] tracking-[0.04em]" aria-hidden="true">
        {[0, 1].map((half) => (
          <span key={half} className="flex">
            {run.map((message, index) => (
              <span key={index} className="px-7">
                {message}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Light, minimal header shared by every buyer-facing page. */
export function SiteHeader() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { cartCount, wishlistCount } = useStore()
  const settings = useStoreSettings()
  const categories = useCategories()
  // Search stays open on the catalog, where it doubles as the results query box.
  const [searchOpen, setSearchOpen] = useState(pathname === "/shop")
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.role === "admin"
  const accountHref = user ? (isAdmin ? "/admin" : "/account") : "/login"
  const inline = categories.slice(0, INLINE_CATEGORIES)
  const overflow = categories.slice(INLINE_CATEGORIES)
  const socials = [
    { label: "Instagram", href: settings.instagramUrl },
    { label: "Facebook", href: settings.facebookUrl },
    { label: "TikTok", href: settings.tiktokUrl },
  ].filter((item) => item.href)

  useEffect(() => {
    setMenuOpen(false)
    setMoreOpen(false)
    setSearchOpen(pathname === "/shop")
  }, [pathname])

  useEffect(() => {
    if (!moreOpen) return
    function close(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener("pointerdown", close)
    document.addEventListener("keydown", close)
    return () => {
      document.removeEventListener("pointerdown", close)
      document.removeEventListener("keydown", close)
    }
  }, [moreOpen])

  const navLink = "text-[11px] uppercase tracking-[0.16em] text-[#2a211b]/80 transition-colors hover:text-[#6b2b2b]"

  return (
    <>
      <AnnouncementBar />
      <header data-site-header className="sticky top-0 z-[80] border-b border-black/5 bg-white">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:h-16 lg:gap-8">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="site-mobile-menu"
            className={cn(iconButton, "-ml-2 lg:hidden")}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <Link href="/" aria-label={`${settings.storeName} home`} className="flex shrink-0 items-center gap-2.5">
            <span className="relative size-9 overflow-hidden rounded-full ring-1 ring-black/10">
              <Image src={settings.logoUrl} alt="" fill priority unoptimized sizes="36px" className="object-cover" />
            </span>
            <span className="text-sm font-medium tracking-[0.02em] text-[#2a211b] lg:sr-only">{settings.storeName}</span>
          </Link>

          <nav aria-label="Furniture categories" className="hidden items-center gap-7 lg:flex">
            <Link href="/shop" className={navLink}>
              All furniture
            </Link>
            {inline.map((category) => (
              <Link key={category.slug} href={`/shop?category=${encodeURIComponent(category.slug)}`} className={navLink}>
                {category.name}
              </Link>
            ))}
            {overflow.length > 0 && (
              <div ref={moreRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen((open) => !open)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  className={cn(navLink, "flex items-center gap-1")}
                >
                  More
                  <ChevronDown className={cn("size-3 transition-transform", moreOpen && "rotate-180")} aria-hidden="true" />
                </button>
                {moreOpen && (
                  <ul className="sf-fade-in absolute left-0 top-full z-10 mt-3 min-w-48 border border-black/10 bg-white py-2 shadow-elevated">
                    {overflow.map((category) => (
                      <li key={category.slug}>
                        <Link
                          href={`/shop?category=${encodeURIComponent(category.slug)}`}
                          className="block px-4 py-2 text-[12px] tracking-[0.04em] text-[#2a211b] hover:bg-[#f5f4f1]"
                        >
                          {category.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <Link
              href="/offers"
              aria-current={pathname.startsWith("/offers") ? "page" : undefined}
              className={cn(navLink, "text-[#6b2b2b]")}
            >
              Offers
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            {socials.length > 0 && (
              <ul className="mr-2 hidden items-center gap-3 text-[11px] tracking-[0.04em] text-[#2a211b]/70 xl:flex">
                {socials.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} target="_blank" rel="noreferrer" className="hover:text-[#6b2b2b]">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? "Close search" : "Search furniture"}
              aria-expanded={searchOpen}
              aria-controls="site-search"
              className={iconButton}
            >
              {searchOpen ? <X className="size-[18px]" /> : <Search className="size-[18px]" />}
            </button>
            <Link href={accountHref} aria-label={user ? "Your account" : "Sign in"} className={cn(iconButton, "hidden sm:grid")}>
              <UserRound className="size-[18px]" />
            </Link>
            {!isAdmin && (
              <>
                <Link
                  href="/wishlist"
                  aria-label={`Saved items${wishlistCount ? `, ${wishlistCount}` : ""}`}
                  className={cn(iconButton, "hidden sm:grid")}
                >
                  <Heart className="size-[18px]" />
                  {wishlistCount > 0 && (
                    <span className="absolute right-1 top-1 size-2 rounded-full bg-[#6b2b2b]" aria-hidden="true" />
                  )}
                </Link>
                <Link
                  href="/cart"
                  aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                  className={iconButton}
                >
                  <ShoppingBag className="size-[18px]" />
                  {cartCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex min-w-[17px] items-center justify-center rounded-full bg-[#6b2b2b] px-1 text-[10px] font-bold leading-[17px] text-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>

        {searchOpen && (
          <div id="site-search" className="sf-fade-in border-t border-black/5 bg-white">
            <div className="mx-auto max-w-[1240px] px-4 py-3 sm:px-6">
              <Suspense fallback={<div className="h-11 rounded-lg bg-[#f5f4f1]" />}>
                <SearchBar categories={categories} className="border border-black/15" />
              </Suspense>
            </div>
          </div>
        )}

        {menuOpen && (
          <nav
            id="site-mobile-menu"
            aria-label="Menu"
            className="sf-fade-in max-h-[70vh] overflow-y-auto border-t border-black/5 bg-white px-4 py-2 lg:hidden"
          >
            {[
              { label: "All furniture", href: "/shop" },
              ...categories.map((category) => ({
                label: category.name,
                href: `/shop?category=${encodeURIComponent(category.slug)}`,
              })),
              { label: "Offers", href: "/offers" },
              { label: user ? "Your account" : "Sign in", href: accountHref },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="flex min-h-11 items-center border-b border-black/5 text-[12px] uppercase tracking-[0.14em] text-[#2a211b] last:border-b-0"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  )
}
