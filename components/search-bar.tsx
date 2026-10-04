"use client"

import { useEffect, useId, useRef, useState } from "react"
import { SafeImage as Image } from "@/components/safe-image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2, Search } from "lucide-react"
import { useStoreSettings } from "@/components/store-settings-provider"
import { listProducts, productHref } from "@/lib/catalog"
import { formatPrice, type Category, type Product } from "@/lib/data"
import { cn } from "@/lib/utils"

const SUGGESTION_DELAY_MS = 250
const MIN_QUERY_LENGTH = 2

export function SearchBar({
  categories,
  showCategorySelect = true,
  className,
}: {
  categories: Category[]
  showCategorySelect?: boolean
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { currency } = useStoreSettings()
  const listId = useId()
  const onShop = pathname === "/shop"
  const urlQuery = onShop ? (params.get("q") ?? "") : ""
  const urlCategory = onShop ? (params.get("category") ?? "") : ""

  const [query, setQuery] = useState(urlQuery)
  const [category, setCategory] = useState(urlCategory)
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const wrapperRef = useRef<HTMLFormElement>(null)
  const requestRef = useRef(0)
  const withSelect = showCategorySelect && categories.length > 0

  // The URL is the source of truth for the active search on the shop page.
  useEffect(() => {
    setQuery(urlQuery)
    setCategory(urlCategory)
    setOpen(false)
  }, [urlQuery, urlCategory, pathname])

  useEffect(() => {
    const term = query.trim()
    if (!open || term.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setLoading(false)
      return
    }
    const request = ++requestRef.current
    setLoading(true)
    const timer = window.setTimeout(() => {
      listProducts({ q: term, category: category || undefined, size: 6 })
        .then((page) => {
          if (request === requestRef.current) setSuggestions(page.content)
        })
        .catch(() => {
          if (request === requestRef.current) setSuggestions([])
        })
        .finally(() => {
          if (request === requestRef.current) setLoading(false)
        })
    }, SUGGESTION_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [query, category, open])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  function goToResults() {
    const next = new URLSearchParams()
    if (query.trim()) next.set("q", query.trim())
    if (category) next.set("category", category)
    const qs = next.toString()
    setOpen(false)
    router.push(qs ? `/shop?${qs}` : "/shop")
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const chosen = suggestions[highlighted]
    if (open && chosen) {
      setOpen(false)
      router.push(productHref(chosen))
      return
    }
    goToResults()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false)
      setHighlighted(-1)
      return
    }
    if (!suggestions.length) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      setHighlighted((current) => (current + 1) % suggestions.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlighted((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
    }
  }

  const term = query.trim()
  const showPanel = open && term.length >= MIN_QUERY_LENGTH

  return (
    <form
      ref={wrapperRef}
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        "relative flex h-11 min-w-0 flex-1 rounded-lg bg-white text-foreground focus-within:ring-2 focus-within:ring-[#d9b98a]",
        className,
      )}
    >
      {withSelect && (
        <label className="hidden shrink-0 md:block">
          <span className="sr-only">Search in category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-full max-w-40 cursor-pointer truncate rounded-l-lg border-r border-border bg-secondary px-3 text-xs font-semibold text-foreground outline-none hover:bg-[#eceae6] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          >
            <option value="">All furniture</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="min-w-0 flex-1">
        <span className="sr-only">Search furniture</span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setHighlighted(-1)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search furniture, materials…"
          autoComplete="off"
          enterKeyHint="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
          className={cn(
            "h-full w-full rounded-l-lg bg-transparent px-3.5 text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden",
            withSelect && "md:rounded-l-none",
          )}
        />
      </label>

      <button
        type="submit"
        aria-label="Search"
        className="grid w-12 shrink-0 place-items-center rounded-r-lg bg-primary text-primary-foreground transition-colors hover:bg-accent sm:w-14"
      >
        <Search className="size-5" />
      </button>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Product suggestions"
          className="sf-fade-in absolute inset-x-0 top-full z-[70] mt-1.5 overflow-hidden rounded-lg border border-border bg-card shadow-elevated"
        >
          {loading && suggestions.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </p>
          ) : suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No furniture matches “{term}”. Press Enter to see all results.
            </p>
          ) : (
            <>
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={highlighted === index}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => {
                    setOpen(false)
                    router.push(productHref(product))
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left",
                    highlighted === index && "bg-secondary",
                  )}
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-secondary">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {product.name}
                    </span>
                    <span className="block text-xs font-bold text-primary">
                      {formatPrice(product.price, currency)}
                    </span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={goToResults}
                className="block w-full border-t border-border px-4 py-2.5 text-left text-xs font-bold text-primary hover:bg-secondary"
              >
                See all results for “{term}”
              </button>
            </>
          )}
        </div>
      )}
    </form>
  )
}
