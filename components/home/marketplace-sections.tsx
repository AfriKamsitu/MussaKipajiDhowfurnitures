"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BadgeCheck,
  Boxes,
  ClipboardList,
  Headphones,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react"
import { fetchApi } from "@/lib/api"
import { normalizeCategory, type Category } from "@/lib/data"

const shortcuts = [
  { label: "New arrivals", href: "/shop?sort=newest", icon: Sparkles },
  { label: "Ready to deliver", href: "/shop", icon: Truck },
  { label: "Custom furniture", href: "/contact", icon: ClipboardList },
  { label: "Top categories", href: "/shop", icon: Boxes },
]

const protections = [
  {
    title: "Order protection",
    desc: "Get support from first contact to delivery.",
    icon: ShieldCheck,
  },
  {
    title: "Verified inventory",
    desc: "Browse products managed from your backend.",
    icon: BadgeCheck,
  },
  {
    title: "Furniture support",
    desc: "Ask about size, material, delivery and setup.",
    icon: Headphones,
  },
  {
    title: "Delivery coordination",
    desc: "Confirm stock and delivery before purchase.",
    icon: PackageCheck,
  },
]

export function MarketplaceSections() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/categories")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setCategories(list.map(normalizeCategory).slice(0, 8))
      })
      .catch(() => setCategories([]))
  }, [])

  return (
    <div className="grid gap-4">
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <item.icon className="size-5" />
            </span>
            <span className="text-sm font-bold text-foreground">{item.label}</span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Featured selections</p>
              <h2 className="text-xl font-bold text-foreground">Source furniture by room</h2>
            </div>
            <Link href="/shop" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="rounded-md border border-border bg-secondary/55 px-3 py-3 transition-colors hover:border-primary/40 hover:bg-primary/10"
              >
                <p className="line-clamp-1 text-sm font-bold text-foreground">{cat.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{cat.count} products</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary p-4 text-primary-foreground shadow-elevated">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/80">Custom order</p>
          <h2 className="mt-1 text-xl font-bold">Tell us what furniture you need</h2>
          <div className="mt-4 grid gap-2">
            <Link
              href="/shop"
              className="flex items-center gap-2 rounded-md bg-primary-foreground px-3 py-2.5 text-sm font-semibold text-foreground"
            >
              <Search className="size-4" />
              Search available products
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-primary-foreground/35 px-3 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-primary-foreground/10"
            >
              Request custom quotation
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {protections.map((item) => (
          <div key={item.title} className="rounded-lg border border-border bg-card p-4 shadow-soft">
            <span className="flex size-10 items-center justify-center rounded-md bg-accent/12 text-accent">
              <item.icon className="size-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-foreground">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
