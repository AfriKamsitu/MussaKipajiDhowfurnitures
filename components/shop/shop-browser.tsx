"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from "lucide-react"
import { useCategories } from "@/components/categories-provider"
import { Breadcrumb } from "@/components/page-shell"
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card"
import { EmptyState, ErrorState } from "@/components/state-panels"
import { useStoreSettings } from "@/components/store-settings-provider"
import {
  emptyFilters,
  FilterPanel,
  type Facet,
  type ShopFacets,
  type ShopFilters,
} from "@/components/shop/filter-panel"
import { hasReviews, isAvailable, listCatalog } from "@/lib/catalog"
import { formatPrice, type Product } from "@/lib/data"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 24

const baseSortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
]
const ratingSortOption = { value: "rating", label: "Customer rating" }
/** Sort keys used by links from before the redesign. */
const legacySort: Record<string, string> = { new: "newest", popular: "rating" }

function parseList(value: string | null) {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : []
}

function filtersFromParams(params: URLSearchParams): ShopFilters {
  return {
    category: params.get("category") ?? "",
    min: (params.get("min") ?? "").replace(/[^\d]/g, ""),
    max: (params.get("max") ?? "").replace(/[^\d]/g, ""),
    materials: parseList(params.get("material")),
    colors: parseList(params.get("color")),
    inStock: params.get("stock") === "1",
    rating: Math.min(5, Math.max(0, Number(params.get("rating")) || 0)),
  }
}

