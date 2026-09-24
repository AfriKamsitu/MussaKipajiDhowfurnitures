"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { formatPrice } from "@/lib/data"
import { useStoreSettings } from "@/components/store-settings-provider"
import { useStore } from "@/components/store-provider"
import { useAuth } from "@/components/auth-provider"

export function CartView() {
  const { currency } = useStoreSettings()
  const { cart, updateQuantity, removeFromCart, cartTotal } = useStore()
  const { user } = useAuth()

  if (user?.role === "admin") {
    return (
      <div className="surface-premium rounded-3xl p-10 text-center sm:p-14">
        <h2 className="text-lg font-semibold text-foreground">Admin accounts cannot use buyer cart.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Use the admin panel to manage products and orders.</p>
        <Link
          href="/admin"
          className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-accent"
        >
          Go to Admin Panel
        </Link>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="surface-premium flex flex-col items-center justify-center gap-4 rounded-3xl px-6 py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
          <ShoppingBag className="size-7" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground">Looks like you haven&apos;t added anything yet.</p>
        <Link
          href="/shop"
          className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-accent"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-4 border-b border-border p-4 last:border-0"
            >
              <Link
                href={`/product/${item.product.id}`}
                className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-secondary sm:size-28"
              >
                <Image
                  src={item.product.image || "/placeholder.svg"}
                  alt={item.product.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/product/${item.product.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs capitalize text-muted-foreground">{item.product.material}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    aria-label="Remove item"
                    className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-border">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="flex size-8 items-center justify-center hover:bg-secondary"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.product.stock != null && item.quantity >= item.product.stock}
                      aria-label="Increase quantity"
                      className="flex size-8 items-center justify-center hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="font-bold text-primary">
                    {formatPrice(item.product.price * item.quantity, currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/shop" className="mt-4 inline-flex min-h-6 items-center gap-2 text-sm font-medium text-accent hover:underline">
          <ArrowLeft className="size-4" /> Continue shopping
        </Link>
      </div>

      {/* Summary */}
      <div className="surface-premium h-fit rounded-2xl p-6 lg:sticky lg:top-40">
        <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium text-foreground">{formatPrice(cartTotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="text-right font-medium text-foreground">Confirmed on WhatsApp</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-3 text-base">
            <dt className="font-semibold text-foreground">Products Total</dt>
            <dd className="font-bold text-primary">{formatPrice(cartTotal, currency)}</dd>
          </div>
        </dl>
        <Link
          href="/checkout"
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-accent"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  )
}
