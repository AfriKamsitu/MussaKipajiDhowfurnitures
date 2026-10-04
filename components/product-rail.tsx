"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/data"
import { cn } from "@/lib/utils"

export function SectionHeader({
  title,
  href,
  linkLabel = "See all",
  id,
}: {
  title: string
  href?: string
  linkLabel?: string
  id?: string
}) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <h2 id={id} className="text-[13px] font-medium uppercase tracking-[0.2em] text-foreground sm:text-sm">
        {title}
      </h2>
      {href && (
        <Link href={href} className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-primary underline-offset-4 hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

/** Horizontally scrolling product shelf with arrow controls on pointer devices. */
export function ProductRail({
  title,
  products,
  href,
  linkLabel,
  className,
}: {
  title: string
  products: Product[]
  href?: string
  linkLabel?: string
  className?: string
}) {
  const railRef = useRef<HTMLUListElement>(null)
  const [canScroll, setCanScroll] = useState({ left: false, right: false })
  const headingId = `rail-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

  const measure = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    setCanScroll({
      left: rail.scrollLeft > 4,
      right: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [measure, products.length])

  function scrollByPage(direction: -1 | 1) {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * rail.clientWidth * 0.85, behavior: "smooth" })
  }

  if (products.length === 0) return null

  return (
    <section aria-labelledby={headingId} className={className}>
      <SectionHeader id={headingId} title={title} href={href} linkLabel={linkLabel} />
      <div className="relative">
        <ul ref={railRef} onScroll={measure} className="sf-rail gap-3 pb-1 sm:gap-5">
          {products.map((product) => (
            <li key={product.id} className="w-[46vw] max-w-[250px] sm:w-[230px] lg:w-[250px]">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
        {(["left", "right"] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => scrollByPage(side === "left" ? -1 : 1)}
            aria-label={side === "left" ? `Scroll ${title} back` : `Scroll ${title} forward`}
            className={cn(
              "absolute top-[36%] hidden size-11 -translate-y-1/2 place-items-center border border-border bg-card text-foreground shadow-soft transition-opacity hover:text-primary md:grid",
              side === "left" ? "-left-2" : "-right-2",
              !canScroll[side] && "pointer-events-none opacity-0",
            )}
            tabIndex={canScroll[side] ? 0 : -1}
          >
            {side === "left" ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
          </button>
        ))}
      </div>
    </section>
  )
}
