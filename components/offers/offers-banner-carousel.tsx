"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { fetchApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/data"
import { useStoreSettings } from "@/components/store-settings-provider"

type OfferBanner = {
  id: number
  title: string
  location?: string
  image: string
  headline?: string
  description?: string
  ctaLabel?: string
  price?: number | null
  discountPercentage?: number | null
  sortOrder?: number
}

const OFFER_LOCATIONS = new Set(["offers", "offers page", "summer sale"])

export function OffersBannerCarousel() {
  const { currency } = useStoreSettings()
  const [banners, setBanners] = useState<OfferBanner[]>([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    fetchApi<OfferBanner[]>("/api/banners/active")
      .then((payload) => {
        const offers = (Array.isArray(payload) ? payload : [])
          .filter((banner) => OFFER_LOCATIONS.has(String(banner.location ?? "").trim().toLowerCase()))
          .filter((banner) => Boolean(banner.image))
          .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
        setBanners(offers)
      })
      .catch(() => setBanners([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (paused || reducedMotion || banners.length < 2) return
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % banners.length)
    }, 5500)
    return () => window.clearInterval(timer)
  }, [banners.length, paused, reducedMotion])

  useEffect(() => {
    setActive(0)
  }, [banners.length])

  function showPrevious() {
    setActive((current) => (current - 1 + banners.length) % banners.length)
  }

  function showNext() {
    setActive((current) => (current + 1) % banners.length)
  }

  if (loading) {
    return <div className="sf-skeleton aspect-[16/7] max-h-[420px] min-h-[220px] w-full" />
  }

  // Without active offer banners the page goes straight to the discounted products.
  if (!banners.length) return null

  return (
    <section
      className="relative aspect-[16/7] max-h-[420px] min-h-[220px] w-full overflow-hidden rounded-lg bg-header"
      aria-roledescription="carousel"
      aria-label="Current furniture offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {banners.map((banner, index) => (
        <article
          key={banner.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            index === active ? "z-10 opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={index !== active}
        >
          <Image
            src={banner.image}
            alt={banner.title || `Offer ${index + 1}`}
            fill
            priority={index === 0}
            sizes="(max-width: 1280px) 100vw, 1280px"
            className={cn(
              "object-cover transition-transform duration-[1400ms]",
              index === active ? "scale-100" : "scale-[1.035]",
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/5" />
          <div className="relative flex h-full max-w-2xl flex-col justify-center px-6 py-10 text-white sm:px-10 lg:px-14">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80 sm:text-sm">{banner.title}</p>
            <h2 className="mt-2 text-balance text-2xl font-bold leading-tight text-white sm:text-4xl">
              {banner.headline || banner.title}
            </h2>
            {(banner.price != null || Number(banner.discountPercentage) > 0) && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {Number(banner.discountPercentage) > 0 && (
                  <span className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground shadow-lg sm:text-base">
                    {Number(banner.discountPercentage)}% OFF
                  </span>
                )}
                {banner.price != null && Number.isFinite(Number(banner.price)) && (
                  <p className="text-sm text-white/80">
                    Offer price
                    <span className="ml-2 text-xl font-bold text-white sm:text-2xl">{formatPrice(Number(banner.price), currency)}</span>
                  </p>
                )}
              </div>
            )}
            {banner.description && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base lg:text-lg">
                {banner.description}
              </p>
            )}
            {banner.ctaLabel && (
              <Link
                href="/shop"
                className="interactive-press mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-primary/90"
              >
                {banner.ctaLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </article>
      ))}

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={showPrevious}
            className="absolute left-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 sm:left-5"
            aria-label="Previous offer"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={showNext}
            className="absolute right-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 sm:right-5"
            aria-label="Next offer"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-sm">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === active ? "w-7 bg-white" : "w-2 bg-white/55 hover:bg-white/80",
                )}
                aria-label={`Show offer ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
