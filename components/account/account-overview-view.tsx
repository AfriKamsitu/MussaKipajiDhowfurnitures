"use client"

import Link from "next/link"
import { ArrowRight, Check, Heart, MapPin, Package, ShoppingBag, Truck, Wallet } from "lucide-react"
import { useAuth, type Order } from "@/components/auth-provider"
import { SafeImage as Image } from "@/components/safe-image"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { productHref } from "@/lib/catalog"
import { formatPrice } from "@/lib/data"
import { cn } from "@/lib/utils"

const progressSteps: Order["status"][] = ["Pending", "Processing", "Shipped", "Delivered"]
const stepLabels: Record<string, string> = {
  Pending: "Order placed",
  Processing: "Being prepared",
  Shipped: "On the way",
  Delivered: "Delivered",
}

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-800",
  Processing: "bg-primary/10 text-primary",
  Shipped: "bg-sky-50 text-sky-800",
  Delivered: "bg-emerald-50 text-emerald-800",
  Cancelled: "bg-red-50 text-red-700",
}

const panel = "border border-border bg-card"
const panelTitle = "text-[11px] font-medium uppercase tracking-[0.18em] text-foreground"
const textLink =
  "inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-primary underline-offset-4 hover:underline"

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em]", statusStyles[status] ?? "bg-secondary text-foreground")}>
      {status}
    </span>
  )
}

