"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Banknote, Heart, Minus, Plus, Share2, ShoppingCart, Store, Truck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductReviews } from "@/components/product/product-reviews"
import { useCategories } from "@/components/categories-provider"
import { availabilityLabel, ProductGrid } from "@/components/product-card"
import { SectionHeader } from "@/components/product-rail"
import { RecentlyViewedShelf } from "@/components/recently-viewed-shelf"
import { StarRating } from "@/components/star-rating"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { WhatsAppGlyph } from "@/components/whatsapp-glyph"
import { discountPercent, hasReviews, isAvailable, listProducts, productHref } from "@/lib/catalog"
import { formatPrice, type Product } from "@/lib/data"
import { deliveryFee, OFFERS_DELIVERY } from "@/lib/pricing"
import { cn } from "@/lib/utils"
import { openWhatsApp, productEnquiryMessage } from "@/lib/whatsapp"

type Notice = { type: "success" | "error"; text: string }

const RELATED_LIMIT = 8

export function ProductDetail({
  product,
  initialRelated,
}: {
  product: Product
  /** Same-category products read on the server; null means the browser should load them. */
  initialRelated?: Product[] | null
}) {
  const router = useRouter()
  const { user } = useAuth()
  const settings = useStoreSettings()
  const { cart, addToCart, toggleWishlist, isInWishlist, recordRecentlyViewed } = useStore()
  const categories = useCategories()
  const [related, setRelated] = useState<Product[]>(initialRelated ?? [])
  const categoryName =
    categories.find((category) => category.slug === product.category)?.name
    ?? product.category.replace(/-/g, " ")
  const [notice, setNotice] = useState<Notice | null>(null)

  const isAdmin = user?.role === "admin"
  const wished = isInWishlist(product.id)
  const available = isAvailable(product)
  const availability = availabilityLabel(product)
  const discount = discountPercent(product)
  const minimumOrder = Math.max(1, product.moq ?? 1)
  const maximum = product.stock != null ? Math.max(0, product.stock) : Number.POSITIVE_INFINITY
  const inCart = cart.find((item) => item.product.id === product.id)?.quantity ?? 0
  const remaining = maximum - inCart
  const canOrder = available && maximum >= minimumOrder
  const gallery = [...new Set([product.image, ...(product.images ?? [])].filter(Boolean))]

  const [color, setColor] = useState<string | undefined>(product.colors[0])
  const [quantity, setQuantity] = useState(minimumOrder)

  useEffect(() => {
    recordRecentlyViewed(product)
  }, [product, recordRecentlyViewed])

  useEffect(() => {
    if (initialRelated) return
    let cancelled = false
    // Related products: same category as this product, never the product itself.
    listProducts({ category: product.category, size: RELATED_LIMIT + 1 })
      .then((page) => {
        if (cancelled) return
        setRelated(
          page.content
            .filter((item) => item.category === product.category && item.id !== product.id)
            .slice(0, RELATED_LIMIT),
        )
      })
      .catch(() => {
        if (!cancelled) setRelated([])
      })
    return () => {
      cancelled = true
    }
  }, [initialRelated, product.category, product.id])

  /** Returns false (and explains why) when nothing could be added. */
  function addSelection() {
    if (!canOrder) {
      setNotice({ type: "error", text: "This product is currently out of stock." })
      return false
    }
    if (isAdmin) {
      setNotice({ type: "error", text: "Admin accounts cannot shop. Sign in with a customer account to order." })
      return false
    }
    if (remaining <= 0) {
      setNotice({ type: "error", text: "All available stock of this product is already in your cart." })
      return false
    }
    setNotice(null)
    addToCart(product, quantity, color)
    return true
  }

  function handleBuyNow() {
    // Stock already in the cart still lets the buyer continue to checkout.
    if (addSelection() || (canOrder && !isAdmin && inCart > 0)) router.push("/checkout")
  }

  async function handleShare() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setNotice({ type: "success", text: "Link copied." })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      setNotice({ type: "error", text: "The link could not be shared." })
    }
  }

  const deliveryDays = product.deliveryDays ?? settings.estimatedDeliveryDays
  const fee = deliveryFee(settings, product.price * quantity)
  const region = [settings.city, settings.country].filter(Boolean).join(", ")

  const specs = [
    { label: "Material", value: product.material },
    { label: "Colours", value: product.colors.join(", ") },
    { label: "Category", value: product.category.replace(/-/g, " ") },
    { label: "SKU", value: product.sku },
    {
      label: "Warranty",
      value: product.warrantyMonths ? `${product.warrantyMonths} months` : "",
    },
    { label: "Minimum order", value: minimumOrder > 1 ? `${minimumOrder} pieces` : "" },
    {
      label: "Made by",
      value: product.supplier
        ? [product.supplier.name, product.supplier.location].filter(Boolean).join(", ")
        : "",
    },
  ].filter((spec) => spec.value)

  const specList = specs.length > 0 && (
    <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5 border-t border-border pt-4 text-sm">
      {specs.map((spec) => (
        <div key={spec.label} className="contents">
          <dt className="font-bold text-foreground">{spec.label}</dt>
          <dd className="capitalize text-muted-foreground">{spec.value}</dd>
        </div>
      ))}
    </dl>
  )

  const titleBlock = (
    <>
      <h1 className="text-xl font-bold leading-snug tracking-[-0.015em] text-foreground sm:text-2xl">
        {product.name}
      </h1>

      {hasReviews(product) && (
        <a href="#reviews" className="mt-1.5 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <StarRating rating={product.rating} size="md" />
          {product.rating.toFixed(1)} · {product.reviews} {product.reviews === 1 ? "review" : "reviews"}
        </a>
      )}
    </>
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Phones and tablets lead with the name, then the pictures, then price and buying controls. */}
      <div className="lg:hidden">{titleBlock}</div>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_300px]">
        <div className="lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:self-start">
          <ProductGallery key={product.id} images={gallery} name={product.name} />
        </div>

        <div className="min-w-0">
          <div className="hidden lg:block">{titleBlock}</div>

          <div className="border-border lg:mt-3 lg:border-t lg:pt-3">
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              {discount && <span className="text-xl font-bold text-deal sm:text-2xl">-{discount}%</span>}
              <span className="text-2xl font-bold text-foreground sm:text-3xl">
                {formatPrice(product.price, settings.currency)}
              </span>
            </p>
            {discount && product.oldPrice && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Was <span className="line-through">{formatPrice(product.oldPrice, settings.currency)}</span>
                {" · "}
                You save {formatPrice(product.oldPrice - product.price, settings.currency)}
              </p>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{product.shortDescription}</p>
          )}

          {product.colors.length > 0 && (
            <fieldset className="mt-4">
              <legend className="text-sm text-muted-foreground">
                Colour: <span className="font-bold capitalize text-foreground">{color}</span>
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={color === option}
                    onClick={() => setColor(option)}
                    className={cn(
                      "min-h-10 rounded-md border px-3.5 text-sm capitalize",
                      color === option
                        ? "border-primary bg-primary/10 font-bold text-primary ring-1 ring-primary"
                        : "border-input bg-card hover:border-primary",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* On phones the specifications follow the buy box so purchasing comes first. */}
          <div className="hidden lg:block">{specList}</div>
        </div>

        {/* Buy box */}
        <aside
          aria-label="Purchase options"
          className="sf-card h-fit p-4 lg:col-span-2 xl:sticky xl:top-[calc(var(--site-header-height)+1rem)] xl:col-span-1"
        >
          {/* Below xl the price already sits directly above this box. */}
          <p className="hidden text-xl font-bold text-foreground xl:block">{formatPrice(product.price, settings.currency)}</p>
          <p
            className={cn(
              "text-base font-bold xl:mt-1",
              availability.tone === "in" && "text-success",
              availability.tone === "low" && "text-[#a8601a]",
              availability.tone === "out" && "text-deal",
            )}
          >
            {availability.text}
          </p>

          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {OFFERS_DELIVERY && deliveryDays > 0 && (
              <li className="flex gap-2">
                <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  Delivery in about <span className="font-semibold text-foreground">{deliveryDays} days</span>
                  {region ? ` from ${region}` : ""}
                  {" · "}
                  {fee > 0 ? `${formatPrice(fee, settings.currency)} delivery` : "no delivery charge"}
                </span>
              </li>
            )}
            {(settings.storePickupEnabled || !OFFERS_DELIVERY) && (
              <li className="flex gap-2">
                <Store className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                {OFFERS_DELIVERY ? "Store pickup available" : "Collect from our store"}
              </li>
            )}
            {(settings.cashOnDeliveryEnabled || settings.bankTransferEnabled) && (
              <li className="flex gap-2">
                <Banknote className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                {[
                  settings.cashOnDeliveryEnabled && (OFFERS_DELIVERY ? "Cash on delivery" : "Pay on collection"),
                  settings.bankTransferEnabled && "Bank transfer",
                ]
                  .filter(Boolean)
                  .join(" or ")}
              </li>
            )}
          </ul>

          {canOrder && (
            <div className="mt-4 flex items-center gap-3">
              <span id="quantity-label" className="text-sm font-semibold text-foreground">
                Quantity
              </span>
              <div
                role="group"
                aria-labelledby="quantity-label"
                className="flex items-center border border-input bg-card"
              >
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(minimumOrder, current - 1))}
                  disabled={quantity <= minimumOrder}
                  aria-label="Decrease quantity"
                  className="grid size-10 place-items-center hover:bg-secondary disabled:opacity-40"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-9 text-center text-sm font-bold" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(maximum, current + 1))}
                  disabled={quantity >= maximum}
                  aria-label="Increase quantity"
                  className="grid size-10 place-items-center hover:bg-secondary disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-2">
            <button type="button" onClick={addSelection} disabled={!canOrder} className="sf-btn sf-btn-primary w-full">
              <ShoppingCart className="size-4" aria-hidden="true" />
              {canOrder ? "Add to cart" : "Out of stock"}
            </button>
            {canOrder && (
              <button type="button" onClick={handleBuyNow} className="sf-btn sf-btn-dark w-full">
                Buy now
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                openWhatsApp(
                  productEnquiryMessage({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    productUrl: productHref(product),
                  }),
                )
              }
              className="sf-btn sf-btn-outline w-full"
            >
              <WhatsAppGlyph className="size-4 text-[#1a9d4c]" />
              Ask on WhatsApp
            </button>
          </div>

          {inCart > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {inCart} already in your cart.
            </p>
          )}

          {notice && (
            <p
              role={notice.type === "error" ? "alert" : "status"}
              className={cn(
                "mt-3 rounded-md px-3 py-2 text-sm",
                notice.type === "error" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
              )}
            >
              {notice.text}
            </p>
          )}

          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-pressed={wished}
              className="sf-btn sf-btn-ghost sf-btn-sm flex-1"
            >
              <Heart className={cn("size-4", wished && "fill-deal text-deal")} aria-hidden="true" />
              {wished ? "Saved" : "Save"}
            </button>
            <button type="button" onClick={handleShare} className="sf-btn sf-btn-ghost sf-btn-sm flex-1">
              <Share2 className="size-4" aria-hidden="true" />
              Share
            </button>
          </div>
        </aside>

        {specs.length > 0 && (
          <section aria-label="Specifications" className="sf-card px-4 pb-4 lg:hidden">
            {specList}
          </section>
        )}
      </section>

      {product.description && (
        <section aria-labelledby="description-title" className="sf-card p-4 sm:p-6">
          <h2 id="description-title" className="text-lg font-bold text-foreground sm:text-xl">
            About this piece
          </h2>
          <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {product.description}
          </p>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-title">
          <SectionHeader
            id="related-title"
            title={`More from ${categoryName}`}
            href={`/shop?category=${encodeURIComponent(product.category)}`}
          />
          <ProductGrid products={related} />
        </section>
      )}

      <ProductReviews product={product} />

      <RecentlyViewedShelf excludeId={product.id} />
    </div>
  )
}
