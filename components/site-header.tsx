"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { ChevronDown, Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchApi } from "@/lib/api"
import { normalizeCategory, type Category } from "@/lib/data"
import { useStore } from "@/components/store-provider"
import { useAuth } from "@/components/auth-provider"
import { ScrollProgress } from "@/components/scroll-progress"
import { useStoreSettings } from "@/components/store-settings-provider"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Shop", href: "/shop" },
  { label: "Offers", href: "/offers" },
  { label: "Contact", href: "/contact" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { cartCount, wishlistCount } = useStore()
  const { user } = useAuth()
  const storeSettings = useStoreSettings()
  const isAdmin = user?.role === "admin"
  const [query, setQuery] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/categories")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setCategories(list.map(normalizeCategory))
      })
      .catch(() => setCategories([]))
  }, [])

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : "/shop")
  }

  return (
    <header className="sticky top-0 z-[60] w-full max-w-[100vw] overflow-x-hidden bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <ScrollProgress />
      <div className="hidden border-b border-border bg-primary text-primary-foreground md:block">
        <div className="scrollbar-none mx-auto flex max-w-7xl items-center justify-end overflow-x-auto px-4 py-2 text-xs lg:px-8">
          <div className="flex shrink-0 items-center gap-4 whitespace-nowrap">
            <Link href="/shop" className="transition-colors hover:text-white/75">Featured selections</Link>
            <Link href="/contact" className="transition-colors hover:text-white/75">Custom orders</Link>
            <Link href={user ? (user.role === "admin" ? "/admin" : "/account") : "/register"} className="transition-colors hover:text-white/75">
              {user ? (user.role === "admin" ? "Admin" : "My Account") : "Create Account"}
            </Link>
            <Link href="/contact" className="transition-colors hover:text-white/75">Contact</Link>
            {!isAdmin && <Link href="/cart" className="transition-colors hover:text-white/75">Cart</Link>}
          </div>
        </div>
      </div>
      {/* Top bar */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-4 lg:px-8">
          <button
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>

          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label={`${storeSettings.storeName} home`}
          >
            <Image
              src={storeSettings.logoUrl}
              alt={`${storeSettings.storeName} logo`}
              width={72}
              height={72}
              className="size-12 rounded-full object-cover shadow-soft transition-transform duration-300 group-hover:scale-105 sm:size-16"
              priority
              unoptimized
            />
            <span className="hidden whitespace-nowrap text-sm font-bold uppercase tracking-[0.04em] text-foreground min-[480px]:block sm:text-base">
              {storeSettings.storeName}
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={onSearch} className={cn("ml-2 hidden flex-1 items-center", pathname === "/" ? "md:hidden" : "md:flex")}>
            <div className="flex w-full min-w-0 max-w-2xl items-center rounded-md border border-border bg-background">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for furniture..."
                className="w-0 min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-1 border-l border-border px-3 text-sm text-muted-foreground">
                All Categories
                <ChevronDown className="size-4" />
              </div>
              <button
                type="submit"
                aria-label="Search"
                className="interactive-press m-1 flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Search className="size-4" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-5 md:hidden">
            <Link href="/wishlist" className="relative flex flex-col items-center gap-0.5 text-foreground" aria-label="Wishlist">
              <span className="relative">
                <Heart className="size-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {wishlistCount}
                  </span>
                )}
              </span>
              <span className="hidden text-[11px] sm:block">Wishlist</span>
            </Link>
            {!isAdmin && (
              <Link href="/cart" className="relative flex flex-col items-center gap-0.5 text-foreground" aria-label="Cart">
                <span className="relative">
                  <ShoppingCart className="size-5" />
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {cartCount}
                    </span>
                  )}
                </span>
                <span className="hidden text-[11px] sm:block">Cart</span>
              </Link>
            )}
            <Link
              href={user ? (user.role === "admin" ? "/admin" : "/account") : "/login"}
              className="flex flex-col items-center gap-0.5 text-foreground"
              aria-label={user ? "Account" : "Create Account"}
            >
              <User className="size-5" />
              <span className="block max-w-16 truncate text-[10px] sm:text-[11px]">
                {user ? (user.role === "admin" ? "Admin" : user.name.split(" ")[0] || "Account") : "Create Account"}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Keep search lower in the homepage hero; other pages retain the compact mobile search. */}
      {pathname !== "/" && (
        <>
          <form onSubmit={onSearch} className="w-full border-b border-border px-3 py-2.5 md:hidden">
            <div className="flex w-full min-w-0 items-center rounded-lg border border-border bg-background">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for furniture..."
                className="w-0 min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" aria-label="Search" className="m-1 rounded-md bg-primary px-3 py-2 text-primary-foreground">
                <Search className="size-4" />
              </button>
            </div>
          </form>

          <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
            <Link
              href="/shop"
              className="interactive-press shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                className="interactive-press shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Nav bar */}
      <nav className="hidden border-b border-border lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-7 px-4 lg:px-8">
          {navLinks.map((link) => {
            const active =
              (link.label === "Home" && pathname === "/") ||
              (link.href !== "/" && pathname.startsWith(link.href.split("?")[0]) && link.href !== "/shop") ||
              (link.label === "Shop" && pathname === "/shop")
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "flex items-center gap-1 border-b-2 py-3.5 text-sm font-medium transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-foreground hover:text-primary",
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-b border-border bg-card lg:hidden">
          <div className="grid gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