/** Four-step tracker for the order status reported by the backend. */
function OrderProgress({ status }: { status: Order["status"] }) {
  const current = progressSteps.indexOf(status)
  return (
    <ol className="mt-5 grid grid-cols-4" aria-label={`Order progress: ${stepLabels[status] ?? status}`}>
      {progressSteps.map((step, index) => {
        const done = index <= current
        return (
          <li key={step} className="relative flex flex-col items-center text-center" aria-current={index === current ? "step" : undefined}>
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn("absolute right-1/2 top-3 h-px w-full", index <= current ? "bg-primary" : "bg-border")}
              />
            )}
            <span
              className={cn(
                "relative z-[1] grid size-6 place-items-center rounded-full border text-[10px] font-bold",
                done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
              )}
            >
              {index < current ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn("mt-2 text-[10px] uppercase tracking-[0.1em] sm:text-[11px]", done ? "text-foreground" : "text-muted-foreground")}>
              {stepLabels[step]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function AccountOverviewView() {
  const { currency } = useStoreSettings()
  const { user } = useAuth()
  const { cart, cartCount, cartTotal, wishlist, recentlyViewed, hydrated } = useStore()

  if (!user) return null

  const firstName = user.name.trim().split(/\s+/)[0] || "there"
  const orders = user.orders
  const activeOrders = orders.filter((order) => ["Pending", "Processing", "Shipped"].includes(order.status))
  const tracked = activeOrders[0]
  const totalSpent = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + order.total, 0)
  const defaultAddress = user.addresses.find((address) => address.isDefault) ?? user.addresses[0]

  // Completeness is derived only from details the account actually stores.
  const profileChecks = [
    { label: "Add your name", done: Boolean(user.name.trim()), href: "/account/profile" },
    { label: "Add a phone number", done: Boolean(user.phone), href: "/account/profile" },
    { label: "Save a delivery address", done: user.addresses.length > 0, href: "/account/addresses" },
    { label: "Choose a default address", done: user.addresses.some((address) => address.isDefault), href: "/account/addresses" },
  ]
  const completed = profileChecks.filter((check) => check.done).length
  const completeness = Math.round((completed / profileChecks.length) * 100)

  const stats = [
    { label: "Total orders", value: String(orders.length), icon: Package, href: "/account/orders" },
    { label: "In progress", value: String(activeOrders.length), icon: Truck, href: "/account/orders" },
    { label: "Total spent", value: formatPrice(totalSpent, currency), icon: Wallet, href: "/account/orders" },
    { label: "Saved items", value: String(hydrated ? wishlist.length : 0), icon: Heart, href: "/wishlist" },
  ]

  return (
    <div className="space-y-5">
      <section className={cn(panel, "flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6")}>
        <div className="min-w-0">
          <h2 className="text-2xl font-light tracking-[0.01em] sm:text-[1.75rem]">Welcome back, {firstName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeOrders.length > 0
              ? `You have ${activeOrders.length} ${activeOrders.length === 1 ? "order" : "orders"} in progress.`
              : orders.length > 0
                ? "All your orders are up to date."
                : "You haven't placed an order yet."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/shop" className="sf-btn sf-btn-primary">
            Shop furniture
          </Link>
          <Link href="/account/orders" className="sf-btn sf-btn-outline">
            View orders
          </Link>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link href={stat.href} className={cn(panel, "group flex h-full flex-col gap-4 p-4 transition-colors hover:border-primary/40")}>
              <span className="grid size-9 place-items-center bg-secondary text-primary">
                <stat.icon className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block truncate text-xl font-light text-foreground sm:text-2xl">{stat.value}</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {tracked && (
            <section className={cn(panel, "p-5 sm:p-6")} aria-labelledby="tracking-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="tracking-title" className={panelTitle}>
                    Latest order in progress
                  </h2>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">{tracked.id}</span>
                    <span className="text-muted-foreground">
                      {" · "}
                      {new Date(tracked.date).toLocaleDateString()} · {formatPrice(tracked.total, currency)}
                    </span>
                  </p>
                </div>
                <Link href="/account/orders" className={textLink}>
                  Order details <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
              <OrderProgress status={tracked.status} />
            </section>
          )}

          <section className={panel} aria-labelledby="recent-orders-title">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
              <h2 id="recent-orders-title" className={panelTitle}>
                Recent orders
              </h2>
              {orders.length > 0 && (
                <Link href="/account/orders" className={textLink}>
                  View all <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <span className="grid size-12 place-items-center bg-secondary text-primary">
                  <Package className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold">No orders yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  When you place an order it will appear here with its status.
                </p>
                <Link href="/shop" className="sf-btn sf-btn-primary mt-5">
                  Start shopping
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {orders.slice(0, 5).map((order) => (
                  <li key={order.id} className="flex items-center gap-3 px-5 py-3.5 sm:gap-4 sm:px-6">
                    <span className="relative size-14 shrink-0 overflow-hidden bg-secondary">
                      <Image src={order.items[0]?.image || "/placeholder.svg"} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{order.id}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Date(order.date).toLocaleDateString()} · {order.items.map((item) => item.name).join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-semibold">{formatPrice(order.total, currency)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {hydrated && wishlist.length > 0 && (
            <section className={cn(panel, "p-5 sm:p-6")} aria-labelledby="saved-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="saved-title" className={panelTitle}>
                  Saved items
                </h2>
                <Link href="/wishlist" className={textLink}>
                  View all <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {wishlist.slice(0, 4).map((product) => (
                  <li key={product.id} className="min-w-0">
                    <Link href={productHref(product)} className="group block">
                      <span className="relative block aspect-square overflow-hidden bg-secondary">
                        <Image src={product.image || "/placeholder.svg"} alt="" fill sizes="(max-width: 640px) 45vw, 180px" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                      </span>
                      <span className="mt-2 block truncate text-[13px] group-hover:text-primary">{product.name}</span>
                      <span className="block text-xs text-muted-foreground">{formatPrice(product.price, currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className={cn(panel, "p-5")} aria-labelledby="cart-title">
            <h2 id="cart-title" className={panelTitle}>
              Your cart
            </h2>
            {hydrated && cart.length > 0 ? (
              <>
                <ul className="mt-3 space-y-2.5">
                  {cart.slice(0, 3).map((item) => (
                    <li key={item.product.id} className="flex items-center gap-3">
                      <span className="relative size-11 shrink-0 overflow-hidden bg-secondary">
                        <Image src={item.product.image || "/placeholder.svg"} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px]">{item.product.name}</span>
                        <span className="block text-xs text-muted-foreground">Qty {item.quantity}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {cart.length > 3 && <p className="mt-2 text-xs text-muted-foreground">+ {cart.length - 3} more</p>}
                <p className="mt-4 flex justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
                  </span>
                  <span className="font-semibold">{formatPrice(cartTotal, currency)}</span>
                </p>
                <Link href="/checkout" className="sf-btn sf-btn-primary mt-4 w-full">
                  Checkout
                </Link>
              </>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingBag className="size-4" aria-hidden="true" /> Your cart is empty.
              </p>
            )}
          </section>

          <section className={cn(panel, "p-5")} aria-labelledby="profile-title">
            <div className="flex items-center justify-between gap-3">
              <h2 id="profile-title" className={panelTitle}>
                Account setup
              </h2>
              <span className="text-sm font-semibold text-primary">{completeness}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={completeness}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Account setup progress"
              className="mt-3 h-1.5 bg-secondary"
            >
              <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${completeness}%` }} />
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {profileChecks.map((check) => (
                <li key={check.label} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border",
                      check.done ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                  >
                    {check.done && <Check className="size-3" aria-hidden="true" />}
                  </span>
                  {check.done ? (
                    <span className="text-muted-foreground line-through">{check.label}</span>
                  ) : (
                    <Link href={check.href} className="text-foreground underline-offset-4 hover:text-primary hover:underline">
                      {check.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className={cn(panel, "p-5")} aria-labelledby="address-title">
            <div className="flex items-center justify-between gap-3">
              <h2 id="address-title" className={panelTitle}>
                Delivery address
              </h2>
              <Link href="/account/addresses" className={textLink}>
                {defaultAddress ? "Manage" : "Add"}
              </Link>
            </div>
            {defaultAddress ? (
              <address className="mt-3 flex gap-2.5 text-sm not-italic">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block font-semibold">{defaultAddress.fullName || defaultAddress.label}</span>
                  <span className="block text-muted-foreground">
                    {[defaultAddress.street, defaultAddress.city, defaultAddress.region].filter(Boolean).join(", ")}
                  </span>
                  {defaultAddress.phone && <span className="block text-muted-foreground">{defaultAddress.phone}</span>}
                </span>
              </address>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Save an address to fill in checkout automatically.</p>
            )}
          </section>

          {hydrated && recentlyViewed.length > 0 && (
            <section className={cn(panel, "p-5")} aria-labelledby="viewed-title">
              <h2 id="viewed-title" className={panelTitle}>
                Recently viewed
              </h2>
              <ul className="mt-3 space-y-2.5">
                {recentlyViewed.slice(0, 4).map((product) => (
                  <li key={product.id}>
                    <Link href={productHref(product)} className="group flex items-center gap-3">
                      <span className="relative size-11 shrink-0 overflow-hidden bg-secondary">
                        <Image src={product.image || "/placeholder.svg"} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] group-hover:text-primary">{product.name}</span>
                        <span className="block text-xs text-muted-foreground">{formatPrice(product.price, currency)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
