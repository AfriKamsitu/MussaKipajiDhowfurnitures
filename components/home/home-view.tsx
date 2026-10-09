"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card"
import { RecentlyViewedShelf } from "@/components/recently-viewed-shelf"
import { useCategories } from "@/components/categories-provider"
import { SafeImage as Image } from "@/components/safe-image"
import { EmptyState, ErrorState } from "@/components/state-panels"
import { useStoreSettings } from "@/components/store-settings-provider"
import { discountPercent, isAvailable, listCatalog } from "@/lib/catalog"
import type { Product } from "@/lib/data"
import { cn } from "@/lib/utils"

const NEW_ARRIVALS = 8
const SALE_ITEMS = 8
const SLIDE_INTERVAL_MS = 6500

const container = "mx-auto w-full max-w-[1240px] px-4 sm:px-6"
const sectionTitle = "text-center text-[13px] font-medium uppercase tracking-[0.22em] text-[#2a211b] sm:text-sm"
const solidButton =
  "inline-flex min-h-11 items-center justify-center bg-[#6b2b2b] px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#531f1f]"
const outlineButton =
  "inline-flex min-h-11 items-center justify-center border border-[#2a211b] px-7 text-[11px] font-medium uppercase tracking-[0.18em] text-[#2a211b] transition-colors hover:bg-[#2a211b] hover:text-white"

type Slide = { key: string; image: string; alt: string; title: string; text?: string; cta: string; href: string }