function countFacet(values: string[]): Facet[] {
  const counts = new Map<string, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

function pageWindow(current: number, total: number) {
  const pages = new Set([1, total, current - 1, current, current + 1])
  return [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)
}

export function ShopBrowser() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { currency } = useStoreSettings()

  const query = (params.get("q") ?? "").trim()
  const rawSort = params.get("sort") ?? "recommended"
  const sort = legacySort[rawSort] ?? rawSort
  const page = Math.max(1, Number(params.get("page")) || 1)
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params])

  const [products, setProducts] = useState<Product[] | null>(null)
  const [failed, setFailed] = useState(false)
  const categories = useCategories()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draft, setDraft] = useState<ShopFilters>(emptyFilters)
  const requestRef = useRef(0)
  const resultsRef = useRef<HTMLDivElement>(null)
  const filterButtonRef = useRef<HTMLButtonElement>(null)

  const load = useCallback(() => {
    const request = ++requestRef.current
    setFailed(false)
    setProducts(null)
    listCatalog({ q: query || undefined })
      .then((list) => {
        if (request === requestRef.current) setProducts(list)
      })
      .catch(() => {
        if (request === requestRef.current) setFailed(true)
      })
  }, [query])

  useEffect(load, [load])

  /** Write filter, sort and page state to the URL so it survives reloads, sharing and back/forward. */
  const navigate = useCallback(
    (next: Partial<ShopFilters> & { sort?: string; page?: number }, options?: { scroll?: boolean }) => {
      const merged = { ...filters, ...next }
      const search = new URLSearchParams()
      if (query) search.set("q", query)
      if (merged.category) search.set("category", merged.category)
      if (merged.min) search.set("min", merged.min)
      if (merged.max) search.set("max", merged.max)
      if (merged.materials.length) search.set("material", merged.materials.join(","))
      if (merged.colors.length) search.set("color", merged.colors.join(","))
      if (merged.inStock) search.set("stock", "1")
      if (merged.rating) search.set("rating", String(merged.rating))
      const nextSort = next.sort ?? sort
      if (nextSort !== "recommended") search.set("sort", nextSort)
      // Any filter or sort change returns to the first page.
      if (next.page && next.page > 1) search.set("page", String(next.page))
      const qs = search.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      if (options?.scroll) resultsRef.current?.scrollIntoView({ block: "start" })
    },
    [filters, pathname, query, router, sort],
  )

  const inCategory = useMemo(
    () => (products ?? []).filter((product) => !filters.category || product.category === filters.category),
    [products, filters.category],
  )

  const facets = useMemo<ShopFacets>(
    () => ({
      materials: countFacet(inCategory.map((product) => product.material.trim()).filter(Boolean)),
      colors: countFacet(inCategory.flatMap((product) => product.colors.map((color) => color.trim().toLowerCase())).filter(Boolean)),
      hasRatings: inCategory.some(hasReviews),
      hasOutOfStock: inCategory.some((product) => !isAvailable(product)),
    }),
    [inCategory],
  )

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        // With a search active, show how many results fall in each category.
        count: products ? products.filter((product) => product.category === category.slug).length : category.count,
      })),
    [categories, products],
  )

  const results = useMemo(() => {
    const min = filters.min ? Number(filters.min) : null
    const max = filters.max ? Number(filters.max) : null
    const list = inCategory.filter((product) => {
      if (min != null && product.price < min) return false
      if (max != null && product.price > max) return false
      if (filters.inStock && !isAvailable(product)) return false
      if (filters.materials.length && !filters.materials.includes(product.material.trim())) return false
      if (
        filters.colors.length
        && !product.colors.some((color) => filters.colors.includes(color.trim().toLowerCase()))
      ) return false
      if (filters.rating && !(hasReviews(product) && product.rating >= filters.rating)) return false
      return true
    })

    // Array.prototype.sort is stable, so ties keep the API's newest-first order.
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price)
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price)
    if (sort === "rating") {
      return [...list].sort((a, b) => Number(hasReviews(b)) * b.rating - Number(hasReviews(a)) * a.rating)
    }
    if (sort === "newest") return list
    return [...list].sort((a, b) => Number(isAvailable(b)) - Number(isAvailable(a)))
  }, [inCategory, filters, sort])

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const sortOptions = facets.hasRatings ? [...baseSortOptions, ratingSortOption] : baseSortOptions
  const activeCategory = categories.find((category) => category.slug === filters.category)
  const title = query ? `Results for “${query}”` : (activeCategory?.name ?? "All Furniture")

  const chips = [
    filters.category && activeCategory && query
      ? { label: activeCategory.name, clear: { category: "" } }
      : null,
    filters.min || filters.max
      ? {
          label: `${filters.min ? formatPrice(Number(filters.min), currency) : "Any"} – ${filters.max ? formatPrice(Number(filters.max), currency) : "Any"}`,
          clear: { min: "", max: "" },
        }
      : null,
    filters.inStock ? { label: "In stock", clear: { inStock: false } } : null,
    ...filters.materials.map((material) => ({
      label: material,
      clear: { materials: filters.materials.filter((item) => item !== material) },
    })),
    ...filters.colors.map((color) => ({
      label: color,
      clear: { colors: filters.colors.filter((item) => item !== color) },
    })),
    filters.rating ? { label: `${filters.rating}★ & up`, clear: { rating: 0 } } : null,
  ].filter(Boolean) as { label: string; clear: Partial<ShopFilters> }[]

  function openDrawer() {
    setDraft(filters)
    setDrawerOpen(true)
  }

  useEffect(() => {
    if (!drawerOpen) return
    const trigger = filterButtonRef.current
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

  return (
    <div ref={resultsRef} className="scroll-mt-[calc(var(--site-header-height)+0.5rem)]">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          ...(query || activeCategory ? [{ label: "All Furniture", href: "/shop" }] : []),
          { label: query ? "Search" : (activeCategory?.name ?? "All Furniture") },
        ]}
      />

      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-[-0.02em] text-foreground sm:text-2xl">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground" aria-live="polite">
            {products === null && !failed
              ? "Loading…"
              : `${results.length} ${results.length === 1 ? "product" : "products"}`}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            ref={filterButtonRef}
            type="button"
            onClick={openDrawer}
            className="sf-btn sf-btn-outline sf-btn-sm !min-h-10 flex-1 sm:flex-none lg:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters{chips.length > 0 ? ` (${chips.length})` : ""}
          </button>
          <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground sm:flex-none">
            <span className="hidden shrink-0 sm:inline">Sort by</span>
            <select
              value={sortOptions.some((option) => option.value === sort) ? sort : "recommended"}
              onChange={(event) => navigate({ sort: event.target.value })}
              aria-label="Sort products"
              className="sf-input !min-h-10 cursor-pointer py-1.5 font-semibold"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((chip, index) => (
            <li key={`${chip.label}-${index}`}>
              <button
                type="button"
                onClick={() => navigate(chip.clear)}
                aria-label={`Remove filter ${chip.label}`}
                className="inline-flex min-h-8 items-center gap-1.5 border border-input bg-card pl-3 pr-2 text-[13px] capitalize hover:border-primary"
              >
                {chip.label}
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => navigate({ ...emptyFilters, category: query ? "" : filters.category })}
              className="min-h-8 px-1 text-[13px] font-semibold text-primary hover:underline"
            >
              Clear all
            </button>
          </li>
        </ul>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sf-card sf-sticky-below-header max-h-[calc(100vh-var(--site-header-height)-2rem)] overflow-y-auto p-4">
            <FilterPanel
              value={filters}
              onChange={(next) => navigate(next)}
              categories={categoryOptions}
              facets={facets}
              currency={currency}
              totalInScope={products?.length ?? 0}
            />
          </div>
        </aside>

        <div className="min-w-0">
          {failed ? (
            <ErrorState title="We couldn't load the furniture" onRetry={load} />
          ) : products === null ? (
            <ProductGridSkeleton count={8} className="lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4" />
          ) : results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={query ? `No results for “${query}”` : "No furniture matches these filters"}
              description={
                chips.length > 0
                  ? "Try removing a filter to see more furniture."
                  : query
                    ? "Check the spelling or try a more general word, like “chair” or “table”."
                    : "This category has no furniture yet."
              }
            >
              {chips.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate({ ...emptyFilters, category: filters.category })}
                  className="sf-btn sf-btn-primary"
                >
                  Clear filters
                </button>
              )}
              <Link href="/shop" className="sf-btn sf-btn-outline">
                Browse all furniture
              </Link>
            </EmptyState>
          ) : (
            <>
              <ProductGrid
                products={visible}
                priorityCount={4}
                className="lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
              />
              {totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate({ page: currentPage - 1 }, { scroll: true })}
                    disabled={currentPage <= 1}
                    className="sf-btn sf-btn-outline sf-btn-sm !min-h-10"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" /> Previous
                  </button>
                  {pageWindow(currentPage, totalPages).map((item, index, list) => (
                    <span key={item} className="flex items-center gap-1.5">
                      {index > 0 && item - list[index - 1] > 1 && (
                        <span className="px-1 text-muted-foreground" aria-hidden="true">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate({ page: item }, { scroll: true })}
                        aria-current={item === currentPage ? "page" : undefined}
                        aria-label={`Page ${item}`}
                        className={cn(
                          "grid size-10 place-items-center border text-sm font-semibold",
                          item === currentPage
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-card hover:border-primary",
                        )}
                      >
                        {item}
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => navigate({ page: currentPage + 1 }, { scroll: true })}
                    disabled={currentPage >= totalPages}
                    className="sf-btn sf-btn-outline sf-btn-sm !min-h-10"
                  >
                    Next <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            aria-label="Close filters"
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
            className="sf-fade-in absolute inset-0 bg-black/55"
          />
          <div className="sf-drawer-enter-bottom absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-card shadow-elevated">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-base font-bold text-foreground">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="grid size-10 place-items-center hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FilterPanel
                value={draft}
                onChange={setDraft}
                categories={categoryOptions}
                facets={facets}
                currency={currency}
                totalInScope={products?.length ?? 0}
                immediatePrice
              />
            </div>
            <div className="flex gap-2 border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => setDraft(emptyFilters)} className="sf-btn sf-btn-outline flex-1">
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate(draft)
                  setDrawerOpen(false)
                }}
                className="sf-btn sf-btn-primary flex-[2]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
