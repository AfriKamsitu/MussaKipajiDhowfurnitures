"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, Lock, MapPin, Menu, ShoppingCart, UserRound, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useCategories } from "@/components/categories-provider"
import { SearchBar } from "@/components/search-bar"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { formatPrice } from "@/lib/data"
import { OFFERS_DELIVERY } from "@/lib/pricing"
import { cn } from "@/lib/utils"

const OPEN_MENU_EVENT = "sf:open-menu"

/** Opens the browse drawer from anywhere, e.g. the Menu tab of the mobile bar. */
export function openBuyerMenu() {
  window.dispatchEvent(new Event(OPEN_MENU_EVENT))
}

const headerLink =
  "flex min-h-11 flex-col justify-center rounded-sm px-2 text-left leading-tight text-[#2a211b] outline-none ring-[#2a211b]/40 hover:ring-1 focus-visible:ring-1"
const headerLinkSmall = "text-[11px] text-[#2a211b]/65"
const headerLinkStrong = "text-[13px] font-bold"

function loginHref(target: string) {
  return `/login?redirect=${encodeURIComponent(target)}`
}

/** Service messages read from the store settings (free delivery, pickup, pay on delivery). */
function useServiceMessages() {
  const settings = useStoreSettings()
  return [
    OFFERS_DELIVERY
      && settings.freeShippingThreshold > 0
      && `Free delivery on orders over ${formatPrice(settings.freeShippingThreshold, settings.currency)}`,
    OFFERS_DELIVERY && settings.estimatedDeliveryDays > 0 && `Delivery in about ${settings.estimatedDeliveryDays} days`,
    (settings.storePickupEnabled || !OFFERS_DELIVERY) && "Collect from our store",
    settings.cashOnDeliveryEnabled && (OFFERS_DELIVERY ? "Pay on delivery" : "Pay on collection"),
  ].filter(Boolean) as string[]
}

/** Where orders go: the buyer's default address when signed in, otherwise the store's region. */
function useDeliveryPlace() {
  const { user } = useAuth()
  const settings = useStoreSettings()
  const saved = user?.addresses.find((address) => address.isDefault) ?? user?.addresses[0]
  // Collection only: there is no delivery destination to show.
  if (!OFFERS_DELIVERY) return { place: "", href: "/contact", saved: false }
  return {
    place: saved ? [saved.city, saved.region].filter(Boolean).join(", ") : settings.country || settings.city,
    href: user ? "/account/addresses" : loginHref("/account/addresses"),
    saved: Boolean(saved),
  }
}

/** Slide-in browse menu: categories, deals, account and help in one list. */
function BrowseDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth()
  const categories = useCategories()
  const closeRef = useRef<HTMLButtonElement>(null)
  const isAdmin = user?.role === "admin"
  const firstName = user?.name.trim().split(/\s+/)[0]

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    document.body.classList.add("sf-scroll-locked")
    closeRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("sf-scroll-locked")
      previous?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const sections = [
    {
      title: "Shop by category",
      links: [
        { label: "All furniture", href: "/shop" },
        ...categories.map((category) => ({
          label: category.name,
          href: `/shop?category=${encodeURIComponent(category.slug)}`,
        })),
      ],
    },
    {
      title: "Deals & new",
      links: [
        { label: "Today's offers", href: "/offers" },
        { label: "New arrivals", href: "/shop?sort=newest" },
      ],
    },
    {
      title: "Your account",
      links: isAdmin
        ? [{ label: "Admin panel", href: "/admin" }]
        : [
            { label: "Your account", href: user ? "/account" : loginHref("/account") },
            { label: "Your orders", href: user ? "/account/orders" : loginHref("/account/orders") },
            { label: "Saved items", href: "/wishlist" },
            { label: "Cart", href: "/cart" },
          ],
    },
    {
      title: "Help",
      links: [
        { label: "Customer service", href: "/contact" },
        { label: "About us", href: "/about" },
      ],
    },
  ]

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Browse menu">
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="sf-fade-in absolute inset-0 bg-black/55"
      />
      <div className="sf-drawer-enter-left absolute inset-y-0 left-0 flex w-[min(86vw,360px)] flex-col bg-white shadow-elevated">
        <div className="flex items-center gap-3 bg-[#2a211b] px-4 py-3 text-white">
          <UserRound className="size-6 shrink-0" aria-hidden="true" />
          <Link
            href={user ? (isAdmin ? "/admin" : "/account") : "/login"}
            onClick={onClose}
            className="min-w-0 flex-1 truncate text-base font-bold"
          >
            Hello, {firstName || "sign in"}
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label="Browse" className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          {sections.map((section) => (
            <section key={section.title} className="border-b border-black/10 py-2">
              <h2 className="px-5 pb-1 pt-2 text-base font-bold text-[#2a211b]">{section.title}</h2>
              <ul>
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="flex min-h-11 items-center justify-between gap-3 px-5 text-sm text-[#2a211b] hover:bg-[#f4f3f1]"
                    >
                      <span className="truncate">{link.label}</span>
                      <ChevronRight className="size-4 shrink-0 text-[#2a211b]/45" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => {
                onClose()
                signOut()
              }}
              className="flex min-h-11 w-full items-center px-5 text-left text-sm text-[#2a211b] hover:bg-[#f4f3f1]"
            >
              Sign out
            </button>
          )}
        </nav>
      </div>
    </div>
  )
}

