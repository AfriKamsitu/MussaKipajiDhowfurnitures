"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { BadgeCheck, Check, Heart, MessageCircle, ShoppingCart, Star } from "lucide-react"
import { type Product, formatPrice } from "@/lib/data"
import { useStore } from "@/components/store-provider"
import { useAuth } from "@/components/auth-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { cn } from "@/lib/utils"

type ProductCardLayout = "grid" | "list" | "compact"

export function ProductCard({
  product,
  layout = "grid",
}: {
  product: Product
  layout?: ProductCardLayout
}) {
  const { user } = useAuth()
  const { currency } = useStoreSettings()
  const { addToCart, toggleWishlist, isInWishlist } = useStore()
  const [cartState, setCartState] = useState<"idle" | "added" | "blocked">("idle")
  const wished = isInWishlist(product.id)
  const productHref = "/product/" + (product.slug || product.id)
  const minimumOrder = Math.max(1, product.moq ?? 1)
  const available = product.inStock ?? (product.stock == null || product.stock > 0)
  const supplierName = product.supplier?.name || "Paje Dhow Furniture"
  const supplierLocation = product.supplier?.location || "Zanzibar"
  const compact = layout === "compact"
  const contactHref =
    "/contact?request=" +
    encodeURIComponent(
      "I would like a quotation for " +
        product.name +
        ". Minimum order: " +
        minimumOrder +
        ". Please share available finishes, timing, and delivery options.",
    )

  useEffect(() => {
    if (cartState === "idle") return
    const timeout = window.setTimeout(() => setCartState("idle"), 2200)
    return () => window.clearTimeout(timeout)
  }, [cartState])

  function handleAddToCart() {
    if (!available) return
    if (user?.role === "admin") {
      setCartState("blocked")
      return
    }
    addToCart(product, minimumOrder, product.colors[0])
    setCartState("added")
  }

  return (
    <article
      className={cn(
        "motion-card product-grid-card group flex min-w-0 flex-col overflow-hidden rounded-[0.95rem] border border-black/8 bg-white shadow-[0_14px_34px_-30px_rgba(17,19,15,0.7)] transition-all duration-300 focus-within:border-accent/45",
        compact && "snap-start rounded-[0.85rem]",
        layout === "list" && "sm:grid sm:grid-cols-[280px_minmax(0,1fr)] sm:hover:-translate-y-0",
      )}
    >
      <div
        className={cn(
          "relative aspect-square overflow-hidden bg-[#f5f4f0]",
          layout === "list" && "sm:aspect-auto sm:min-h-72",
        )}
      >
        <Link href={productHref} className="absolute inset-0 block">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes={
              compact
                ? "(max-width: 640px) 43vw, 210px"
                : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
            }
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
          />
        </Link>

        <div className="absolute left-2 right-14 top-2 flex flex-wrap gap-1 sm:left-3 sm:top-3">
          {product.isNew && (
            <span className="rounded-full bg-primary px-2 py-1 text-[8px] font-black uppercase tracking-wide text-primary-foreground sm:px-2.5 sm:text-[9px]">
              New
            </span>
          )}
          {!compact && (
            <span
              className={cn(
                "hidden rounded-full bg-white/94 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide shadow-sm backdrop-blur-sm sm:inline-flex",
                available ? "text-emerald-700" : "text-primary",
              )}
            >
              {available ? "Ready to order" : "Made to order"}
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={wished ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
          onClick={() => toggleWishlist(product)}
          className={cn(
            "absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-white/94 shadow-soft backdrop-blur-sm transition-all duration-200 hover:scale-105 sm:right-3 sm:top-3",
            wished ? "text-primary" : "text-muted-foreground hover:text-primary",
          )}
        >
          <Heart className={cn("size-4 transition-transform", wished && "scale-110 fill-primary")} />
        </button>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col p-2.5 sm:p-3.5",
          compact && "p-2.5",
          layout === "list" && "sm:p-6",
        )}
      >
        <h3>
          <Link
            href={productHref}
            className={cn(
              "line-clamp-2 min-h-[2.3rem] text-[13px] font-bold leading-[1.15rem] text-foreground transition-colors hover:text-primary sm:min-h-[2.5rem] sm:text-sm sm:leading-5",
              compact && "min-h-[2.2rem] text-[12px] leading-[1.1rem] sm:text-[13px]",
              layout === "list" && "sm:min-h-0 sm:text-xl",
            )}
          >
            {product.name}
          </Link>
        </h3>

        {layout === "list" && product.shortDescription && (
          <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-muted-foreground sm:line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "text-[16px] font-black leading-tight text-foreground sm:text-lg",
              compact && "text-[14px] sm:text-base",
              layout === "list" && "sm:text-2xl",
            )}
          >
            {formatPrice(product.price, currency)}
          </span>
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-[10px] text-muted-foreground line-through sm:text-xs">
              {formatPrice(product.oldPrice, currency)}
            </span>
          )}
        </div>

        <p className="mt-1 text-[10px] font-semibold leading-4 text-foreground/75 sm:text-[11px]">
          MOQ: {minimumOrder} {minimumOrder === 1 ? "piece" : "pieces"}
          {!compact && (
            <span className="hidden text-muted-foreground min-[370px]:inline">
              {available && product.stock != null
                ? " · " + Math.max(0, product.stock) + " available"
                : ""}
            </span>
          )}
        </p>

        {!compact && (
          <div className="mt-2 border-t border-border pt-2.5">
            <div className="flex min-w-0 items-center gap-1.5">
              {product.supplier?.verified && (
                <BadgeCheck
                  className="size-4 shrink-0 fill-sky-600 text-white"
                  aria-label="Verified supplier"
                />
              )}
              <span className="truncate text-[10px] font-black text-foreground sm:text-[11px]">
                {supplierName}
              </span>
              <span className="hidden shrink-0 text-[10px] text-muted-foreground lg:inline">
                · {supplierLocation}
              </span>
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-foreground">{product.rating.toFixed(1)}</span>
              <span>({product.reviews})</span>
              <span className="mx-1 text-border">|</span>
              <span className="hidden truncate min-[370px]:inline">{product.material}</span>
            </div>
          </div>
        )}

        {!compact && (
          <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] gap-2 pt-3">
            <Link
              href={contactHref}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-primary px-2 text-[10px] font-black text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground sm:px-3 sm:text-xs"
            >
              <MessageCircle className="size-3.5" />
              <span className="sm:hidden">Enquire</span>
              <span className="hidden sm:inline">Contact supplier</span>
            </Link>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!available}
              aria-label={
                !available
                  ? product.name + " is made to order"
                  : cartState === "added"
                    ? product.name + " added to cart"
                    : "Add " + product.name + " to cart"
              }
              title={
                !available
                  ? "Contact the workshop to order"
                  : cartState === "blocked"
                    ? "Admin accounts cannot use the buyer cart"
                    : "Add minimum quantity to cart"
              }
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
                cartState === "added"
                  ? "bg-emerald-600"
                  : cartState === "blocked"
                    ? "bg-destructive"
                    : "bg-primary hover:bg-accent",
              )}
            >
              {cartState === "added" ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
            </button>
          </div>
        )}

        <p aria-live="polite" className="sr-only">
          {cartState === "added"
            ? `${product.name}: minimum quantity added to cart`
            : cartState === "blocked"
              ? "Buyer accounts only"
              : ""}
        </p>
      </div>
    </article>
  )
}