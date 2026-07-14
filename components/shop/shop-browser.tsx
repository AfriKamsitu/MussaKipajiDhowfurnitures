"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronDown, LayoutGrid, List, SlidersHorizontal } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { fetchApi } from "@/lib/api"
import { cn } from "@/lib/utils"
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

export function ShopBrowser() {
  const params = useSearchParams()
  const query = params.get("q")?.toLowerCase() ?? ""
  const paramSort = params.get("sort")
  const paramCategory = params.get("category")

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState("sofas")
  const [maxPrice, setMaxPrice] = useState(2000000)
  const [activeColor, setActiveColor] = useState<string | null>(null)
  const [activeMaterials, setActiveMaterials] = useState<string[]>([])
  const [sort, setSort] = useState(
    paramSort === "new" ? "Latest" : paramSort === "popular" ? "Top Rated" : "Latest",
  )
  const [sortOpen, setSortOpen] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

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
    if (paramCategory) params.set("category", paramCategory)
    if (query) params.set("q", query)
    params.set("size", "48")
    const qs = params.toString()
    fetchApi<SpringPage<Record<string, unknown>>>(`/api/products${qs ? `?${qs}` : ""}`)
      .then((payload) => {
        const content = Array.isArray(payload?.content) ? payload.content : []
        setProducts(content.map(normalizeProduct))
        if (paramCategory && categories.some((c) => c.slug === paramCategory)) {
          setActiveCategory(paramCategory)
        }
      })
      .catch(() => setProducts([]))
  }, [paramCategory, categories, query])

  const searching = query.length > 0
  const activeCategoryName = searching
    ? `Results for “${query}”`
    : (categories.find((c) => c.slug === activeCategory)?.name ?? "All Products")

  function toggleMaterial(m: string) {
    setActiveMaterials((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    )
  }

  const filtered = useMemo(() => {
    let list = searching
      ? products.filter(
          (p) => p.name.toLowerCase().includes(query) || p.material.toLowerCase().includes(query),
        )
      : products.filter((p) => p.category === activeCategory)
    if (list.length === 0 && !searching) list = products
    list = list.filter((p) => p.price <= maxPrice)
    if (activeColor) list = list.filter((p) => p.colors.includes(activeColor))
    if (activeMaterials.length > 0) list = list.filter((p) => activeMaterials.includes(p.material))

    const sorted = [...list]
    if (sort === "Price: Low to High") sorted.sort((a, b) => a.price - b.price)
    else if (sort === "Price: High to Low") sorted.sort((a, b) => b.price - a.price)
    else if (sort === "Top Rated") sorted.sort((a, b) => b.rating - a.rating)
    return sorted
  }, [activeCategory, maxPrice, activeColor, activeMaterials, sort, query, searching, products])

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
      {/* Mobile filter toggle */}
      <button
        onClick={() => setFiltersOpen((v) => !v)}
        className="flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        {filtersOpen ? "Hide Filters" : "Show Filters"}
      </button>

      {/* Sidebar */}
      <aside className={cn("space-y-6 lg:block", filtersOpen ? "block" : "hidden")}>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Categories</h3>
          <ul className="space-y-1">
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

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Filter by Price</h3>
          <input
            type="range"
            min={100000}
            max={2000000}
            step={50000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
            aria-label="Maximum price"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            TZS 100,000 - {formatPrice(maxPrice).replace("TZS ", "TZS ")}
          </p>
          <button className="mt-3 w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
            Apply
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Color</h3>
          <div className="flex flex-wrap gap-3">
            {colorSwatches.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveColor((prev) => (prev === c.value ? null : c.value))}
                aria-label={c.name}
                className={cn(
                  "size-7 rounded-full border-2 transition-all",
                  activeColor === c.value ? "border-accent ring-2 ring-accent/30" : "border-border",
                )}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
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
      <div>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{activeCategoryName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Showing 1–{Math.min(12, filtered.length)} of {filtered.length} results
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-md border border-border p-1">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={cn(
                  "flex size-8 items-center justify-center rounded",
                  view === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className={cn(
                  "flex size-8 items-center justify-center rounded",
                  view === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <List className="size-4" />
              </button>
            </div>
            <div className="relative">
              <span className="mr-2 hidden text-sm text-muted-foreground sm:inline">Sort by:</span>
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                {sort}
                <ChevronDown className="size-4" />
              </button>
              {sortOpen && (
                <ul className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-md border border-border bg-card shadow-md">
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

        {filtered.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
            No products match your filters.
          </p>
        ) : (
          <div
            className={cn(
              view === "grid"
                ? "grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3"
                : "flex flex-col gap-4",
            )}
          >
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-10 flex items-center justify-center gap-2">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "flex size-9 items-center justify-center rounded-md border text-sm transition-colors",
                page === p
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary",
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(3, p + 1))}
            className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            Next
            <ChevronDown className="size-4 -rotate-90" />
          </button>
        </div>
      </div>
    </div>
  )
}
