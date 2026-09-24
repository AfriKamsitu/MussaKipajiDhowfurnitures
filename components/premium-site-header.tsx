"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Globe2,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ScrollProgress } from "@/components/scroll-progress"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { fetchApi } from "@/lib/api"
import { normalizeCategory, type Category } from "@/lib/data"
import { cn } from "@/lib/utils"

const marketplaceLinks = [
  { label: "All products", href: "/shop" },
  { label: "Top picks", href: "/shop?sort=popular" },
  { label: "New arrivals", href: "/shop?sort=new" },
  { label: "Offers", href: "/offers" },
  {
    label: "Custom orders",
    href: "/contact?request=I would like a quotation for custom-made furniture.",
  },
  { label: "Buyer guide", href: "/about" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { cartCount, wishlistCount } = useStore()
  const { user } = useAuth()
  const settings = useStoreSettings()
  const [query, setQuery] = useState("")
  const [searchScope, setSearchScope] = useState("Products")
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const isAdmin = user?.role === "admin"

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/categories")
      .then((payload) => setCategories((Array.isArray(payload) ? payload : []).map(normalizeCategory)))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => setMenuOpen(false), [pathname])

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    router.push(value ? "/shop?q=" + encodeURIComponent(value) : "/shop")
  }

  function isActive(href: string) {
    const route = href.split("?")[0]
    if (route === "/") return pathname === "/"
    if (route === "/shop") return pathname.startsWith("/shop") || pathname.startsWith("/product")
    return pathname.startsWith(route)
  }

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-black/7 bg-white/95 shadow-[0_10px_32px_-30px_rgba(43,34,27,0.5)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/90">
      <ScrollProgress />

      <div className="hidden border-b border-black/6 bg-[#fafafa] md:block">
        <div className="mx-auto flex h-8 max-w-[1500px] items-center justify-between px-6 text-[11px] text-muted-foreground lg:px-8">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/80">
              <MapPin className="size-3.5 text-primary" />
              Deliver to Zanzibar
            </span>
            <span className="hidden items-center gap-1.5 lg:inline-flex">
              <Globe2 className="size-3.5" />
              English · TZS
            </span>
          </div>
          <nav className="flex items-center gap-5" aria-label="Buyer support">
            <Link href="/about" className="transition-colors hover:text-primary">How to buy</Link>
            <Link href="/contact" className="inline-flex items-center gap-1 transition-colors hover:text-primary">
              <CircleHelp className="size-3.5" /> Help center
            </Link>
            <Link href={user ? "/account/orders" : "/login"} className="transition-colors hover:text-primary">
              Track an order
            </Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:border-primary/30 hover:bg-secondary lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label={settings.storeName + " home"}>
          <Image
            src={settings.logoUrl}
            alt={settings.storeName + " logo"}
            width={52}
            height={52}
            className="size-10 rounded-full object-cover ring-1 ring-black/8 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:size-11"
            priority
            unoptimized
          />
          <span className="hidden max-w-44 sm:block">
            <span className="block truncate text-sm font-black tracking-[-0.02em] text-foreground lg:text-base">
              {settings.storeName}
            </span>
            <span className="mt-0.5 block truncate text-[10px] font-medium text-muted-foreground">
              Zanzibar furniture marketplace
            </span>
          </span>
        </Link>

        <form onSubmit={submitSearch} className="hidden min-w-0 flex-1 lg:block" role="search">
          <div className="mx-auto flex h-12 max-w-3xl items-center overflow-hidden rounded-full border-2 border-primary bg-white shadow-[0_10px_30px_-24px_rgba(117,75,51,0.65)] transition-shadow focus-within:shadow-[0_14px_34px_-22px_rgba(117,75,51,0.7)]">
            <label className="sr-only" htmlFor="desktop-marketplace-search">Search the furniture marketplace</label>
            <div className="relative ml-1 hidden h-9 items-center border-r border-border sm:flex">
              <select
                value={searchScope}
                onChange={(event) => setSearchScope(event.target.value)}
                className="h-full appearance-none bg-transparent pl-4 pr-8 text-xs font-bold text-foreground outline-none"
                aria-label="Search type"
              >
                <option>Products</option>
                <option>Materials</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
            </div>
            <Search className="ml-4 size-4.5 shrink-0 text-muted-foreground" />
            <input
              id="desktop-marketplace-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={"Search " + searchScope.toLowerCase() + ", styles, or furniture"}
              className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="mr-1.5 inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-black text-primary-foreground transition-all duration-300 hover:bg-accent hover:shadow-md"
            >
              <Search className="size-4" />
              Search
            </button>
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link
            href={user ? (isAdmin ? "/admin" : "/account") : "/login"}
            className="group flex min-w-10 items-center gap-2 rounded-xl px-2 py-2 text-foreground transition-colors hover:bg-secondary hover:text-primary"
            aria-label={isAdmin ? "Admin workspace" : user ? "Buyer account" : "Sign in"}
          >
            <UserRound className="size-5" />
            <span className="hidden text-left xl:block">
              <span className="block text-[10px] font-medium text-muted-foreground">{isAdmin ? "Manage" : user ? "Welcome back" : "Hello, sign in"}</span>
              <span className="block text-xs font-black">{isAdmin ? "Admin" : "Account"}</span>
            </span>
          </Link>
          <Link
            href="/contact"
            className="hidden min-w-10 items-center gap-2 rounded-xl px-2 py-2 text-foreground transition-colors hover:bg-secondary hover:text-primary md:flex"
            aria-label="Messages and inquiries"
          >
            <MessageCircle className="size-5" />
            <span className="hidden text-xs font-black xl:block">Messages</span>
          </Link>
          <Link
            href={user ? "/account/orders" : "/login"}
            className="hidden min-w-10 items-center gap-2 rounded-xl px-2 py-2 text-foreground transition-colors hover:bg-secondary hover:text-primary md:flex"
            aria-label="Orders"
          >
            <ClipboardList className="size-5" />
            <span className="hidden text-xs font-black xl:block">Orders</span>
          </Link>
          <Link
            href="/wishlist"
            className="relative hidden min-w-10 items-center justify-center rounded-xl px-2 py-2 text-foreground transition-colors hover:bg-secondary hover:text-primary sm:flex"
            aria-label="Saved products"
          >
            <Heart className="size-5" />
            {wishlistCount > 0 && (
              <span className="absolute right-0 top-0 flex size-[17px] items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Link>
          {!isAdmin && (
            <Link
              href="/cart"
              className="relative flex min-w-10 items-center gap-2 rounded-xl px-2 py-2 text-foreground transition-colors hover:bg-secondary hover:text-primary"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="size-5" />
              <span className="hidden text-xs font-black xl:block">Cart</span>
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex size-[17px] items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 lg:hidden">
        <form onSubmit={submitSearch} role="search" className="mx-auto flex h-11 max-w-2xl items-center rounded-full border-2 border-primary bg-white pl-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <label className="sr-only" htmlFor="mobile-marketplace-search">Search furniture</label>
          <input
            id="mobile-marketplace-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search furniture and materials"
            className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className="mr-1 flex h-8 items-center rounded-full bg-primary px-4 text-xs font-black text-primary-foreground">
            Search
          </button>
        </form>
      </div>

      <nav className="hidden border-t border-black/6 lg:block" aria-label="Marketplace navigation">
        <div className="mx-auto flex h-11 max-w-[1500px] items-center gap-1 overflow-hidden px-8">
          <Link
            href="/shop"
            className="mr-2 inline-flex h-8 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-black text-primary-foreground transition-colors hover:bg-accent"
          >
            <Menu className="size-4" />
            All categories
          </Link>
          {marketplaceLinks.slice(1).map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "flex h-8 shrink-0 items-center rounded-lg px-3 text-xs font-bold transition-colors",
                isActive(link.href) ? "bg-secondary text-primary" : "text-foreground/75 hover:bg-secondary hover:text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="ml-auto shrink-0 text-xs font-black text-primary hover:underline">
            Request quotation
          </Link>
        </div>
      </nav>

      {menuOpen && (
        <nav className="border-t border-border bg-white px-4 py-4 shadow-elevated lg:hidden" aria-label="Mobile navigation">
          <div className="grid grid-cols-2 gap-2">
            {marketplaceLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "flex min-h-11 items-center justify-between rounded-xl border px-3 text-xs font-black transition-colors",
                  isActive(link.href) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground hover:bg-secondary",
                )}
              >
                {link.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          {categories.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Popular categories</p>
              <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category.slug}
                    href={"/shop?category=" + encodeURIComponent(category.slug)}
                    className="shrink-0 rounded-full border border-border bg-background px-3 py-2 text-xs font-bold text-foreground"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}