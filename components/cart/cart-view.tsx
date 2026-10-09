"use client"

import { SafeImage as Image } from "@/components/safe-image"
import Link from "next/link"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import type { Product } from "@/lib/data"
import { useAuth } from "@/components/auth-provider"
import { EmptyState } from "@/components/state-panels"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { isAvailable, productHref } from "@/lib/catalog"
import { formatPrice } from "@/lib/data"
import { deliveryFee, OFFERS_DELIVERY } from "@/lib/pricing"

export function CartView() {
  const settings = useStoreSettings()
  const { currency } = settings
  const { cart, cartCount, cartTotal, hydrated, wishlist, updateQuantity, removeFromCart, addToCart, toggleWishlist, isInWishlist } =
    useStore()

  /** Moves a line out of the cart into the saved list (kept on this device). */
  function saveForLater(product: Product) {
    if (!isInWishlist(product.id)) toggleWishlist(product)
    removeFromCart(product.id)
  }

  function moveToCart(product: Product) {
    addToCart(product, Math.max(1, product.moq ?? 1), product.colors[0])
    toggleWishlist(product)
  }

  const cartIds = new Set(cart.map((item) => item.product.id))
  const savedForLater = wishlist.filter((product) => !cartIds.has(product.id))

  const savedSection = savedForLater.length > 0 && (
    <section aria-labelledby="saved-for-later" className="sf-card mt-5">
      <h2 id="saved-for-later" className="border-b border-border px-4 py-3 text-base font-bold text-foreground">
        Saved for later ({savedForLater.length})
      </h2>
      <ul className="divide-y divide-border">
        {savedForLater.map((product) => (
          <li key={product.id} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
            <Link href={productHref(product)} className="relative size-20 shrink-0 overflow-hidden rounded-md bg-secondary">
              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill sizes="80px" className="object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={productHref(product)} className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary">
                {product.name}
              </Link>
              <p className="mt-0.5 text-sm font-bold text-foreground">{formatPrice(product.price, currency)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <button
                  type="button"
                  onClick={() => moveToCart(product)}
                  disabled={!isAvailable(product)}
                  className="sf-btn sf-btn-outline sf-btn-sm"
                >
                  {isAvailable(product) ? "Move to cart" : "Out of stock"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className="min-h-9 text-[13px] font-semibold text-primary hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
  const { user } = useAuth()

  if (user?.role === "admin") {
    return (
      <EmptyState
        title="Admin accounts cannot use the cart"
        description="Manage products and orders from the admin panel, or sign in with a customer account to shop."
      >
        <Link href="/admin" className="sf-btn sf-btn-primary">
          Go to admin panel
        </Link>
      </EmptyState>
    )
  }

  if (!hydrated) {
    return (
      <div role="status" aria-label="Loading your cart" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="sf-skeleton h-64" />
        <div className="sf-skeleton h-56" />
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <>
        <EmptyState icon={ShoppingCart} title="Your cart is empty" description="Add furniture you like and it will wait here for you.">
          <Link href="/shop" className="sf-btn sf-btn-primary">
            Shop furniture
          </Link>
          {!user && (
            <Link href="/login?redirect=%2Fcart" className="sf-btn sf-btn-outline">
              Sign in
            </Link>
          )}
        </EmptyState>
        {savedSection}
      </>
    )
  }

  const delivery = deliveryFee(settings, cartTotal)
  const untilFree =
    OFFERS_DELIVERY && settings.freeShippingThreshold > 0
      ? Math.max(0, settings.freeShippingThreshold - cartTotal)
      : 0

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0">
      <section aria-label="Cart items" className="sf-card">
        <ul className="divide-y divide-border">
          {cart.map((item) => {
            const { product } = item
            const atLimit = product.stock != null && item.quantity >= product.stock
            return (
              <li key={product.id} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                <Link
                  href={productHref(product)}
                  className="relative size-24 shrink-0 overflow-hidden rounded-md bg-secondary sm:size-32"
                >
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 96px, 128px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={productHref(product)}
                        className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary sm:text-base"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {[item.color && `Colour: ${item.color}`, product.material].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatPrice(product.price, currency)} each
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-foreground sm:text-base">
                      {formatPrice(product.price * item.quantity, currency)}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-3">
                    <div
                      role="group"
                      aria-label={`Quantity of ${product.name}`}
                      className="flex items-center border border-input bg-card"
                    >
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, item.quantity - 1)}
                        aria-label={item.quantity === 1 ? `Remove ${product.name}` : "Decrease quantity"}
                        className="grid size-9 place-items-center hover:bg-secondary"
                      >
                        {item.quantity === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                      </button>
                      <span className="w-8 text-center text-sm font-bold" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, item.quantity + 1)}
                        disabled={atLimit}
                        aria-label="Increase quantity"
                        className="grid size-9 place-items-center hover:bg-secondary disabled:opacity-40"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      className="min-h-9 text-[13px] font-semibold text-primary hover:underline"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => saveForLater(product)}
                      className="min-h-9 text-[13px] font-semibold text-primary hover:underline"
                    >
                      Save for later
                    </button>
                    {atLimit && <span className="text-xs text-[#a8601a]">Maximum available</span>}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
      {savedSection}
      </div>

      {/* On phones and tablets the subtotal and checkout button come before the items. */}
      <aside aria-label="Order summary" className="sf-card order-first p-4 sm:p-5 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:order-none">
        <h2 className="text-base font-bold text-foreground">Order summary</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
            </dt>
            <dd className="font-semibold text-foreground">{formatPrice(cartTotal, currency)}</dd>
          </div>
          {OFFERS_DELIVERY && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-semibold text-foreground">
                {delivery > 0 ? formatPrice(delivery, currency) : "Free"}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-border pt-3 text-base">
            <dt className="font-bold text-foreground">Total</dt>
            <dd className="font-bold text-foreground">{formatPrice(cartTotal + delivery, currency)}</dd>
          </div>
        </dl>
        {untilFree > 0 && (
          <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
            Add {formatPrice(untilFree, currency)} more for free delivery.
          </p>
        )}
        {settings.storePickupEnabled && delivery > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Store pickup is free — choose it at checkout.</p>
        )}
        <Link href="/checkout" className="sf-btn sf-btn-primary mt-4 w-full">
          Proceed to checkout ({cartCount} {cartCount === 1 ? "item" : "items"})
        </Link>
        <Link href="/shop" className="sf-btn sf-btn-ghost mt-2 w-full">
          Continue shopping
        </Link>
      </aside>
    </div>
  )
}
