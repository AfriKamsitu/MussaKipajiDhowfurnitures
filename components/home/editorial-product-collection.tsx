"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, Heart, ShoppingBag } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { fetchApi } from "@/lib/api"
import { formatPrice, normalizeProduct, type Product, type SpringPage } from "@/lib/data"
import { cn } from "@/lib/utils"

const arrangements = ["aspect-[4/5]", "aspect-[4/3] lg:mt-36", "aspect-[4/5] lg:mt-10"]
const fallbacks = [
  {
    name: "The Kaskazi Chair",
    detail: "Lounge chair · Reclaimed teak",
    image: "/reference-site/chair.jpg",
    href: "/shop?q=lounge%20chair",
  },
  {
    name: "The Pwani Daybed",
    detail: "Daybed · Dhow timber & linen",
    image: "/reference-site/sofa.jpg",
    href: "/shop?q=daybed",
  },
  {
    name: "The Lamu Console",
    detail: "Console · Teak & woven cane",
    image: "/reference-site/table.jpg",
    href: "/shop?q=console",
  },
]

export function EditorialProductCollection() {
  const { currency } = useStoreSettings()
  const { addToCart, isInWishlist, toggleWishlist } = useStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addedProduct, setAddedProduct] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetchApi<SpringPage<Record<string, unknown>>>("/api/products?size=12&sort=createdAt,desc")
      .then((payload) => {
        const list = Array.isArray(payload?.content) ? payload.content.map(normalizeProduct) : []
        const selected = [...list].sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image))).slice(0, 3)
        setProducts(selected)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!addedProduct) return
    const timeout = window.setTimeout(() => setAddedProduct(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [addedProduct])

  if (loading) {
    return (
      <div className="mt-16 grid gap-12 md:grid-cols-3 lg:mt-24 lg:gap-6" aria-label="Loading selected furniture">
        {arrangements.map((shape, index) => (
          <div key={shape} className={cn(shape, "animate-pulse bg-[#e6e0d4]")} style={{ animationDelay: `${index * 100}ms` }} />
        ))}
      </div>
    )
  }

  const cards = fallbacks.map((fallback, index) => ({ fallback, product: products[index] }))

  return (
    <div className="mt-16 grid gap-12 md:grid-cols-3 lg:mt-24 lg:gap-6">
      <p className="sr-only" role="status" aria-live="polite">
        {addedProduct ? `${addedProduct.name} added to cart` : ""}
      </p>
      {cards.map(({ fallback, product }, index) => {
        const name = product?.name || fallback.name
        const href = product ? `/product/${product.slug || product.id}` : fallback.href
        const image = product?.image || fallback.image
        const detail = product
          ? `${product.material || "Handcrafted timber"} · MOQ ${Math.max(product.moq ?? 1, 1)}`
          : fallback.detail
        const wished = product ? isInWishlist(product.id) : false
        const available = product ? product.inStock ?? (product.stock == null || product.stock > 0) : false

        return (
          <Reveal key={product?.id || fallback.name} className={arrangements[index]} delay={index * 90}>
            <article className="group flex h-full flex-col">
              <div className="relative h-full min-h-[420px] overflow-hidden bg-[#e6e0d4] md:min-h-0">
                <Link href={href} className="absolute inset-0">
                  <Image
                    src={image}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={cn(
                      "transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]",
                      "object-cover",
                    )}
                  />
                </Link>
                {product && (
                  <div className="absolute right-3 top-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product)}
                      className="grid size-10 place-items-center rounded-full bg-white/92 text-[#11130f] shadow-lg backdrop-blur transition duration-300 hover:scale-105"
                      aria-label={wished ? `Remove ${name} from saved items` : `Save ${name}`}
                    >
                      <Heart className={cn("size-4", wished && "fill-[#9b5e3b] text-[#9b5e3b]")} />
                    </button>
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        addToCart(product, Math.max(product.moq ?? 1, 1), product.colors[0])
                        setAddedProduct({ id: product.id, name })
                      }}
                      className="grid size-10 place-items-center rounded-full bg-[#263228] text-white shadow-lg transition duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45"
                      aria-label={addedProduct?.id === product.id ? `${name} added to cart` : available ? `Add ${name} to cart` : `${name} is made to order`}
                    >
                      {addedProduct?.id === product.id ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-5 pt-4">
                <div className="min-w-0">
                  <Link href={href} className="text-lg font-medium tracking-[-0.03em] transition-colors hover:text-[#9b5e3b]">
                    {name}
                  </Link>
                  <p className="mt-1 text-[11px] text-[#66675f]">{detail}</p>
                  {product && <p className="mt-2 text-sm font-bold">{formatPrice(product.price, currency)}</p>}
                </div>
                <Link href={href} aria-label={`View ${name}`} className="-mr-3 -mt-2 grid size-10 shrink-0 place-items-center rounded-full text-[#9b5e3b] transition-colors hover:bg-[#f1eee6]">
                  <ArrowRight className="size-4 -rotate-45 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              </div>
            </article>
          </Reveal>
        )
      })}
    </div>
  )
}
