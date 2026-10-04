"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BadgePercent,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { MobileBuyerNav } from "@/components/mobile-buyer-nav"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { cn } from "@/lib/utils"
import { openWhatsApp } from "@/lib/whatsapp"

type NavItem = { label: string; href: string; icon: LucideIcon; badge?: number }

const ACTIVE_ORDER_STATUSES = new Set(["Pending", "Processing", "Shipped"])

function SidebarLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-10 items-center gap-3 px-3 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-secondary hover:text-primary",
      )}
    >
      <item.icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span
          className={cn(
            "flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-5 tracking-normal",
            active ? "bg-white/20 text-white" : "bg-primary text-primary-foreground",
          )}
        >
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      ) : null}
    </Link>
  )
}

/**
 * Buyer dashboard frame: a persistent sidebar on desktop (a drawer on phones),
 * a slim top bar with the page title, and the page content beside it.
 */
export function AccountShell({
  title,
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const { cartCount, wishlistCount } = useStore()
  const settings = useStoreSettings()
  const router = useRouter()
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=" + encodeURIComponent(pathname || "/account"))
    }
  }, [loading, pathname, router, user])

  useEffect(() => setDrawerOpen(false), [pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const trigger = menuButtonRef.current
    document.body.classList.add("sf-scroll-locked")
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("sf-scroll-locked")
      trigger?.focus()
    }
  }, [drawerOpen])

  if (loading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-6 animate-spin" />
        <span className="sr-only">Preparing your account</span>
      </div>
    )
  }

  const activeOrders = user.orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.status)).length
  const initials = (user.name || user.email)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const groups: { heading: string; items: NavItem[] }[] = [
    {
      heading: "My account",
      items: [
        { label: "Dashboard", href: "/account", icon: LayoutDashboard },
        { label: "Orders", href: "/account/orders", icon: Package, badge: activeOrders },
        { label: "Addresses", href: "/account/addresses", icon: MapPin },
        { label: "Profile", href: "/account/profile", icon: UserRound },
      ],
    },
    {
      heading: "Shopping",
      items: [
        { label: "Shop furniture", href: "/shop", icon: Store },
        { label: "Cart", href: "/cart", icon: ShoppingBag, badge: cartCount },
        { label: "Saved items", href: "/wishlist", icon: Heart, badge: wishlistCount },
        { label: "Offers", href: "/offers", icon: BadgePercent },
      ],
    },
  ]

  const isActive = (href: string) => (href === "/account" ? pathname === "/account" : pathname.startsWith(href))
  const closeDrawer = () => setDrawerOpen(false)

  function handleSignOut() {
    signOut()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen bg-muted text-foreground">
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={closeDrawer}
          className="sf-fade-in fixed inset-0 z-[90] bg-black/45 lg:hidden"
        />
      )}

      <aside
        id="account-sidebar"
        aria-label="Account navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-[95] flex w-[min(84vw,272px)] flex-col border-r border-border bg-card transition-[translate,visibility] duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:shrink-0 lg:translate-x-0",
          // Hidden as well as off-screen when closed, so its links cannot be tabbed to on phones.
          drawerOpen ? "translate-x-0" : "-translate-x-full max-lg:invisible",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
          <Link href="/" onClick={closeDrawer} className="flex min-w-0 items-center gap-2.5" aria-label={`${settings.storeName} home`}>
            <span className="relative size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
              <Image src={settings.logoUrl} alt="" fill unoptimized sizes="36px" className="object-cover" />
            </span>
            <span className="truncate text-[12px] font-medium uppercase tracking-[0.14em]">{settings.storeName}</span>
          </Link>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close menu"
            className="grid size-10 shrink-0 place-items-center text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {initials || "?"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.name || "Customer"}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.heading}>
              <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
                {group.heading}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarLink key={item.href} item={item} active={isActive(item.href)} onNavigate={closeDrawer} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-border p-3">
          <button
            type="button"
            onClick={() => openWhatsApp(`Hello ${settings.storeName}, I need help with my account or order.`)}
            className="flex min-h-10 w-full items-center gap-3 px-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/80 hover:bg-secondary hover:text-primary"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Get help
          </button>
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="flex min-h-10 items-center gap-3 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/80 hover:bg-secondary hover:text-primary"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              Admin panel
            </Link>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-10 w-full items-center gap-3 px-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-primary hover:bg-primary/10"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[80] flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-8">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open account menu"
            aria-expanded={drawerOpen}
            aria-controls="account-sidebar"
            className="-ml-2 grid size-10 place-items-center text-foreground hover:bg-secondary lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">My account</p>
            <h1 className="truncate text-lg font-light tracking-[0.01em] sm:text-xl">{title}</h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {actions}
            <Link href="/shop" className="sf-btn sf-btn-outline sf-btn-sm hidden sm:inline-flex">
              Continue shopping
            </Link>
            <Link
              href="/cart"
              aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
              className="relative grid size-10 place-items-center rounded-full hover:bg-secondary"
            >
              <ShoppingBag className="size-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-[17px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-[17px] text-primary-foreground">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-10 lg:px-8 lg:pt-7">
          <div className="mx-auto w-full max-w-[1160px]">{children}</div>
        </main>
      </div>

      <MobileBuyerNav />
    </div>
  )
}
