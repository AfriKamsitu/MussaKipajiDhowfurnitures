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

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/shop", hasDropdown: true },
  { label: "New Arrivals", href: "/shop?sort=new" },
  { label: "Best Sellers", href: "/shop?sort=popular" },
  { label: "Offers", href: "/offers" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { cartCount, wishlistCount } = useStore()
  const { user } = useAuth()
  const [query, setQuery] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
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
    <header className="sticky top-0 z-50 bg-card shadow-sm">
      {/* Top bar */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:px-8">
          <button
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/paje-dhow-logo.png"
              alt="Paje Dhow Furniture logo"
              width={48}
              height={48}
              className="size-11 object-contain"
              priority
            />
            <span className="leading-tight">
              <span className="block text-base font-bold uppercase tracking-wide text-foreground">Paje Dhow</span>
              <span className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Furniture</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={onSearch} className="ml-2 hidden flex-1 items-center md:flex">
            <div className="flex w-full max-w-2xl items-center rounded-md border border-border bg-background">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for furniture..."
                className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-1 border-l border-border px-3 text-sm text-muted-foreground">
                All Categories
                <ChevronDown className="size-4" />
              </div>
              <button
                type="submit"
                aria-label="Search"
                className="m-1 flex items-center justify-center rounded-md bg-accent px-4 py-2 text-accent-foreground transition-colors hover:bg-accent/90"
              >
                <Search className="size-4" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-5">
            <Link href="/wishlist" className="relative flex flex-col items-center gap-0.5 text-foreground" aria-label="Wishlist">
              <span className="relative">
                <Heart className="size-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                    {wishlistCount}
                  </span>
                )}
              </span>
              <span className="hidden text-[11px] sm:block">Wishlist</span>
            </Link>
            <Link href="/cart" className="relative flex flex-col items-center gap-0.5 text-foreground" aria-label="Cart">
              <span className="relative">
                <ShoppingCart className="size-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                    {cartCount}
                  </span>
                )}
              </span>
              <span className="hidden text-[11px] sm:block">Cart</span>
            </Link>
            <Link
              href={user ? (user.role === "admin" ? "/admin" : "/account") : "/login"}
              className="flex flex-col items-center gap-0.5 text-foreground"
              aria-label={user ? "Account" : "Login"}
            >
              <User className="size-5" />
              <span className="hidden text-[11px] sm:block">
                {user ? (user.role === "admin" ? "Admin" : user.name.split(" ")[0] || "Account") : "Login"}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={onSearch} className="border-b border-border px-4 py-3 md:hidden">
        <div className="flex items-center rounded-md border border-border bg-background">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for furniture..."
            className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" aria-label="Search" className="m-1 rounded-md bg-accent px-3 py-2 text-accent-foreground">
            <Search className="size-4" />
          </button>
        </div>
      </form>

      {/* Nav bar */}
      <nav className="hidden border-b border-border lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-7 px-4 lg:px-8">
          {navLinks.map((link) => {
            const active =
              (link.label === "Home" && pathname === "/") ||
              (link.href !== "/" && pathname.startsWith(link.href.split("?")[0]) && link.href !== "/shop") ||
              (link.label === "Shop" && pathname === "/shop")
            if (link.hasDropdown) {
              return (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setCatOpen(true)}
                  onMouseLeave={() => setCatOpen(false)}
                >
                  <button
                    className={cn(
                      "flex items-center gap-1 border-b-2 py-3.5 text-sm font-medium transition-colors",
                      catOpen ? "border-accent text-accent" : "border-transparent text-foreground hover:text-accent",
                    )}
                  >
                    {link.label}
                    <ChevronDown className="size-3.5" />
                  </button>
                  {catOpen && (
                    <div className="absolute left-0 top-full z-50 grid w-56 gap-1 rounded-md border border-border bg-card p-2 shadow-lg">
                      {categories.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/shop?category=${c.slug}`}
                          className="flex items-center justify-between rounded px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary hover:text-accent"
                        >
                          {c.name}
                          <span className="text-xs text-muted-foreground">{c.count}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "flex items-center gap-1 border-b-2 py-3.5 text-sm font-medium transition-colors",
                  active ? "border-accent text-accent" : "border-transparent text-foreground hover:text-accent",
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
                className="rounded px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-accent"
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
