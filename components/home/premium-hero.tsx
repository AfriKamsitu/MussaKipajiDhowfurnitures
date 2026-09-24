"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  ClipboardCheck,
  Headphones,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react"
import { fetchApi } from "@/lib/api"
import { normalizeCategory, type Category } from "@/lib/data"

const fallbackCategories: Category[] = [
  { id: "sofas", name: "Sofas & seating", slug: "sofas", image: "/sofa-minimalist.png", count: 0 },
  { id: "chairs", name: "Chairs", slug: "chairs", image: "/chair.png", count: 0 },
  { id: "tables", name: "Tables", slug: "tables", image: "/coffee-table.png", count: 0 },
  { id: "dining", name: "Dining furniture", slug: "dining", image: "/dining-set.png", count: 0 },
  { id: "beds", name: "Beds & bedroom", slug: "beds", image: "/bed-king.png", count: 0 },
  { id: "outdoor", name: "Outdoor furniture", slug: "outdoor", image: "/outdoor.png", count: 0 },
  { id: "office", name: "Office furniture", slug: "office", image: "/office-furniture.png", count: 0 },
  { id: "storage", name: "Storage", slug: "storage", image: "/wardrobe.png", count: 0 },
]

const sourcingPoints = [
  { icon: BadgeCheck, label: "Verified workshop" },
  { icon: PackageCheck, label: "Low minimum orders" },
  { icon: Truck, label: "Delivery coordination" },
]

