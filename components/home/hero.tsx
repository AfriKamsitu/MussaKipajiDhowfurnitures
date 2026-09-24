"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BadgeCheck, ChevronRight, Headphones, PackageCheck, ShieldCheck, Truck } from "lucide-react"
import { fetchApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatPrice, normalizeCategory, type Category } from "@/lib/data"
import { useStoreSettings } from "@/components/store-settings-provider"

type HeroSlide = {
  titleStart: string
  highlight: string
  description: string
  image: string
  alt: string
  ctaLabel: string
  price?: number | null
  discountPercentage?: number | null
}

type Banner = {
  title?: string
  location?: string
  image?: string
  headline?: string
  description?: string
  ctaLabel?: string
  price?: number | null
  discountPercentage?: number | null
  sortOrder?: number
  status?: string
}

const fallbackSlides: HeroSlide[] = [
  {
    titleStart: "Furniture that Defines ",
    highlight: "Comfort",
    description: "Discover a wide range of stylish and quality furniture for every room.",
    image: "/hero-living-room.png",
    alt: "Modern living room with a green sofa and wooden coffee table",
    ctaLabel: "Shop Now",
  },
  {
    titleStart: "Designs that Inspire ",
    highlight: "Living",
    description: "Premium materials and timeless craftsmanship for your dream home.",
    image: "/sofa-chesterfield.png",
    alt: "Luxury green velvet chesterfield sofa",
    ctaLabel: "Shop Now",
  },
  {
    titleStart: "Spaces that Feel like ",
    highlight: "Home",
    description: "Curated collections to make every corner of your home special.",
    image: "/sofa-lshaped.png",
    alt: "Grey L-shaped sectional sofa in a bright room",
    ctaLabel: "Shop Now",
  },
]

export function Hero() {
  const { currency } = useStoreSettings()
  const [active, setActive] = useState(0)
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/categories")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setCategories(list.map(normalizeCategory).slice(0, 10))
      })
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    fetchApi<Banner[]>("/api/banners/active")
      .then((banners) => {
        const heroSlides = (Array.isArray(banners) ? banners : [])
          .filter((banner) => {
            const location = String(banner.location ?? "").toLowerCase()
            return location === "homepage hero" || location === "homepage"
          })
          .filter((banner) => banner.image)
          .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
          .map((banner) => ({
            titleStart: String(banner.headline || banner.title || "Furniture that Defines "),
            highlight: "",
            description: String(
              banner.description || "Discover stylish, quality furniture curated by the store team.",
            ),
            image: String(banner.image),
            alt: String(banner.title ?? "Homepage banner"),
            ctaLabel: String(banner.ctaLabel || "Shop Now"),
            price: banner.price == null ? null : Number(banner.price),
            discountPercentage: banner.discountPercentage == null ? null : Number(banner.discountPercentage),
          }))
        if (heroSlides.length) setSlides(heroSlides)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setInterval(
      () => setActive((a) => (a + 1) % Math.max(slides.length, 1)),
      5000,
    )
    return () => clearInterval(timer)
  }, [slides.length])

  useEffect(() => {
    setActive(0)
  }, [slides.length])

  const safeSlides = slides.length ? slides : fallbackSlides
  const slide = safeSlides[active] ?? safeSlides[0] ?? fallbackSlides[0]

  return (
    <section className="grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)_230px]">
      <aside className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-soft lg:block">
        <div className="border-b border-border bg-secondary px-4 py-3">
          <p className="text-sm font-bold uppercase tracking-wide text-foreground">All categories</p>
        </div>
        <div className="grid py-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              <span className="truncate">{cat.name}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
          <Link
            href="/shop"
            className="mt-1 flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm font-semibold text-primary"
          >
            All categories
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </aside>

      <div className="relative min-h-[430px] overflow-hidden rounded-lg bg-primary text-primary-foreground shadow-elevated">
        <div className="absolute inset-0">
          {safeSlides.map((s, i) => (
            <Image
              key={s.image}
              src={s.image || "/placeholder.svg"}
              alt={s.alt}
              fill
              priority={i === 0}
              sizes="(max-width: 1024px) 100vw, 60vw"
              className={cn(
                "object-cover transition-all duration-700 ease-out",
                i === active ? "scale-100 opacity-100" : "scale-105 opacity-0",
              )}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/75 to-primary/10" />
        </div>

        <div className="relative flex min-h-[430px] max-w-2xl flex-col justify-center gap-4 px-5 py-8 sm:px-8 lg:px-10">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-foreground/12 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground ring-1 ring-primary-foreground/20">
            Furniture marketplace
          </span>
          <h1
            key={`title-${active}`}
            className="animate-fade-up text-balance text-3xl font-bold leading-tight sm:text-5xl"
          >
            {slide.titleStart}
            {slide.highlight && <span className="text-accent">{slide.highlight}</span>}
          </h1>
          <p
            key={`desc-${active}`}
            className="max-w-lg animate-fade-up text-sm text-pretty text-primary-foreground/85 sm:text-base"
          >
            {slide.description}
          </p>
          {(slide.price != null || Number(slide.discountPercentage) > 0) && (
            <div className="flex flex-wrap items-center gap-3">
              {Number(slide.discountPercentage) > 0 && (
                <span className="rounded-md bg-primary-foreground px-3 py-1.5 text-sm font-bold text-primary shadow-soft">
                  {Number(slide.discountPercentage)}% OFF
                </span>
              )}
              {slide.price != null && Number.isFinite(Number(slide.price)) && (
                <span className="text-lg font-bold text-primary-foreground sm:text-2xl">
                  {formatPrice(Number(slide.price), currency)}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-accent-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/90 sm:px-6 sm:py-3"
            >
              {slide.ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/35 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10 sm:px-6 sm:py-3"
            >
              Contact our team
            </Link>
          </div>
        </div>

        <div className="absolute bottom-4 left-5 flex gap-2 sm:left-8 lg:left-10">
          {safeSlides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === active ? "w-7 bg-accent" : "w-2 bg-primary-foreground/45",
              )}
            />
          ))}
        </div>
      </div>

      <aside className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {[
          { icon: ShieldCheck, title: "Order protection", desc: "Support from inquiry to delivery" },
          { icon: PackageCheck, title: "Ready stock", desc: "Browse available pieces by category" },
          { icon: Truck, title: "Delivery options", desc: "Confirm delivery before checkout" },
          { icon: Headphones, title: "Buyer help", desc: "Chat with the store team" },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-soft">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <item.icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
        <Link
          href="/shop"
          className="flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          Source now
          <BadgeCheck className="size-5" />
        </Link>
      </aside>
    </section>
  )
}
