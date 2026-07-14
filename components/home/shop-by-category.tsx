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
        title="Shop by Category"
        subtitle="Find exactly what your space needs"
        actionLabel="View All"
        actionHref="/shop"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center shadow-soft ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:ring-accent/30"
          >
            <div className="relative size-16 overflow-hidden rounded-full bg-secondary ring-2 ring-border transition-all duration-300 group-hover:ring-accent/50">
              <Image
                src={cat.image || "/placeholder.svg"}
                alt={cat.name}
                fill
                sizes="64px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground transition-colors group-hover:text-accent">
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
