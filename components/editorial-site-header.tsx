"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Menu, ShoppingBag, UserRound, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ScrollProgress } from "@/components/scroll-progress"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { cn } from "@/lib/utils"

const primaryLinks = [
  { label: "Collections", href: "/shop" },
  { label: "New arrivals", href: "/shop?sort=new" },
  { label: "Offers", href: "/offers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export function EditorialSiteHeader() {
  const pathname = usePathname()
  const { cartCount, wishlistCount } = useStore()
  const { user } = useAuth()
  const settings = useStoreSettings()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.role === "admin"

  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", menuOpen)

    if (!menuOpen) {
      return () => document.body.classList.remove("mobile-menu-open")
    }

    const panel = menuPanelRef.current
    const menuButton = menuButtonRef.current
    const inertTargets = Array.from(
      document.querySelectorAll<HTMLElement>('main, footer, [data-site-header], [aria-label="Buyer navigation"]'),
    )
    inertTargets.forEach((target) => {
      target.inert = true
    })

    const focusableItems = () =>
      [
        ...Array.from(
          panel?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        ),
      ].filter((item): item is HTMLElement => Boolean(item && !item.hasAttribute("disabled")))

    const focusTimer = window.setTimeout(() => {
      panel?.querySelector<HTMLElement>('a[href]')?.focus()
    }, 80)

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        setMenuOpen(false)
        return
      }

      if (event.key !== "Tab") return

      const items = focusableItems()
      const first = items[0]
      const last = items.at(-1)
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    const desktopQuery = window.matchMedia("(min-width: 1280px)")
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setMenuOpen(false)
    }
    desktopQuery.addEventListener("change", closeOnDesktop)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener("keydown", handleKeyDown)
      desktopQuery.removeEventListener("change", closeOnDesktop)
      inertTargets.forEach((target) => {
        target.inert = false
      })
      document.body.classList.remove("mobile-menu-open")
      menuButton?.focus()
    }
  }, [menuOpen])

  function isActive(href: string) {
    if (href.includes("?")) return false
    const route = href.split("?")[0]
    if (route === "/shop") return pathname.startsWith("/shop") || pathname.startsWith("/product")
    return pathname.startsWith(route)
  }

  return (
    <>
      <ScrollProgress />
      <header data-site-header className="relative z-[80] w-full shrink-0 border-b border-white/10 bg-[#111713] text-[#f1eee6]">
        <div className="mx-auto flex h-[var(--site-header-height)] max-w-[1440px] items-center px-5 sm:px-10 lg:px-[60px]">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5"
            aria-label={`${settings.storeName} home`}
          >
            <span className="relative size-9 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white">
              <Image
                src={settings.logoUrl}
                alt=""
                fill
                priority
                unoptimized
                sizes="36px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </span>
            <span className="truncate text-[13px] font-bold tracking-[-0.03em] sm:text-base">
              {settings.storeName}
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-7 xl:flex" aria-label="Primary navigation">
            {primaryLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "nav-underline relative py-5 text-[13px] font-medium text-white/70 transition-colors duration-300 hover:text-white",
                  isActive(link.href) && "text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 xl:ml-7">
            <Link
              href="/wishlist"
              className="relative hidden size-10 items-center justify-center rounded-full text-white/72 transition hover:bg-white/10 hover:text-white sm:flex"
              aria-label="Saved furniture"
            >
              <Heart className="size-[17px]" />
              {wishlistCount > 0 && (
                <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-[#c5a274] text-[8px] font-black text-[#11130f]">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>
            {!isAdmin && (
              <Link
                href="/cart"
                className="relative flex size-10 items-center justify-center rounded-full text-white/72 transition hover:bg-white/10 hover:text-white"
                aria-label="Shopping cart"
              >
                <ShoppingBag className="size-[17px]" />
                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-[#c5a274] text-[8px] font-black text-[#11130f]">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              href={user ? (isAdmin ? "/admin" : "/account") : "/login"}
              className="hidden size-10 items-center justify-center rounded-full text-white/72 transition hover:bg-white/10 hover:text-white md:flex"
              aria-label={isAdmin ? "Admin workspace" : user ? "Buyer account" : "Sign in"}
            >
              <UserRound className="size-[17px]" />
            </Link>
            <Link
              href="/contact?request=I would like to discuss a custom furniture project."
              className="ml-2 hidden min-h-11 items-center rounded-[3px] bg-[#f1eee6] px-5 text-[12px] font-bold text-[#141612] transition duration-300 hover:-translate-y-0.5 hover:bg-white md:inline-flex"
            >
              Start a project <span className="ml-2" aria-hidden="true">↗</span>
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="ml-1 grid size-11 place-items-center border border-white/15 text-white xl:hidden"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-controls="mobile-site-navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        ref={menuPanelRef}
        id="mobile-site-navigation"
        className={cn(
          "fixed inset-0 z-[90] overflow-y-auto bg-[#11130f] text-[#f1eee6] transition-[opacity,visibility] duration-300 xl:hidden",
          menuOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-modal={menuOpen ? true : undefined}
        aria-label="Site navigation"
      >
        <div className="absolute inset-x-0 top-0 flex h-[var(--site-header-height)] items-center justify-between gap-4 border-b border-white/10 px-5 sm:px-10">
          <span className="text-sm font-bold">{settings.storeName}</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
            tabIndex={menuOpen ? 0 : -1}
            className="grid size-11 shrink-0 place-items-center border border-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex min-h-full flex-col justify-center px-7 pb-24 pt-28" aria-label="Mobile navigation">
          <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Navigate</p>
          {primaryLinks.map((link, index) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              className="mobile-nav-link group flex items-center justify-between border-b border-white/12 py-4 text-[clamp(1.65rem,9vw,2.4rem)] font-medium leading-none tracking-[-0.045em]"
              style={{ transitionDelay: `${index * 45}ms` }}
            >
              {link.label}
              <span className="text-base text-[#c5a274] transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span>
            </Link>
          ))}
          <div className="mt-8 flex flex-wrap gap-3 text-xs">
            <Link href={user ? "/account" : "/login"} onClick={() => setMenuOpen(false)} className="rounded-full border border-white/20 px-4 py-2.5">Account</Link>
            <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="rounded-full border border-white/20 px-4 py-2.5">Saved {wishlistCount > 0 ? `(${wishlistCount})` : ""}</Link>
            {!isAdmin && <Link href="/cart" onClick={() => setMenuOpen(false)} className="rounded-full border border-white/20 px-4 py-2.5">Cart {cartCount > 0 ? `(${cartCount})` : ""}</Link>}
          </div>
        </nav>
      </div>
    </>
  )
}
