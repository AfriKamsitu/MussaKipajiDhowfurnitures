"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Heart } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useCategories } from "@/components/categories-provider"
import { SafeImage as Image } from "@/components/safe-image"
import { StarRating } from "@/components/star-rating"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { discountPercent, hasReviews, isAvailable, productHref } from "@/lib/catalog"
import { formatPrice, type Product } from "@/lib/data"
import { cn } from "@/lib/utils"

const LOW_STOCK_THRESHOLD = 5

export function availabilityLabel(product: Product) {
  if (!isAvailable(product)) return { text: "Out of stock", tone: "out" as const }
  if (product.stock != null && product.stock <= LOW_STOCK_THRESHOLD) {
    return { text: `Only ${product.stock} left`, tone: "low" as const }
  }
  return { text: "In stock", tone: "in" as const }
}

const tag = "px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-white"
const gridClass = "grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4"

/** Gallery-style product tile: picture on a soft grey field, then category, name and price. */
export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: Product
  /** Load the image eagerly for cards in the first viewport. */
  priority?: boolean
  className?: string
}) {
  const { user } = useAuth()
  const { currency } = useStoreSettings()
  const categories = useCategories()
  const { addToCart, toggleWishlist, isInWishlist } = useStore()
  const [added, setAdded] = useState(false)
  const wished = isInWishlist(product.id)
  const href = productHref(product)
  const available = isAvailable(product)
  const discount = discountPercent(product)
  const minimumOrder = Math.max(1, product.moq ?? 1)
  const categoryName =
    categories.find((category) => category.slug === product.category)?.name
    ?? product.category.replace(/-/g, " ")
  // Admin accounts cannot shop, so the cart control is not offered to them.
  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (!added) return
    const timeout = window.setTimeout(() => setAdded(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [added])

  return (
    <article className={cn("sf-product-card group relative flex h-full min-w-0 flex-col", className)}>
      <div className="relative aspect-square overflow-hidden bg-[#f4f3f1]">
        <Image
          src={product.image || "/placeholder.svg"}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 290px"
          className={cn("sf-zoom object-cover", !available && "opacity-70")}
        />

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {!available ? (
            <span className={cn(tag, "bg-[#4a4541]")}>Sold out</span>
          ) : discount ? (
            <span className={cn(tag, "bg-primary")}>On sale</span>
          ) : product.isNew ? (
            <span className={cn(tag, "bg-foreground")}>New</span>
          ) : null}
        </div>

        <button
          type="button"
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
          onClick={() => toggleWishlist(product)}
          className={cn(
            "absolute right-1.5 top-1.5 z-10 grid size-9 place-items-center rounded-full bg-white/90 transition-colors",
            wished ? "text-primary" : "text-foreground/60 hover:text-primary",
          )}
        >
          <Heart className={cn("size-4", wished && "sf-heart-pop fill-current")} />
        </button>

      </div>

      <div className="pt-3">
        <p className="truncate text-[9px] uppercase tracking-[0.18em] text-foreground/55">{categoryName}</p>
        <h3 className="mt-1 text-[13px] text-foreground sm:text-sm">
          <Link href={href} className="line-clamp-2 after:absolute after:inset-0 after:content-[''] group-hover:text-primary">
            {product.name}
          </Link>
        </h3>

        {hasReviews(product) && (
          <div className="mt-1">
            <StarRating rating={product.rating} reviews={product.reviews} />
          </div>
        )}

        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[12px] text-foreground/80 sm:text-[13px]">
          <span className={cn(discount && "text-primary")}>{formatPrice(product.price, currency)}</span>
          {discount && product.oldPrice && (
            <span className="text-foreground/45 line-through">
              <span className="sr-only">Was </span>
              {formatPrice(product.oldPrice, currency)}
            </span>
          )}
        </p>

        {available && product.stock != null && product.stock <= LOW_STOCK_THRESHOLD && (
          <p className="mt-1 text-[11px] text-[#a8601a]">Only {product.stock} left</p>
        )}
        {available && minimumOrder > 1 && (
          <p className="mt-1 text-[11px] text-muted-foreground">Min. order {minimumOrder}</p>
        )}
      </div>

      {/* Always visible, so phones and tablets (no hover) can add from any listing. */}
      {!isAdmin && (
        <div className="relative z-10 mt-auto pt-3">
          <button
            type="button"
            disabled={!available}
            onClick={() => {
              addToCart(product, minimumOrder, product.colors[0])
              setAdded(true)
            }}
            aria-label={
              !available
                ? `${product.name} is sold out`
                : added
                  ? `${product.name} added to cart`
                  : `Add ${product.name} to cart`
            }
            className={cn(
              "sf-press flex min-h-10 w-full items-center justify-center gap-1.5 border text-[10px] font-medium uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:border-border disabled:text-foreground/40",
              added
                ? "border-foreground bg-foreground text-background"
                : "border-foreground text-foreground enabled:hover:bg-foreground enabled:hover:text-background",
            )}
          >
            {!available ? (
              "Sold out"
            ) : added ? (
              <>
                <Check className="sf-check-pop size-3.5" aria-hidden="true" /> Added
              </>
            ) : (
              "Add to cart"
            )}
          </button>
        </div>
      )}
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="sf-skeleton aspect-square rounded-none" />
      <div className="sf-skeleton mt-3 h-3 w-1/3" />
      <div className="sf-skeleton mt-2 h-4 w-3/4" />
      <div className="sf-skeleton mt-2 h-3 w-1/4" />
    </div>
  )
}

/** Responsive catalog grid: two columns on phones, four on desktop. */
export function ProductGrid({
  products,
  priorityCount = 0,
  className,
}: {
  products: Product[]
  priorityCount?: number
  className?: string
}) {
  return (
    <ul className={cn(gridClass, className)}>
      {products.map((product, index) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  )
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading products" className={cn(gridClass, className)}>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}
