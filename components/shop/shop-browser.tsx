"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { BadgeCheck, Boxes, ChevronDown, ChevronLeft, ChevronRight, PackageCheck, SlidersHorizontal } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { fetchApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useStoreSettings } from "@/components/store-settings-provider"
import { normalizeCategory, normalizeProduct, formatPrice, type Category, type Product, type SpringPage } from "@/lib/data"

const sortOptions = ["Latest", "Price: Low to High", "Price: High to Low", "Top Rated"]

const colorSwatches = [
  { name: "Natural Teak", value: "#c8902f" },
  { name: "Dark Mahogany", value: "#3b2f2a" },
  { name: "Weathered Grey", value: "#9ca3af" },
  { name: "Ocean Blue", value: "#1e3a5f" },
  { name: "Forest Green", value: "#2f5233" },
]

const materials = ["Reclaimed Wood", "Teak", "Mahogany", "Hardwood"]
const PAGE_SIZE = 20

export function ShopBrowser() {
  const { currency } = useStoreSettings()
  const params = useSearchParams()
  const query = params.get("q")?.toLowerCase() ?? ""
  const paramSort = params.get("sort")
  const paramCategory = params.get("category")

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [activeColor, setActiveColor] = useState<string | null>(null)
  const [activeMaterials, setActiveMaterials] = useState<string[]>([])
  const [sort, setSort] = useState(
    paramSort === "new" ? "Latest" : paramSort === "popular" ? "Top Rated" : "Latest",
  )
  const [sortOpen, setSortOpen] = useState(false)

  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [readyToOrderOnly, setReadyToOrderOnly] = useState(false)
  const [lowMoqOnly, setLowMoqOnly] = useState(false)
  const featuredRailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/categories")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setCategories(list.map(normalizeCategory))
      })
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    params.set("size", "100")
    const qs = params.toString()
    fetchApi<SpringPage<Record<string, unknown>>>(`/api/products${qs ? `?${qs}` : ""}`)
      .then((payload) => {
        const content = Array.isArray(payload?.content) ? payload.content : []
        setProducts(content.map(normalizeProduct))
      })
      .catch(() => setProducts([]))
  }, [query])

  useEffect(() => {
    if (paramCategory && categories.some((category) => category.slug === paramCategory)) {
      setActiveCategory(paramCategory)
    }
  }, [categories, paramCategory])

  const searching = query.length > 0
  const activeCategoryName = searching
    ? `Results for “${query}”`
    : activeCategory === "all"
      ? "All Products"
      : (categories.find((c) => c.slug === activeCategory)?.name ?? "All Products")

  function toggleMaterial(m: string) {
    setActiveMaterials((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    )
  }

  const filtered = useMemo(() => {
    let list = searching
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.material.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.supplier?.name.toLowerCase().includes(query),
        )
      : activeCategory === "all"
        ? products
        : products.filter((p) => p.category === activeCategory)
    if (maxPrice != null) list = list.filter((p) => p.price <= maxPrice)
    if (activeColor) list = list.filter((p) => p.colors.includes(activeColor))
    if (activeMaterials.length > 0) list = list.filter((p) => activeMaterials.includes(p.material))
    if (verifiedOnly) list = list.filter((p) => Boolean(p.supplier?.verified))
    if (readyToOrderOnly) {
      list = list.filter((p) => p.inStock ?? (p.stock == null || p.stock > 0))
    }
    if (lowMoqOnly) list = list.filter((p) => Math.max(1, p.moq ?? 1) <= 2)

    const sorted = [...list]
    if (sort === "Price: Low to High") sorted.sort((a, b) => a.price - b.price)
    else if (sort === "Price: High to Low") sorted.sort((a, b) => b.price - a.price)
    else if (sort === "Top Rated") sorted.sort((a, b) => b.rating - a.rating)
    return sorted
  }, [activeCategory, maxPrice, activeColor, activeMaterials, verifiedOnly, readyToOrderOnly, lowMoqOnly, sort, query, searching, products])

  const priceCeiling = useMemo(() => {
    const highest = products.reduce((maximum, product) => Math.max(maximum, product.price), 100000)
    return Math.max(100000, Math.ceil(highest / 50000) * 50000)
  }, [products])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filtered.length)
  const visibleProducts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const activeFilterCount =
    (activeCategory !== "all" ? 1 : 0) +
    (maxPrice != null && maxPrice < priceCeiling ? 1 : 0) +
    (activeColor ? 1 : 0) +
    activeMaterials.length +
    (verifiedOnly ? 1 : 0) +
    (readyToOrderOnly ? 1 : 0) +
    (lowMoqOnly ? 1 : 0)

  function scrollFeatured(direction: -1 | 1) {
    featuredRailRef.current?.scrollBy({
      left: direction * Math.min(featuredRailRef.current.clientWidth * 0.82, 760),
      behavior: "smooth",
    })
  }

  function clearAllFilters() {
    setActiveCategory("all")
    setMaxPrice(null)
    setActiveColor(null)
    setActiveMaterials([])
    setVerifiedOnly(false)
    setReadyToOrderOnly(false)
    setLowMoqOnly(false)
    setPage(1)
  }


  useEffect(() => {
    setPage(1)
  }, [activeCategory, activeColor, activeMaterials, verifiedOnly, readyToOrderOnly, lowMoqOnly, maxPrice, query, sort])

  return (
    <div className="shop-editorial-browser grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)] xl:gap-7">
      <div className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 sm:-mx-6 sm:px-6 xl:hidden">
        <button
          onClick={() => {
            setActiveCategory("all")
            setPage(1)
          }}
          className={cn(
            "min-h-11 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
            activeCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-foreground",
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => {
              setActiveCategory(cat.slug)
              setPage(1)
            }}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
              activeCategory === cat.slug
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card text-foreground",
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Mobile filter toggle */}
      <button
        onClick={() => setFiltersOpen((v) => !v)}
        className="sticky top-[112px] z-20 flex min-h-11 items-center justify-between gap-3 rounded-full border border-border bg-white/95 px-4 py-2.5 text-sm font-bold text-foreground shadow-soft backdrop-blur xl:hidden"
        aria-expanded={filtersOpen}
        aria-controls="shop-filters"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          {filtersOpen ? "Close filters" : "Filters"}
        </span>
        {activeFilterCount > 0 && (
          <span className="flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Sidebar */}
      <aside id="shop-filters" className={cn("space-y-5 xl:sticky xl:top-36 xl:block xl:self-start", filtersOpen ? "block" : "hidden")}>
        <div className="surface-premium rounded-[1.5rem] p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-foreground">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-full px-2 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary/10"
              >
                Clear all
              </button>
            )}
          </div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Categories</p>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => {
                  setActiveCategory("all")
                  setPage(1)
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                  activeCategory === "all"
                    ? "bg-primary font-bold text-primary-foreground"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                <span>All products</span>
                <span className="text-xs opacity-70">{products.length}</span>
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.slug}>
                <button
                  onClick={() => {
                    setActiveCategory(cat.slug)
                    setPage(1)
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    activeCategory === cat.slug
                      ? "bg-sidebar-accent font-medium text-accent"
                      : "text-foreground hover:bg-secondary",
                  )}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-premium rounded-[1.5rem] p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Filter by Price</h3>
          <input
            type="range"
            min={0}
            max={priceCeiling}
            step={50000}
            value={maxPrice ?? priceCeiling}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
            aria-label="Maximum price"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Up to {formatPrice(maxPrice ?? priceCeiling, currency)}
          </p>
          {maxPrice != null && maxPrice < priceCeiling && (
            <button
              type="button"
              onClick={() => setMaxPrice(null)}
              className="mt-3 w-full rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Clear price filter
            </button>
          )}
        </div>

        <div className="surface-premium rounded-[1.5rem] p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Color</h3>
          <div className="flex flex-wrap gap-3">
            {colorSwatches.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveColor((prev) => (prev === c.value ? null : c.value))}
                aria-label={c.name}
                className={cn(
                  "size-11 rounded-full border-2 transition-all xl:size-9",
                  activeColor === c.value ? "border-accent ring-2 ring-accent/30" : "border-border",
                )}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        <div className="surface-premium rounded-[1.5rem] p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Material</h3>
          <ul className="space-y-2.5">
            {materials.map((m) => (
              <li key={m}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={activeMaterials.includes(m)}
                    onChange={() => toggleMaterial(m)}
                    className="size-4 rounded border-border accent-[var(--accent)]"
                  />
                  {m}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0">
        <div className="mb-5 flex flex-col gap-3 rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-[0_18px_45px_-36px_rgba(62,67,48,0.5)] sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h2 className="text-xl font-black text-foreground sm:text-2xl">{activeCategoryName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Showing {pageStart}-{pageEnd} of {filtered.length} results
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
            <div className="relative">
              <span className="mr-2 hidden text-sm text-muted-foreground sm:inline">Sort by:</span>
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                aria-expanded={sortOpen}
                aria-controls="shop-sort-options"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-xs font-black text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:text-sm"
              >
                {sort}
                <ChevronDown className="size-4" />
              </button>
              {sortOpen && (
                <ul id="shop-sort-options" className="absolute right-0 z-10 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-elevated">
                  {sortOptions.map((opt) => (
                    <li key={opt}>
                      <button
                        onClick={() => {
                          setSort(opt)
                          setSortOpen(false)
                        }}
                        className={cn(
                          "block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-secondary",
                          sort === opt && "font-medium text-accent",
                        )}
                      >
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {products.length > 0 && !searching && activeCategory === "all" && (
          <section className="mb-5 overflow-hidden rounded-[1.25rem] border border-black/8 bg-white shadow-[0_18px_45px_-38px_rgba(17,19,15,0.6)]" aria-labelledby="selected-for-you-title">
            <div className="flex items-end justify-between gap-4 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-accent sm:text-[10px]">Curated from the workshop</p>
                <h2 id="selected-for-you-title" className="mt-1 text-xl font-black tracking-[-0.035em] text-foreground sm:text-2xl">Selected for you</h2>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <button type="button" onClick={() => scrollFeatured(-1)} aria-label="Scroll selected products left" className="grid size-11 place-items-center rounded-full border border-border bg-white text-foreground transition hover:-translate-y-0.5 hover:border-primary/35 hover:text-primary">
                  <ChevronLeft className="size-4" />
                </button>
                <button type="button" onClick={() => scrollFeatured(1)} aria-label="Scroll selected products right" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground transition hover:-translate-y-0.5 hover:bg-accent">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
            <div ref={featuredRailRef} className="scrollbar-none flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-4 sm:gap-3 sm:px-5 sm:pb-5">
              {products.slice(0, 8).map((product) => (
                <div key={`featured-${product.id}`} className="w-[43vw] min-w-[148px] max-w-[185px] shrink-0 snap-start sm:w-[190px] sm:max-w-none lg:w-[205px]">
                  <ProductCard product={product} layout="compact" />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="scrollbar-none mb-5 flex gap-2 overflow-x-auto rounded-[1.1rem] border border-border bg-white p-2.5 shadow-[0_12px_34px_-30px_rgba(58,38,24,0.5)]" aria-label="Buyer sourcing filters">
          <button
            type="button"
            onClick={() => setVerifiedOnly((value) => !value)}
            aria-pressed={verifiedOnly}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-black transition-all",
              verifiedOnly ? "border-sky-600 bg-sky-50 text-sky-700" : "border-border bg-white text-foreground hover:border-primary/35",
            )}
          >
            <BadgeCheck className={cn("size-4", verifiedOnly && "fill-sky-600 text-white")} />
            Verified supplier
          </button>
          <button
            type="button"
            onClick={() => setReadyToOrderOnly((value) => !value)}
            aria-pressed={readyToOrderOnly}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-black transition-all",
              readyToOrderOnly ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border bg-white text-foreground hover:border-primary/35",
            )}
          >
            <PackageCheck className="size-4" />
            Ready to order
          </button>
          <button
            type="button"
            onClick={() => setLowMoqOnly((value) => !value)}
            aria-pressed={lowMoqOnly}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-black transition-all",
              lowMoqOnly ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-foreground hover:border-primary/35",
            )}
          >
            <Boxes className="size-4" />
            Low minimum order
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="surface-premium rounded-2xl p-14 text-center text-muted-foreground">
            No products match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-7 lg:grid-cols-4 min-[1880px]:grid-cols-5">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Product pages">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border text-sm transition-all hover:-translate-y-0.5",
                currentPage === p
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary",
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={currentPage >= totalPages}
            className="flex min-h-11 items-center gap-1 rounded-full border border-border bg-white px-4 py-2 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronDown className="size-4 -rotate-90" />
          </button>
        </nav>
        )}
      </div>
    </div>
  )
}
