"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Heart,
  MessageCircle,
  Share2,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Send,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react"
import { type Product, formatPrice, normalizeProduct, productMetaFromProduct } from "@/lib/data"
import { fetchApi } from "@/lib/api"
import { StarRating } from "@/components/star-rating"
import { ProductCard } from "@/components/product-card"
import { useStore } from "@/components/store-provider"
import { useAuth } from "@/components/auth-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { cn } from "@/lib/utils"
import { RecentlyViewedShelf } from "@/components/recently-viewed-shelf"
import { openWhatsApp, productEnquiryMessage } from "@/lib/whatsapp"

type Tab = "description" | "specifications" | "delivery" | "reviews"

type ProductReview = {
  id: number
  customerName: string
  rating: number
  comment: string
  status: string
  createdAt: string
}

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter()
  const { addToCart, cartCount, toggleWishlist, isInWishlist, recordRecentlyViewed } = useStore()
  const { user } = useAuth()
  const { currency } = useStoreSettings()
  const meta = productMetaFromProduct(product)
  const supplier = meta.supplier
  const wished = isInWishlist(product.id)
  const [related, setRelated] = useState<Product[]>([])
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewNotice, setReviewNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    recordRecentlyViewed(product)
  }, [product, recordRecentlyViewed])

  useEffect(() => {
    fetchApi<{ content?: Record<string, unknown>[] }>(
      `/api/products?category=${encodeURIComponent(product.category)}&size=8`,
    )
      .then((payload) => {
        const list = Array.isArray(payload?.content) ? payload.content : []
        setRelated(
          list
            .map(normalizeProduct)
            .filter((p) => p.id !== product.id)
            .slice(0, 4),
        )
      })
      .catch(() => setRelated([]))
  }, [product.category, product.id])

  useEffect(() => {
    let cancelled = false
    setReviewsLoading(true)
    fetchApi<Record<string, unknown>[]>(`/api/reviews/product/${product.id}`)
      .then((payload) => {
        if (cancelled) return
        const list = Array.isArray(payload) ? payload : []
        setReviews(
          list.map((review) => ({
            id: Number(review.id),
            customerName: String(review.customerName ?? "Verified buyer"),
            rating: Number(review.rating ?? 0),
            comment: String(review.comment ?? ""),
            status: String(review.status ?? "PUBLISHED"),
            createdAt: String(review.createdAt ?? ""),
          })),
        )
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [product.id])

  const gallery = (product.images?.length ? product.images : [product.image]).filter(Boolean)
  const [active, setActive] = useState(0)
  const [color, setColor] = useState(product.colors[0])
  const [qty, setQty] = useState(meta.moq)
  const [tab, setTab] = useState<Tab>("description")
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const isAdmin = user?.role === "admin"
  const canOrder = meta.inStock && meta.stock >= meta.moq

  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null
  const publishedRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : product.rating

  function handleAddToCart() {
    if (!canOrder) {
      setActionNotice({ type: "error", text: "This product is currently out of stock." })
      return
    }
    if (isAdmin) {
      setActionNotice({
        type: "error",
        text: "Admin accounts cannot add products to cart. Use a customer account for purchasing.",
      })
      return
    }
    addToCart(product, qty, color)
    setActionNotice({
      type: "success",
      text: `${qty} item${qty === 1 ? "" : "s"} added. Your cart now has ${cartCount + qty} item${cartCount + qty === 1 ? "" : "s"}.`,
    })
  }
  function handleBuyNow() {
    if (!canOrder) {
      setActionNotice({ type: "error", text: "This product is currently out of stock." })
      return
    }
    if (isAdmin) {
      setActionNotice({
        type: "error",
        text: "Admin accounts cannot place buyer orders. Use a customer account for purchasing.",
      })
      return
    }
    addToCart(product, qty, color)
    router.push("/checkout")
  }

  function handleWishlistToggle() {
    toggleWishlist(product)
    setActionNotice({
      type: "success",
      text: wished ? "Removed from your saved items." : "Saved to your wishlist for later.",
    })
  }

  async function handleShare() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: "Take a look at this furniture piece from Paje Dhow Furniture.",
          url,
        })
        setActionNotice({ type: "success", text: "Product shared." })
        return
      }
      if (!navigator.clipboard) throw new Error("Clipboard is unavailable")
      await navigator.clipboard.writeText(url)
      setActionNotice({ type: "success", text: "Product link copied to your clipboard." })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      setActionNotice({ type: "error", text: "The product link could not be shared." })
    }
  }

  function handleEnquiry() {
    openWhatsApp(
      productEnquiryMessage({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        productUrl: "/product/" + (product.slug || product.id),
      }),
    )
  }

  function showReviews() {
    setTab("reviews")
    window.requestAnimationFrame(() => {
      document.getElementById("product-details")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  async function handleReviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setReviewNotice(null)
    if (isAdmin) {
      setReviewNotice({ type: "error", text: "Admin accounts cannot submit buyer reviews." })
      return
    }
    if (reviewRating < 1) {
      setReviewNotice({ type: "error", text: "Choose a rating from 1 to 5 stars." })
      return
    }
    if (reviewComment.trim().length < 5) {
      setReviewNotice({ type: "error", text: "Write a short review before submitting." })
      return
    }

    setReviewSubmitting(true)
    try {
      await fetchApi("/api/account/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: Number(product.id),
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      })
      setReviewRating(0)
      setReviewComment("")
      setReviewNotice({
        type: "success",
        text: "Thank you. Your review was submitted and will appear after admin approval.",
      })
    } catch (error) {
      setReviewNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Your review could not be submitted.",
      })
    } finally {
      setReviewSubmitting(false)
    }
  }

  return (
    <div className="space-y-14 sm:space-y-16">
      <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-12 xl:gap-16">
        {/* Editorial product gallery */}
        <div className="min-w-0 lg:sticky lg:top-36">
          <div className="group relative aspect-square overflow-hidden rounded-[1.5rem] border border-border bg-secondary shadow-soft">
            <Image
              src={gallery[active] || "/placeholder.svg"}
              alt={`${product.name} — image ${active + 1} of ${gallery.length}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 54vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            />

            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-card/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground shadow-sm backdrop-blur">
                {product.category.replace(/-/g, " ")}
              </span>
              {discount && (
                <span className="rounded-full bg-destructive px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                  Save {discount}%
                </span>
              )}
            </div>

            <span className="absolute bottom-4 left-4 rounded-full bg-foreground/75 px-3 py-1.5 text-xs font-semibold text-background backdrop-blur">
              {active + 1} / {gallery.length}
            </span>

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActive((current) => (current - 1 + gallery.length) % gallery.length)}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-card/90 text-foreground shadow-md backdrop-blur transition hover:scale-105 hover:bg-card"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActive((current) => (current + 1) % gallery.length)}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-card/90 text-foreground shadow-md backdrop-blur transition hover:scale-105 hover:bg-card"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="scrollbar-none mt-4 flex gap-3 overflow-x-auto pb-1">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={active === index}
                  className={cn(
                    "relative size-[72px] shrink-0 overflow-hidden rounded-xl border bg-secondary transition-all sm:size-20",
                    active === index
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border opacity-70 hover:border-primary/50 hover:opacity-100",
                  )}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product summary and purchase controls */}
        <div className="min-w-0 lg:pt-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {product.category.replace(/-/g, " ")}
          </p>
          <h1 className="mt-3 text-balance text-3xl font-black leading-[1.08] tracking-[-0.035em] text-foreground sm:text-4xl xl:text-5xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <button
              type="button"
              onClick={showReviews}
              className="flex min-h-6 items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"
            >
              <StarRating rating={publishedRating} size="md" />
              <span>{publishedRating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({reviewsLoading ? product.reviews : reviews.length})
              </span>
            </button>
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <span className="text-muted-foreground">SKU {meta.sku}</span>
          </div>

          <div className="mt-7 border-y border-border py-5">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className="text-3xl font-black tracking-[-0.025em] text-primary sm:text-4xl">
                {formatPrice(product.price, currency)}
              </span>
              {product.oldPrice && (
                <span className="pb-1 text-base text-muted-foreground line-through sm:text-lg">
                  {formatPrice(product.oldPrice, currency)}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Reference price. Final pricing is confirmed before your order is processed.
            </p>
          </div>

          {product.shortDescription && (
            <p className="mt-6 text-base leading-7 text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-secondary/70 px-4 py-3 text-sm">
            <span className={cn("flex items-center gap-2 font-bold", meta.inStock ? "text-primary" : "text-destructive")}>
              <span className={cn("size-2 rounded-full", meta.inStock ? "bg-primary" : "bg-destructive")} />
              {meta.inStock ? "Available to order" : "Currently unavailable"}
            </span>
            {meta.inStock && (
              <span className="text-muted-foreground">
                {meta.stock} in stock · Minimum {meta.moq} {meta.moq === 1 ? "unit" : "units"}
              </span>
            )}
          </div>

          {supplier && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                {supplier.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <span className="truncate">{supplier.name}</span>
                  {supplier.verified && <BadgeCheck className="size-4 shrink-0 text-primary" />}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {supplier.location}, {supplier.country}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center justify-end gap-1 text-sm font-bold text-foreground">
                  <Star className="size-3.5 fill-accent text-accent" />
                  {supplier.rating}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Replies {supplier.responseTime}</p>
              </div>
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            {product.colors.length > 0 && (
              <div className="flex items-center justify-between gap-4 border-b border-border p-4 sm:p-5">
                <div>
                  <p className="text-sm font-bold text-foreground">Choose a finish</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Select your preferred colour</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2.5">
                  {product.colors.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setColor(option)}
                      aria-label={`Select colour ${option}`}
                      aria-pressed={color === option}
                      className={cn(
                        "size-9 rounded-full border-2 transition-all",
                        color === option
                          ? "border-card ring-2 ring-primary ring-offset-2 ring-offset-card"
                          : "border-border hover:scale-105",
                      )}
                      style={{ backgroundColor: option }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
              <div>
                <p className="text-sm font-bold text-foreground">Quantity</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Minimum order: {meta.moq}
                </p>
              </div>
              <div className="flex h-11 items-center overflow-hidden rounded-full border border-border bg-background">
                <button
                  type="button"
                  onClick={() => setQty((current) => Math.max(meta.moq, current - 1))}
                  disabled={qty <= meta.moq}
                  aria-label="Decrease quantity"
                  className="flex h-full w-11 items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-11 text-center text-sm font-black text-foreground" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((current) => Math.min(meta.stock, current + 1))}
                  disabled={!canOrder || qty >= meta.stock}
                  aria-label="Increase quantity"
                  className="flex h-full w-11 items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {actionNotice && (
            <div
              aria-live="polite"
              className={cn(
                "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
                actionNotice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800",
              )}
            >
              <span>{actionNotice.text}</span>
              {actionNotice.type === "success" && actionNotice.text.includes("added.") && (
                <Link href="/cart" className="font-bold underline underline-offset-2">
                  View cart
                </Link>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canOrder}
              className="interactive-press inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground shadow-elevated transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              <ShoppingBag className="size-5" />
              {canOrder ? `Add ${qty} to cart` : "Out of stock"}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!canOrder}
              className="interactive-press inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-foreground px-6 text-sm font-black text-background shadow-soft transition hover:-translate-y-0.5 hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              Buy now
              <ArrowRight className="size-5" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleWishlistToggle}
              aria-pressed={wished}
              className={cn(
                "group inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5",
                wished ? "border-primary/40 bg-primary/5 text-primary" : "border-border text-foreground",
              )}
            >
              <Heart className={cn("size-4 transition-transform group-hover:scale-110", wished && "fill-current")} />
              <span className="truncate">{wished ? "Saved" : "Save"}</span>
            </button>
            <button
              type="button"
              onClick={handleEnquiry}
              className="group inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-2 text-xs font-bold text-foreground transition hover:-translate-y-0.5 hover:border-[#25D366]/60 hover:bg-[#25D366]/5 hover:text-[#128C7E]"
            >
              <MessageCircle className="size-4 transition-transform group-hover:scale-110" />
              <span className="truncate">Contact supplier</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="group inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-2 text-xs font-bold text-foreground transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              <Share2 className="size-4 transition-transform group-hover:scale-110" />
              <span className="truncate">Share</span>
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
            No online payment required. Order details and delivery are confirmed with the seller.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section
        id="product-details"
        className="scroll-mt-36 overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-soft"
      >
        <div className="scrollbar-none flex overflow-x-auto border-b border-border bg-secondary/35 px-2 sm:px-5">
          {(
            [
              ["description", "Description"],
              ["specifications", "Specifications"],
              ["delivery", "Delivery & warranty"],
              ["reviews", `Reviews (${reviewsLoading ? product.reviews : reviews.length})`],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "shrink-0 border-b-2 px-4 py-4 text-sm font-bold transition-colors sm:px-5",
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 text-sm leading-7 text-muted-foreground sm:p-8 lg:p-10">
          {tab === "description" && (
            <div className="max-w-4xl space-y-5">
              <p className="whitespace-pre-line">
                {product.description
                  || `The ${product.name} is handcrafted by ${supplier?.name ?? "our artisans"} using durable ${product.material || "quality"} materials for long-lasting everyday use.`}
              </p>
              <ul className="grid list-disc gap-2 pl-5 marker:text-primary sm:grid-cols-2">
                <li>Premium {product.material || "furniture-grade"} finish with reinforced joints</li>
                <li>Solid hardwood frame for long-lasting durability</li>
                <li>Available in multiple colours; confirm options with the seller</li>
                <li>Professional delivery and assembly included</li>
              </ul>
            </div>
          )}

          {tab === "specifications" && (
            <div className="max-w-2xl overflow-hidden rounded-lg border border-border">
              {meta.specs.map((s, i) => (
                <div
                  key={s.label}
                  className={cn("flex items-center justify-between gap-4 px-4 py-2.5", i % 2 === 0 ? "bg-card" : "bg-secondary/40")}
                >
                  <span className="font-medium text-foreground">{s.label}</span>
                  <span className="text-right">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "delivery" && (
            <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
              <InfoBlock icon={Truck} title="Delivery">
                Estimated delivery in {meta.deliveryDays} business days
                {supplier?.country ? ` to ${supplier.country}` : ""}. Delivery fees are
                confirmed by the seller based on your location. Cash on delivery, bank transfer and mobile money are
                accepted offline.
              </InfoBlock>
              <InfoBlock icon={ShieldCheck} title="Warranty">
                {meta.warrantyMonths}-month manufacturer warranty against structural defects. Contact the seller on
                WhatsApp to arrange any warranty service.
              </InfoBlock>
              <InfoBlock icon={Clock} title="Lead time">
                Made-to-order customisations may extend the lead time. Discuss timelines directly with{" "}
                {supplier?.name ?? "the seller"}.
              </InfoBlock>
              <InfoBlock icon={Package} title="Assembly">
                Professional assembly is included on delivery for this item at no additional charge.
              </InfoBlock>
            </div>
          )}

          {tab === "reviews" && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{publishedRating.toFixed(1)}</p>
                    <StarRating rating={publishedRating} size="sm" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {reviewsLoading ? product.reviews : reviews.length} verified {reviews.length === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                  <p className="flex-1 text-sm leading-relaxed">
                    Published ratings and comments come from authenticated buyer accounts.
                  </p>
                </div>

                {reviewsLoading ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-10 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading reviews...
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-card px-5 py-10 text-center">
                    <p className="font-semibold text-foreground">No published reviews yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Be the first buyer to share your experience.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                    {reviews.map((review) => (
                      <article key={review.id} className="p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{review.customerName}</p>
                            <div className="mt-1">
                              <StarRating rating={review.rating} size="sm" />
                            </div>
                          </div>
                          {review.createdAt && (
                            <time className="text-xs text-muted-foreground" dateTime={review.createdAt}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </time>
                          )}
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {review.comment}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleReviewSubmit} className="h-fit rounded-lg border border-border bg-card p-5 shadow-soft">
                <h3 className="text-base font-bold text-foreground">Write a Review</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Share an honest review of this product. Reviews are published after admin approval.
                </p>

                {!user ? (
                  <div className="mt-5 rounded-md bg-secondary p-4 text-sm text-muted-foreground">
                    <p>Login or create an account to write a review.</p>
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/product/${product.slug || product.id}`)}`}
                      className="mt-3 inline-flex font-semibold text-primary hover:underline"
                    >
                      Login to review
                    </Link>
                  </div>
                ) : isAdmin ? (
                  <p className="mt-5 rounded-md border border-border bg-secondary p-4 text-sm text-muted-foreground">
                    Admin accounts moderate reviews and cannot submit buyer reviews.
                  </p>
                ) : (
                  <>
                    <fieldset className="mt-5">
                      <legend className="text-sm font-semibold text-foreground">Your rating</legend>
                      <div className="mt-2 flex gap-1" aria-label="Choose a rating from 1 to 5 stars">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setReviewRating(value)}
                            aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                            aria-pressed={reviewRating === value}
                            className="flex size-9 items-center justify-center rounded-md transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Star
                              className={cn(
                                "size-5",
                                value <= reviewRating ? "fill-accent text-accent" : "text-border",
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <label className="mt-4 block text-sm font-semibold text-foreground" htmlFor={`review-${product.id}`}>
                      Your review
                    </label>
                    <textarea
                      id={`review-${product.id}`}
                      required
                      minLength={5}
                      maxLength={1000}
                      rows={5}
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="Tell other buyers about quality, comfort, and your experience..."
                      className="mt-2 w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="mt-1 text-right text-[11px] text-muted-foreground">{reviewComment.length}/1000</p>

                    {reviewNotice && (
                      <p
                        role="status"
                        className={cn(
                          "mt-3 rounded-md border px-3 py-2.5 text-sm",
                          reviewNotice.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700",
                        )}
                      >
                        {reviewNotice.text}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reviewSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      {reviewSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </>
                )}
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Similar products */}
      {related.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                More to explore
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.025em] text-foreground sm:text-3xl">
                Similar products
              </h2>
            </div>
            <Link
              href={`/shop?category=${product.category}`}
              className="hidden min-h-6 items-center text-sm font-bold text-primary hover:underline sm:inline-flex"
            >
              View category
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewedShelf excludeId={product.id} />
    </div>
  )
}

function InfoBlock({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-primary" /> {title}
      </p>
      <p>{children}</p>
    </div>
  )
}
