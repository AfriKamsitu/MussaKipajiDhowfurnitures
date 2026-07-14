"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Minus,
  Package,
  Plus,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react"
import { type Product, formatPrice, normalizeProduct, productMetaFromProduct } from "@/lib/data"
import { fetchApi } from "@/lib/api"
import { StarRating } from "@/components/star-rating"
import { ProductCard } from "@/components/product-card"
import { useStore } from "@/components/store-provider"
import { openWhatsApp, productEnquiryMessage } from "@/lib/whatsapp"
import { WhatsAppGlyph } from "@/components/whatsapp-glyph"
import { cn } from "@/lib/utils"

type Tab = "description" | "specifications" | "delivery" | "reviews"

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter()
  const { toggleWishlist, isInWishlist } = useStore()
  const meta = productMetaFromProduct(product)
  const supplier = meta.supplier
  const [related, setRelated] = useState<Product[]>([])

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

  const gallery = [product.image].filter(Boolean)
  const [active, setActive] = useState(0)
  const [color, setColor] = useState(product.colors[0])
  const [qty, setQty] = useState(meta.moq)
  const [tab, setTab] = useState<Tab>("description")
  const [compared, setCompared] = useState(false)
  const wished = isInWishlist(product.id)

  const ref = { id: product.id, name: product.name, price: product.price, image: product.image }
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null

  function handleChat() {
    openWhatsApp(productEnquiryMessage(ref))
  }

  function handlePlaceOrder() {
    openWhatsApp(
      `Hello Paje Dhow Furniture, I would like to place an order for *${product.name}* (Qty: ${qty}). Please confirm availability, final price and delivery details.`,
    )
  }

  function handleCompare() {
    if (typeof window !== "undefined") {
      try {
        const list = JSON.parse(window.localStorage.getItem("pajedhow.compare") ?? "[]") as string[]
        const next = list.includes(product.id) ? list.filter((x) => x !== product.id) : [...list, product.id]
        window.localStorage.setItem("pajedhow.compare", JSON.stringify(next))
        setCompared(next.includes(product.id))
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
          <div className="flex flex-row gap-3 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible sm:pb-0">
            {gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={cn(
                  "relative size-14 shrink-0 overflow-hidden rounded-md border-2 bg-secondary sm:size-16",
                  active === i ? "border-accent" : "border-border",
                )}
                aria-label={`View image ${i + 1}`}
              >
                <Image src={img || "/placeholder.svg"} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
          <div className="relative aspect-square flex-1 overflow-hidden rounded-lg border border-border bg-secondary">
            <Image
              src={gallery[active] || "/placeholder.svg"}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <button
              onClick={() => setActive((a) => (a - 1 + gallery.length) % gallery.length)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md hover:bg-secondary"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % gallery.length)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md hover:bg-secondary"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold text-balance text-foreground sm:text-3xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <StarRating rating={product.rating} size="md" />
              <span className="text-sm text-muted-foreground">({product.reviews} Reviews)</span>
            </div>
            <span className="text-sm text-muted-foreground">SKU: {meta.sku}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>
            )}
            {discount && (
              <span className="rounded bg-destructive px-2 py-1 text-xs font-semibold text-primary-foreground">
                -{discount}%
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Price shown is for reference. Final pricing is confirmed by the seller via WhatsApp or quotation.
          </p>

          {/* Stock + MOQ */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className={cn("flex items-center gap-1.5 font-medium", meta.inStock ? "text-primary" : "text-destructive")}>
              <span className={cn("size-2 rounded-full", meta.inStock ? "bg-primary" : "bg-destructive")} />
              {meta.inStock ? `In Stock (${meta.stock} available)` : "Out of Stock"}
            </span>
            <span className="text-muted-foreground">Min. order: {meta.moq} unit(s)</span>
          </div>

          {/* Supplier card */}
          {supplier && (
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {supplier.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <span className="truncate">{supplier.name}</span>
                  {supplier.verified && <BadgeCheck className="size-4 shrink-0 text-primary" />}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {supplier.location}, {supplier.country}
                </p>
              </div>
              <div className="text-right leading-tight">
                <div className="flex items-center justify-end gap-1 text-sm font-semibold text-foreground">
                  <StarRating rating={supplier.rating} size="sm" /> {supplier.rating}
                </div>
                <p className="text-[11px] text-muted-foreground">Replies {supplier.responseTime}</p>
              </div>
            </div>
          )}

          {/* Color */}
          <div className="mt-5 flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Color:</span>
            <div className="flex gap-2.5">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={cn(
                    "size-8 rounded-full border-2 transition-all",
                    color === c ? "border-accent ring-2 ring-accent/30" : "border-border",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-5 flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Quantity:</span>
            <div className="flex items-center rounded-md border border-border">
              <button
                onClick={() => setQty((q) => Math.max(meta.moq, q - 1))}
                aria-label="Decrease quantity"
                className="flex size-9 items-center justify-center text-foreground hover:bg-secondary"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="flex size-9 items-center justify-center text-foreground hover:bg-secondary"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Primary marketplace actions */}
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={handleChat}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1ebe5b]"
            >
              <WhatsAppGlyph className="size-4" />
              Chat on WhatsApp
            </button>
            <button
              onClick={handlePlaceOrder}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ShoppingBag className="size-4" />
              Place Order
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <button
              onClick={() => toggleWishlist(product)}
              className={cn("flex items-center gap-2 transition-colors hover:text-accent", wished && "text-accent")}
            >
              <Heart className={cn("size-4", wished && "fill-accent")} />
              {wished ? "In Wishlist" : "Add to Wishlist"}
            </button>
            <button
              onClick={handleCompare}
              className={cn("flex items-center gap-2 transition-colors hover:text-accent", compared && "text-accent")}
            >
              <Repeat className="size-4" />
              {compared ? "Added to Compare" : "Compare"}
            </button>
          </div>

          {/* Quick assurance row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Assurance icon={Truck} title="Delivery" value={`${meta.deliveryDays} days`} />
            <Assurance icon={ShieldCheck} title="Warranty" value={`${meta.warrantyMonths} months`} />
            <Assurance icon={Package} title="Assembly" value="Included" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex flex-wrap gap-1 border-b border-border">
          {(
            [
              ["description", "Description"],
              ["specifications", "Specifications"],
              ["delivery", "Delivery & Warranty"],
              ["reviews", `Reviews (${product.reviews})`],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="py-5 text-sm leading-relaxed text-muted-foreground">
          {tab === "description" && (
            <div className="max-w-3xl space-y-3">
              <p>
                The {product.name} blends premium {product.material.toLowerCase()} construction with a timeless silhouette
                that suits modern and classic interiors alike. Each piece is crafted by{" "}
                {supplier?.name ?? "our artisans"} using
                durable, responsibly sourced materials for years of comfortable use.
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Premium {product.material.toLowerCase()} finish with reinforced joints</li>
                <li>Solid hardwood frame for long-lasting durability</li>
                <li>Available in multiple colours — confirm options with the seller</li>
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
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{product.rating}</p>
                  <StarRating rating={product.rating} size="sm" />
                  <p className="mt-1 text-xs text-muted-foreground">{product.reviews} reviews</p>
                </div>
                <p className="flex-1 text-sm">
                  Ratings come from verified buyers. Message us on WhatsApp if you have questions before ordering
                  {supplier?.name ? ` from ${supplier.name}` : ""}.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Customer review details load from the product reviews API once buyers submit ratings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Similar products */}
      {related.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-foreground sm:text-xl">Similar Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Assurance({ icon: Icon, title, value }: { icon: React.ElementType; title: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3">
      <Icon className="size-5 shrink-0 text-primary" />
      <div className="leading-tight">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
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
