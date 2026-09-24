"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  ShoppingBag,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { formatPrice } from "@/lib/data"
import { cn } from "@/lib/utils"
import { openWhatsApp } from "@/lib/whatsapp"

const statusStyles: Record<string, string> = {
  Pending: "bg-secondary text-muted-foreground",
  Processing: "bg-accent/15 text-accent",
  Shipped: "bg-chart-3/15 text-chart-3",
  Delivered: "bg-primary/15 text-primary",
  Cancelled: "bg-destructive/15 text-destructive",
}

export function AccountOverviewView() {
  const { currency } = useStoreSettings()
  const { user } = useAuth()
  const { wishlistCount, cartCount } = useStore()
  if (!user) return null

  const recentOrders = user.orders.slice(0, 3)
  const defaultAddress = user.addresses.find((address) => address.isDefault) ?? user.addresses[0]

  const shortcuts = [
    {
      label: "Shopping cart",
      detail: cartCount ? `${cartCount} item${cartCount === 1 ? "" : "s"} waiting` : "Your cart is empty",
      href: "/cart",
      icon: ShoppingBag,
    },
    {
      label: "Saved furniture",
      detail: wishlistCount
        ? `${wishlistCount} saved item${wishlistCount === 1 ? "" : "s"}`
        : "Save products to compare later",
      href: "/wishlist",
      icon: Heart,
    },
    {
      label: "Delivery addresses",
      detail: defaultAddress
        ? `${defaultAddress.city}, ${defaultAddress.region}`
        : "Add an address for faster checkout",
      href: "/account/addresses",
      icon: MapPin,
    },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="surface-premium overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
          <div>
            <h3 className="font-bold text-foreground">Recent orders</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Follow delivery progress and order totals.
            </p>
          </div>
          {user.orders.length > 0 && (
            <Link
              href="/account/orders"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              View all
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="size-6" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-foreground">No orders yet</h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              Explore the collection and your first order will appear here.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Start shopping
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentOrders.map((order) => (
              <li key={order.id} className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary shadow-soft sm:size-20">
                    <Image
                      src={order.items[0]?.image || "/placeholder.svg"}
                      alt={order.items[0]?.name || "Order item"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-foreground">Order #{order.id}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(order.date).toLocaleDateString()} · {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          statusStyles[order.status],
                        )}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm text-muted-foreground">
                      {order.items.map((item) => item.name).join(", ")}
                    </p>
                    <p className="mt-2 text-sm font-black text-foreground">
                      {formatPrice(order.total, currency)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="space-y-4">
        <div className="surface-premium rounded-2xl p-4 sm:p-5">
          <h3 className="font-bold text-foreground">Quick links</h3>
          <div className="mt-3 divide-y divide-border">
            {shortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 py-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  <item.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground group-hover:text-primary">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-accent/15 bg-secondary p-5 shadow-soft">
          <h3 className="font-bold text-foreground">Need help with an order?</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Contact the store with your order number and we will help.
          </p>
          <button
            type="button"
            onClick={() =>
              openWhatsApp("Hello Paje Dhow Furniture, I need help with an order.")
            }
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <MessageCircle className="size-4" />
            Contact support
          </button>
        </div>
      </aside>
    </div>
  )
}
