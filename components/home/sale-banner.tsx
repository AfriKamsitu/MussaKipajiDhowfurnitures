"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { fetchApi } from "@/lib/api"

type Banner = {
  title?: string
  location?: string
  image?: string
  headline?: string
  description?: string
  ctaLabel?: string
}

export function SaleBanner() {
  const [banner, setBanner] = useState<Banner | null>(null)

  useEffect(() => {
    fetchApi<Banner[]>("/api/banners/active")
      .then((banners) => {
        const sale = (Array.isArray(banners) ? banners : []).find(
          (item) => String(item.location ?? "").toLowerCase() === "summer sale",
        )
        if (sale) setBanner(sale)
      })
      .catch(() => {})
  }, [])

  const image = banner?.image || "/summer-sale.png"
  const title = banner?.title || "Summer Sale"
  const headline = banner?.headline || "Up to 30% Off"
  const description = banner?.description || "Refresh your home with our summer collection."
  const ctaLabel = banner?.ctaLabel || "Shop the Sale"

  return (
    <section className="relative min-h-[260px] overflow-hidden rounded-xl bg-secondary">
      <Image
        src={image}
        alt={title}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-transparent" />
      <div className="relative grid max-w-xl gap-3 px-8 py-12 lg:px-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">{title}</p>
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{headline}</h2>
        <p className="max-w-sm text-pretty text-muted-foreground">
          {description}
        </p>
        <Link
          href="/shop"
          className="mt-2 inline-flex w-fit items-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  )
}
