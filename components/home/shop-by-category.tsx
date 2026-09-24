"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { fetchApi } from "@/lib/api"
import { normalizeCategory, type Category } from "@/lib/data"

export function ShopByCategory() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/categories")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setCategories(list.map(normalizeCategory))
      })
      .catch(() => setCategories([]))
  }, [])

  return (
    <section>
      <SectionHeading
        title="Browse categories"
        subtitle="Popular furniture departments"
        actionLabel="All categories"
        actionHref="/shop"
      />
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
            className="group flex w-28 shrink-0 flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center shadow-soft ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:ring-primary/30 sm:w-auto"
          >
            <div className="relative size-14 overflow-hidden rounded-md bg-secondary ring-1 ring-border transition-all duration-300 group-hover:ring-primary/50">
              <Image
                src={cat.image || "/placeholder.svg"}
                alt={cat.name}
                fill
                sizes="56px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
            </div>
            <div>
              <p className="line-clamp-1 text-xs font-semibold text-foreground transition-colors group-hover:text-primary sm:text-sm">
                {cat.name}
              </p>
              <p className="text-xs text-muted-foreground">{cat.count} Items</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
