"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart, ScanSearch, Star } from "lucide-react"
import { type Product, formatPrice } from "@/lib/data"
import { useStore } from "@/components/store-provider"
import { openWhatsApp, productEnquiryMessage } from "@/lib/whatsapp"
import { WhatsAppGlyph } from "@/components/whatsapp-glyph"
import { cn } from "@/lib/utils"

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, isInWishlist } = useStore()
  const wished = isInWishlist(product.id)

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-elevated">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-secondary">
        <Link href={`/product/${product.slug || product.id}`} className="absolute inset-0 block">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>
        {product.isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground shadow-accent-glow">
            New
          </span>
        )}
        {/* Alibaba-style quick-view magnifier (bottom-left) */}
        <Link
          href={`/product/${product.slug || product.id}`}
          aria-label={`Quick view ${product.name}`}
          className="absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-soft backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:text-accent"
        >
          <ScanSearch className="size-4" />
        </Link>
        {/* Wishlist (top-right) */}
        <button
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => toggleWishlist(product)}
          className={cn(
            "absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-card/90 shadow-soft backdrop-blur-sm transition-all duration-200 hover:scale-110",
            wished ? "text-accent" : "text-muted-foreground hover:text-accent",
          )}
        >
          <Heart className={cn("size-4 transition-transform", wished && "scale-110 fill-accent")} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <Link
          href={`/product/${product.slug || product.id}`}
          className="line-clamp-2 text-sm leading-snug text-foreground transition-colors hover:text-accent"
        >
          {product.name}
        </Link>

        <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-accent text-accent" />
          <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
          <span>({product.reviews})</span>
          <span className="mx-1 text-border">|</span>
          <span className="truncate">{product.material}</span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Link
            href={`/product/${product.slug || product.id}`}
            className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View Details
          </Link>
          <button
            onClick={() =>
              openWhatsApp(
                productEnquiryMessage({ id: product.id, name: product.name, price: product.price, image: product.image }),
              )
            }
            aria-label="Chat on WhatsApp"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white transition-colors hover:bg-[#1ebe5b]"
          >
            <WhatsAppGlyph className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
