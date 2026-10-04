"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import type { Category } from "@/lib/data"
import { cn } from "@/lib/utils"

export type ShopFilters = {
  category: string
  min: string
  max: string
  materials: string[]
  colors: string[]
  inStock: boolean
  rating: number
}

export const emptyFilters: ShopFilters = {
  category: "",
  min: "",
  max: "",
  materials: [],
  colors: [],
  inStock: false,
  rating: 0,
}

export type Facet = { value: string; count: number }

/** Only facets backed by real product data are passed in; empty ones are not rendered. */
export type ShopFacets = {
  materials: Facet[]
  colors: Facet[]
  hasRatings: boolean
  hasOutOfStock: boolean
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <legend className="mb-2.5 float-left w-full text-sm font-bold text-foreground">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  )
}

function PriceFilter({
  min,
  max,
  currency,
  immediate,
  onCommit,
}: {
  min: string
  max: string
  currency: string
  /** Commit on every keystroke (used inside the mobile drawer's draft). */
  immediate: boolean
  onCommit: (min: string, max: string) => void
}) {
  const [draft, setDraft] = useState({ min, max })

  useEffect(() => setDraft({ min, max }), [min, max])

  function change(field: "min" | "max", raw: string) {
    const value = raw.replace(/[^\d]/g, "")
    const next = { ...draft, [field]: value }
    setDraft(next)
    if (immediate) onCommit(next.min, next.max)
  }

  return (
    <div className="flex items-end gap-2">
      <label className="min-w-0 flex-1 text-xs text-muted-foreground">
        Min ({currency})
        <input
          inputMode="numeric"
          value={draft.min}
          onChange={(event) => change("min", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onCommit(draft.min, draft.max)
            }
          }}
          placeholder="0"
          className="sf-input mt-1 !min-h-10"
        />
      </label>
      <label className="min-w-0 flex-1 text-xs text-muted-foreground">
        Max ({currency})
        <input
          inputMode="numeric"
          value={draft.max}
          onChange={(event) => change("max", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onCommit(draft.min, draft.max)
            }
          }}
          placeholder="Any"
          className="sf-input mt-1 !min-h-10"
        />
      </label>
      {!immediate && (
        <button
          type="button"
          onClick={() => onCommit(draft.min, draft.max)}
          className="sf-btn sf-btn-outline sf-btn-sm !min-h-10 shrink-0"
        >
          Go
        </button>
      )}
    </div>
  )
}

export function FilterPanel({
  value,
  onChange,
  categories,
  facets,
  currency,
  totalInScope,
  immediatePrice = false,
}: {
  value: ShopFilters
  onChange: (next: ShopFilters) => void
  categories: Category[]
  facets: ShopFacets
  currency: string
  /** Products matching the current search before category and facet filters. */
  totalInScope: number
  immediatePrice?: boolean
}) {
  return (
    <div>
      <Group title="Category">
        <ul className="space-y-0.5">
          {[{ slug: "", name: "All furniture", count: totalInScope }, ...categories].map((category) => {
            const active = value.category === category.slug
            return (
              <li key={category.slug || "all"}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...value, category: category.slug })}
                  className={cn(
                    "flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-2.5 text-left text-sm",
                    active ? "bg-secondary font-bold text-primary" : "text-foreground hover:bg-secondary/60",
                  )}
                >
                  <span className="truncate">{category.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{category.count}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Group>

      <Group title="Price">
        <PriceFilter
          min={value.min}
          max={value.max}
          currency={currency}
          immediate={immediatePrice}
          onCommit={(min, max) => onChange({ ...value, min, max })}
        />
      </Group>

      {facets.hasOutOfStock && (
        <Group title="Availability">
          <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-foreground">
            <input
              type="checkbox"
              checked={value.inStock}
              onChange={(event) => onChange({ ...value, inStock: event.target.checked })}
              className="size-4 accent-[var(--primary)]"
            />
            In stock only
          </label>
        </Group>
      )}

      {facets.materials.length > 0 && (
        <Group title="Material">
          <ul>
            {facets.materials.map((facet) => (
              <li key={facet.value}>
                <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={value.materials.includes(facet.value)}
                    onChange={() => onChange({ ...value, materials: toggle(value.materials, facet.value) })}
                    className="size-4 accent-[var(--primary)]"
                  />
                  <span className="min-w-0 flex-1 truncate">{facet.value}</span>
                  <span className="text-xs text-muted-foreground">{facet.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </Group>
      )}

      {facets.colors.length > 0 && (
        <Group title="Colour">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((facet) => {
              const active = value.colors.includes(facet.value)
              return (
                <button
                  key={facet.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...value, colors: toggle(value.colors, facet.value) })}
                  className={cn(
                    "min-h-9 border px-3 text-[13px] capitalize",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card text-foreground hover:border-primary",
                  )}
                >
                  {facet.value}
                </button>
              )
            })}
          </div>
        </Group>
      )}

      {facets.hasRatings && (
        <Group title="Customer rating">
          <ul>
            {[4, 3].map((stars) => {
              const active = value.rating === stars
              return (
                <li key={stars}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange({ ...value, rating: active ? 0 : stars })}
                    className={cn(
                      "flex min-h-9 w-full items-center gap-1.5 rounded-md px-2.5 text-sm",
                      active ? "bg-secondary font-bold text-primary" : "hover:bg-secondary/60",
                    )}
                  >
                    <span className="flex" aria-hidden="true">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          className={cn(
                            "size-4",
                            index < stars ? "fill-star text-star" : "text-muted-foreground/40",
                          )}
                        />
                      ))}
                    </span>
                    {stars} stars &amp; up
                  </button>
                </li>
              )
            })}
          </ul>
        </Group>
      )}
    </div>
  )
}