/**
 * Marketplace header shared by every buyer-facing page. The top row (logo,
 * search, account, orders, cart) stays pinned; the category strip scrolls away.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { cartCount } = useStore()
  const settings = useStoreSettings()
  const categories = useCategories()
  const messages = useServiceMessages()
  const delivery = useDeliveryPlace()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = user?.role === "admin"
  const accountHref = user ? (isAdmin ? "/admin" : "/account") : "/login"
  const firstName = user?.name.trim().split(/\s+/)[0]

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    const open = () => setMenuOpen(true)
    window.addEventListener(OPEN_MENU_EVENT, open)
    return () => window.removeEventListener(OPEN_MENU_EVENT, open)
  }, [])

  const stripLink =
    "flex h-10 shrink-0 items-center whitespace-nowrap px-2.5 text-[13px] text-[#2a211b] hover:text-[#6b2b2b] hover:underline underline-offset-4"
  const accountLinks = user
    ? isAdmin
      ? [{ label: "Admin panel", href: "/admin" }]
      : [
          { label: "Your account", href: "/account" },
          { label: "Your orders", href: "/account/orders" },
          { label: "Your addresses", href: "/account/addresses" },
          { label: "Saved items", href: "/wishlist" },
        ]
    : [
        { label: "Your orders", href: loginHref("/account/orders") },
        { label: "Saved items", href: "/wishlist" },
      ]

  return (
    <>
      <header data-site-header className="sticky top-0 z-[80] border-b border-black/10 bg-white">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-2 px-3 sm:px-5 lg:h-16 lg:gap-3 lg:px-8">
          <Link href="/" aria-label={`${settings.storeName} home`} className="flex shrink-0 items-center gap-2.5">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10 lg:size-12">
              <Image src={settings.logoUrl} alt="" fill priority unoptimized sizes="48px" className="object-cover" />
            </span>
            <span className="hidden max-w-36 truncate text-sm font-bold text-[#2a211b] xl:block">{settings.storeName}</span>
          </Link>

          {delivery.place && (
            <Link href={delivery.href} className={cn(headerLink, "hidden shrink-0 lg:flex")}>
              <span className={cn(headerLinkSmall, "pl-5")}>{delivery.saved ? "Deliver to" : "Delivering in"}</span>
              <span className={cn(headerLinkStrong, "flex items-center gap-1")}>
                <MapPin className="size-4" aria-hidden="true" />
                <span className="max-w-32 truncate">{delivery.place}</span>
              </span>
            </Link>
          )}

          <Suspense fallback={<div className="h-11 min-w-0 flex-1 rounded-lg bg-[#f4f3f1]" />}>
            <SearchBar categories={categories} className="border border-black/20" />
          </Suspense>

          <div className="group relative hidden shrink-0 lg:block">
            <Link href={accountHref} className={headerLink} aria-haspopup="true">
              <span className={headerLinkSmall}>Hello, {firstName || "sign in"}</span>
              <span className={cn(headerLinkStrong, "flex items-center gap-0.5")}>
                {isAdmin ? "Admin panel" : "Account & Lists"}
                <ChevronDown className="size-3.5" aria-hidden="true" />
              </span>
            </Link>
            <div className="invisible absolute right-0 top-full z-10 w-60 pt-1 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="border border-black/10 bg-white p-3 shadow-elevated">
                {!user && (
                  <div className="border-b border-black/10 pb-3 text-center">
                    <Link href="/login" className="sf-btn sf-btn-primary sf-btn-sm w-full">
                      Sign in
                    </Link>
                    <p className="mt-2 text-xs text-[#2a211b]/70">
                      New customer?{" "}
                      <Link href="/register" className="text-[#6b2b2b] hover:underline">
                        Start here
                      </Link>
                    </p>
                  </div>
                )}
                <ul className={cn(!user && "pt-2")}>
                  {accountLinks.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="block rounded-sm px-2 py-1.5 text-[13px] text-[#2a211b] hover:bg-[#f4f3f1] hover:text-[#6b2b2b]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  {user && (
                    <li className="mt-1 border-t border-black/10 pt-1">
                      <button
                        type="button"
                        onClick={signOut}
                        className="block w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-[#2a211b] hover:bg-[#f4f3f1] hover:text-[#6b2b2b]"
                      >
                        Sign out
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {!isAdmin && (
            <>
              <Link
                href={user ? "/account/orders" : loginHref("/account/orders")}
                className={cn(headerLink, "hidden shrink-0 lg:flex")}
              >
                <span className={headerLinkSmall}>Track</span>
                <span className={headerLinkStrong}>Your orders</span>
              </Link>
              <Link
                href="/cart"
                aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                aria-current={pathname === "/cart" ? "page" : undefined}
                className={cn(headerLink, "shrink-0 !flex-row items-center gap-1.5")}
              >
                <span className="relative">
                  <ShoppingCart className="size-6 lg:size-7" aria-hidden="true" />
                  <span className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-[#6b2b2b] px-1 text-[10px] font-bold leading-[18px] text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                </span>
                <span className={cn(headerLinkStrong, "hidden lg:inline")}>Cart</span>
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="border-b border-black/10 bg-[#f4f3f1]">
        <div className="mx-auto flex max-w-[1240px] items-center px-1 sm:px-3 lg:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className={cn(stripLink, "gap-1.5 font-bold hover:no-underline")}
          >
            <Menu className="size-5" aria-hidden="true" />
            All
          </button>
          <nav
            aria-label="Furniture categories"
            className="scrollbar-none flex min-w-0 flex-1 items-center overflow-x-auto [mask-image:linear-gradient(90deg,#000_calc(100%-2rem),transparent)]"
          >
            <Link
              href="/offers"
              aria-current={pathname.startsWith("/offers") ? "page" : undefined}
              className={cn(stripLink, "font-bold text-[#6b2b2b]")}
            >
              Today&apos;s offers
            </Link>
            <Link href="/shop?sort=newest" className={stripLink}>
              New arrivals
            </Link>
            {categories.map((category) => (
              <Link key={category.slug} href={`/shop?category=${encodeURIComponent(category.slug)}`} className={stripLink}>
                {category.name}
              </Link>
            ))}
            <Link href="/contact" className={stripLink}>
              Customer service
            </Link>
          </nav>
          {messages[0] && (
            <p className="hidden shrink-0 pl-4 pr-2 text-[13px] font-bold text-[#2a211b] xl:block">{messages[0]}</p>
          )}
        </div>
      </div>

      {/* Phones and tablets: the delivery line sits under the category strip, as in a shopping app. */}
      {(delivery.place || messages.length > 0) && (
        <Link
          href={delivery.href}
          className="flex min-h-9 items-center gap-1.5 border-b border-black/10 bg-[#ebe9e4] px-3 text-[12px] text-[#2a211b] sm:px-5 lg:hidden"
        >
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {delivery.place && `${delivery.saved ? "Deliver to" : "Delivering in"} ${delivery.place}`}
            {delivery.place && messages[0] ? " · " : ""}
            {messages[0]}
          </span>
        </Link>
      )}

      <BrowseDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}