export function PremiumHero() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [request, setRequest] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [categories, setCategories] = useState<Category[]>(fallbackCategories)

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/categories")
      .then((payload) => {
        const loaded = (Array.isArray(payload) ? payload : []).map(normalizeCategory)
        if (loaded.length > 0) setCategories(loaded)
      })
      .catch(() => undefined)
  }, [])

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    router.push(value ? "/shop?q=" + encodeURIComponent(value) : "/shop")
  }

  function submitQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const item = request.trim()
    if (!item) return
    const details = [
      "Quotation request",
      "Item needed: " + item,
      "Quantity: " + Math.max(1, Number(quantity) || 1),
      "Please share price, production time, available finishes, and delivery options.",
    ].join("\n")
    router.push("/contact?request=" + encodeURIComponent(details))
  }

  return (
    <section className="relative overflow-hidden border-b border-black/5 bg-white px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(117,75,51,0.08),transparent_66%)]" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1500px]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px] xl:grid-cols-[250px_minmax(0,1fr)_310px]">
          <aside className="motion-enter hidden overflow-hidden rounded-[1.35rem] border border-border bg-white shadow-[0_16px_42px_-34px_rgba(51,35,24,0.52)] xl:block" aria-label="Product categories">
            <div className="flex h-12 items-center justify-between border-b border-border bg-[#faf8f5] px-4">
              <h2 className="text-sm font-black text-foreground">Shop by category</h2>
              <Link href="/shop" className="text-[11px] font-bold text-primary hover:underline">View all</Link>
            </div>
            <nav className="p-2">
              {categories.slice(0, 9).map((category) => (
                <Link
                  key={category.slug}
                  href={"/shop?category=" + encodeURIComponent(category.slug)}
                  className="group flex min-h-10 items-center justify-between rounded-lg px-3 text-[13px] font-semibold text-foreground/80 transition-all hover:translate-x-0.5 hover:bg-secondary hover:text-primary"
                >
                  <span className="truncate">{category.name}</span>
                  <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </nav>
            <div className="mx-3 mt-1 border-t border-border px-1 py-3">
              <Link href="/contact" className="inline-flex items-center gap-2 text-xs font-black text-primary hover:underline">
                Need something custom?
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </aside>

          <div className="motion-enter relative min-h-[430px] overflow-hidden rounded-[1.6rem] bg-[#2f291f] shadow-[0_24px_60px_-32px_rgba(46,31,20,0.55)] [animation-delay:80ms] sm:min-h-[470px]">
            <Image
              src="/paje-dhow-dining-table-hero.jpg"
              alt="Handcrafted wooden dining furniture made in Zanzibar"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover transition-transform duration-[1400ms] ease-out hover:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,20,15,0.88)_0%,rgba(25,20,15,0.68)_46%,rgba(25,20,15,0.16)_78%,rgba(25,20,15,0.08)_100%)]" />
            <div className="relative flex min-h-[430px] max-w-[650px] flex-col justify-center p-6 text-white sm:min-h-[470px] sm:p-10 lg:p-12">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur-md">
                <BadgeCheck className="size-4 text-[#f3c69d]" />
                Verified Zanzibar workshop
              </span>
              <h1 className="mt-5 max-w-[11ch] text-balance text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-[3.7rem]">
                Source furniture made for your space.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-white/78 sm:text-base sm:leading-7">
                Discover ready-to-order pieces, compare materials and minimum quantities, or send one clear request for a custom home or hospitality project.
              </p>

              <form onSubmit={submitSearch} className="search-orbit mt-7 flex max-w-xl items-center rounded-full bg-white p-1.5 shadow-2xl" role="search">
                <Search className="ml-3 size-4.5 shrink-0 text-muted-foreground" />
                <label className="sr-only" htmlFor="hero-product-search">Search products</label>
                <input
                  id="hero-product-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="What furniture are you looking for?"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button type="submit" className="flex min-h-10 shrink-0 items-center rounded-full bg-primary px-5 text-xs font-black text-primary-foreground transition-colors hover:bg-accent">
                  Find products
                </button>
              </form>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {sourcingPoints.map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/82">
                    <Icon className="size-4 text-[#f3c69d]" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="motion-enter rounded-[1.35rem] border border-border bg-white p-5 shadow-[0_18px_48px_-34px_rgba(51,35,24,0.55)] [animation-delay:160ms] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Fast sourcing</p>
                <h2 className="mt-1.5 text-xl font-black leading-tight text-foreground">Request a quotation</h2>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardCheck className="size-5" />
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Tell the workshop what you need once. We will reply with pricing, finishes, timing, and delivery options.
            </p>

            <form onSubmit={submitQuote} className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Furniture or project need</span>
                <textarea
                  required
                  rows={4}
                  value={request}
                  onChange={(event) => setRequest(event.target.value)}
                  placeholder="Example: 8 solid-wood dining chairs for a hotel"
                  className="w-full resize-none rounded-xl border border-input bg-[#fafafa] px-3.5 py-3 text-xs leading-5 text-foreground outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-[#fafafa] px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                />
              </label>
              <button type="submit" className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-black text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:shadow-md">
                Request price
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-foreground/75">
                <ShieldCheck className="size-4 text-emerald-600" />
                Direct response from the workshop
              </p>
              <p className="flex items-center gap-2 text-[11px] font-semibold text-foreground/75">
                <Headphones className="size-4 text-primary" />
                Real help before and after ordering
              </p>
            </div>
          </aside>
        </div>

        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1 xl:hidden" aria-label="Popular categories">
          {categories.slice(0, 8).map((category, index) => (
            <Link
              key={category.slug}
              href={"/shop?category=" + encodeURIComponent(category.slug)}
              className="category-float flex min-w-36 shrink-0 items-center gap-3 rounded-xl border border-border bg-white p-2.5 shadow-[0_10px_30px_-26px_rgba(51,35,24,0.5)]"
              style={{ "--stagger-index": index } as React.CSSProperties}
            >
              <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                <Image src={category.image || "/placeholder.svg"} alt="" fill sizes="40px" className="object-contain p-1" />
              </span>
              <span className="line-clamp-2 text-xs font-black leading-4 text-foreground">{category.name}</span>
            </Link>
          ))}
        </div>

        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-[#faf8f5] px-4 py-3 text-xs sm:flex-row sm:items-center">
          <p className="inline-flex items-center gap-2 font-bold text-foreground">
            <Sparkles className="size-4 text-primary" />
            Buying for a villa, hotel, or restaurant?
          </p>
          <Link href="/contact?request=I need help sourcing furniture for a hospitality or commercial project." className="inline-flex items-center gap-1.5 font-black text-primary hover:underline">
            Talk to the project team
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}