/** Centred, framed hero carousel with arrows, dots and a slow auto-advance. */
function HeroSlider({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length
  const current = Math.min(active, count - 1)

  useEffect(() => {
    if (paused || count < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = window.setInterval(() => setActive((index) => (index + 1) % count), SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [paused, count])

  function step(direction: -1 | 1) {
    setActive((index) => (index + direction + count) % count)
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className={cn(container, "pt-3 sm:pt-4")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative h-[62vh] max-h-[620px] min-h-[380px] overflow-hidden bg-[#8d8780] sm:h-auto sm:max-h-none sm:min-h-0 sm:aspect-[2/1]">
        {slides.map((slide, index) => {
          const shown = index === current
          return (
            <div
              key={slide.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={!shown}
              className={cn("home-slide absolute inset-0", shown ? "opacity-100" : "pointer-events-none opacity-0")}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="(max-width: 1240px) 100vw, 1192px"
                className={cn("home-slide-image object-cover", shown ? "scale-100" : "scale-[1.06]")}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(30_24_20/0.5)_0%,rgb(30_24_20/0.22)_45%,rgb(30_24_20/0.12)_100%)]" />
              <div className="relative flex h-full flex-col items-center px-12 pt-[13%] text-center text-white sm:px-16 sm:pt-[7.5%]">
                {/* One page heading: the first slide carries the h1. */}
                {index === 0 ? (
                  <h1 className="text-balance text-[2rem] font-light leading-tight tracking-[0.01em] sm:text-4xl lg:text-[2.75rem]">
                    {slide.title}
                  </h1>
                ) : (
                  <h2 className="text-balance text-[2rem] font-light leading-tight tracking-[0.01em] sm:text-4xl lg:text-[2.75rem]">
                    {slide.title}
                  </h2>
                )}
                {slide.text && (
                  <p className="mt-2.5 max-w-xl text-sm font-light text-white/90 sm:text-base">{slide.text}</p>
                )}
                <Link href={slide.href} tabIndex={shown ? 0 : -1} className={cn(solidButton, "mt-6")}>
                  {slide.cta}
                </Link>
              </div>
            </div>
          )
        })}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous slide"
              className="absolute left-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-white/90 transition-colors hover:text-white sm:left-3"
            >
              <ChevronLeft className="size-7" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next slide"
              className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-white/90 transition-colors hover:text-white sm:right-3"
            >
              <ChevronRight className="size-7" strokeWidth={1.25} />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
              {slides.map((slide, index) => (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show slide ${index + 1}`}
                  aria-current={index === current ? "true" : undefined}
                  className="grid size-6 place-items-center"
                >
                  <span className={cn("size-1.5 rounded-full", index === current ? "bg-white" : "bg-white/45")} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export function HomeView({
  initialProducts,
}: {
  /** Null when the server could not reach the API; the browser then loads the data itself. */
  initialProducts: Product[] | null
}) {
  const settings = useStoreSettings()
  const categories = useCategories()
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[] | null>(initialProducts)
  const [failed, setFailed] = useState(false)

  const loadProducts = useCallback(() => {
    setFailed(false)
    listCatalog()
      .then(setProducts)
      .catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    if (initialProducts === null) loadProducts()
  }, [initialProducts, loadProducts])

  // Category photos are too small to fill a hero, so the slides use the three large interior images.
  const slides = useMemo<Slide[]>(
    () => [
      {
        key: "brand",
        image: "/reference-site/hero.jpg",
        alt: "A sunlit living room with a leather sofa, armchairs and a round wooden coffee table",
        title: "Furniture That Feels Like Home",
        text: settings.tagline,
        cta: "Browse furniture",
        href: "/shop",
      },
      {
        key: "arrivals",
        image: "/reference-site/gallery.jpg",
        alt: "A bright room with a sofa, armchairs and a wooden coffee table",
        title: "New Arrivals",
        text: "The latest pieces added to the collection",
        cta: "See what's new",
        href: "/shop?sort=newest",
      },
      {
        key: "craft",
        image: "/reference-site/craft-workshop.webp",
        alt: "Furniture being made in the workshop",
        title: settings.city ? `Made by Hand in ${settings.city}` : "Made by Hand",
        cta: "Our story",
        href: "/about",
      },
    ],
    [settings.tagline, settings.city],
  )

  // The API returns newest first, so the head of the list is the new arrivals.
  const arrivals = products?.slice(0, NEW_ARRIVALS) ?? []
  const arrivalIds = new Set(arrivals.map((product) => product.id))
  const onSale = (products ?? [])
    .filter((product) => !arrivalIds.has(product.id) && isAvailable(product) && discountPercent(product))
    .slice(0, SALE_ITEMS)

  return (
    <main id="main-content" className="flex-1 bg-white pb-16 sm:pb-20">
      <HeroSlider slides={slides} />

      <section aria-labelledby="home-arrivals" className={cn(container, "pt-12 sm:pt-16")}>
        <h2 id="home-arrivals" className={sectionTitle}>
          New arrivals
        </h2>
        <div className="mt-8 sm:mt-10">
          {failed ? (
            <ErrorState title="We couldn't load the furniture" onRetry={loadProducts} />
          ) : products === null ? (
            <ProductGridSkeleton count={8} />
          ) : arrivals.length === 0 ? (
            <EmptyState title="New furniture is on its way" description="Our catalog is being prepared. Please check back soon.">
              <Link href="/contact" className={outlineButton}>
                Contact us
              </Link>
            </EmptyState>
          ) : (
            <>
              <ProductGrid products={arrivals} priorityCount={4} />
              <div className="mt-10 text-center sm:mt-12">
                <Link href="/shop" className={outlineButton}>
                  View all furniture
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="home-categories" className={cn(container, "pt-14 sm:pt-20")}>
          <h2 id="home-categories" className={sectionTitle}>
            Shop by category
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-10 sm:grid-cols-4 sm:gap-x-5 sm:gap-y-8">
            {categories.map((category) => (
              <li key={category.slug} className="min-w-0">
                <Link href={`/shop?category=${encodeURIComponent(category.slug)}`} className="sf-reveal group block">
                  <span className="relative block aspect-[4/3] overflow-hidden bg-[#f4f3f1]">
                    <Image
                      src={category.image || "/placeholder.svg"}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 286px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </span>
                  <span className="mt-3 block text-center text-[11px] uppercase tracking-[0.18em] text-[#2a211b] group-hover:text-[#6b2b2b]">
                    {category.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {onSale.length > 0 && (
        <section aria-labelledby="home-sale" className={cn(container, "pt-14 sm:pt-20")}>
          <h2 id="home-sale" className={sectionTitle}>
            On sale
          </h2>
          <div className="mt-8 sm:mt-10">
            <ProductGrid products={onSale} />
          </div>
          <div className="mt-10 text-center">
            <Link href="/offers" className={outlineButton}>
              View all offers
            </Link>
          </div>
        </section>
      )}

      {/* Browsing history, as on a marketplace home page; hidden until something has been viewed. */}
      <RecentlyViewedShelf className={cn(container, "pt-14 sm:pt-20")} />

      {!authLoading && !user && (
        <section aria-label="Sign in" className={cn(container, "pt-14 sm:pt-20")}>
          <div className="flex flex-col items-center gap-3 border-y border-black/10 py-8 text-center">
            <p className="text-sm text-[#2a211b]">Sign in to track orders and check out faster.</p>
            <Link href="/login" className={solidButton}>
              Sign in
            </Link>
            <p className="text-xs text-[#2a211b]/70">
              New customer?{" "}
              <Link href="/register" className="text-[#6b2b2b] underline underline-offset-4">
                Start here
              </Link>
            </p>
          </div>
        </section>
      )}
    </main>
  )
}