/** Distraction-free header for checkout: logo, page name and a way back to the cart. */
export function CheckoutHeader() {
  const settings = useStoreSettings()
  const { cartCount } = useStore()

  return (
    <header data-site-header className="sticky top-0 z-[80] border-b border-black/10 bg-white">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-3 sm:px-5 lg:h-16 lg:px-8">
        <Link href="/" aria-label={`${settings.storeName} home`} className="flex shrink-0 items-center gap-2.5">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10 lg:size-12">
            <Image src={settings.logoUrl} alt="" fill priority unoptimized sizes="48px" className="object-cover" />
          </span>
          <span className="hidden text-sm font-bold text-[#2a211b] sm:block">{settings.storeName}</span>
        </Link>
        <h1 className="flex flex-1 items-center justify-center gap-2 text-lg font-bold text-[#2a211b] sm:text-xl">
          <Lock className="size-4 text-[#2a211b]/55" aria-hidden="true" />
          Checkout
        </h1>
        <Link
          href="/cart"
          aria-label={`Back to cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          className={cn(headerLink, "shrink-0 !flex-row items-center gap-1.5")}
        >
          <ShoppingCart className="size-6" aria-hidden="true" />
          <span className={cn(headerLinkStrong, "hidden sm:inline")}>Cart ({cartCount})</span>
        </Link>
      </div>
    </header>
  )
}
