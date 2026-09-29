"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CircleCheck,
  Clock3,
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
  Pending: "bg-[#f1eee6] text-[#756d61]",
  Processing: "bg-[#9b5e3b]/12 text-[#9b5e3b]",
  Shipped: "bg-[#c5a274]/20 text-[#785c39]",
  Delivered: "bg-[#5d6248]/14 text-[#5d6248]",
  Cancelled: "bg-red-50 text-red-700",
}

const statusLabels: Record<string, string> = {
  Pending: "Being reviewed",
  Processing: "In the workshop",
  Shipped: "On the way",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
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
      detail: cartCount
        ? cartCount + " item" + (cartCount === 1 ? "" : "s") + " waiting"
        : "Your cart is empty",
      href: "/cart",
      icon: ShoppingBag,
    },
    {
      label: "Saved furniture",
      detail: wishlistCount
        ? wishlistCount + " saved item" + (wishlistCount === 1 ? "" : "s")
        : "Save products to compare later",
      href: "/wishlist",
      icon: Heart,
    },
    {
      label: "Delivery address",
      detail: defaultAddress
        ? defaultAddress.city + ", " + defaultAddress.region
        : "Add an address for faster checkout",
      href: "/account/addresses",
      icon: MapPin,
    },
  ]

  const metrics = [
    { label: "Orders", value: user.orders.length, icon: Package, href: "/account/orders" },
    { label: "Saved", value: wishlistCount, icon: Heart, href: "/wishlist" },
    { label: "In your cart", value: cartCount, icon: ShoppingBag, href: "/cart" },
    { label: "Addresses", value: user.addresses.length, icon: MapPin, href: "/account/addresses" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Link
              key={metric.label}
              href={metric.href}
              className="group border border-black/10 bg-white p-4 shadow-[0_16px_36px_-32px_rgba(17,19,15,0.55)] transition hover:-translate-y-1 hover:border-[#c5a274]/70"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-9 items-center justify-center bg-[#f1eee6] text-[#9b5e3b]">
                  <Icon className="size-4" />
                </span>
                <ArrowRight className="size-4 text-[#b0aaa0] transition-transform group-hover:translate-x-1 group-hover:text-[#9b5e3b]" />
              </div>
              <strong className="mt-5 block text-2xl font-medium tracking-[-0.06em] text-[#11130f]">
                {metric.value}
              </strong>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#756d61]">
                {metric.label}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="border border-black/10 bg-white shadow-[0_20px_48px_-38px_rgba(17,19,15,0.45)]">
          <div className="flex items-end justify-between gap-4 border-b border-black/10 px-5 py-5 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9b5e3b]">
                Your orders
              </p>
              <h3 className="mt-2 text-2xl font-medium tracking-[-0.055em] text-[#11130f]">
                Recent orders
              </h3>
              <p className="mt-1 text-sm font-light text-[#756d61]">
                Follow each piece from the workshop to your door.
              </p>
            </div>
            {user.orders.length > 0 && (
              <Link
                href="/account/orders"
                className="group inline-flex shrink-0 items-center gap-2 border-b border-black/20 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#263228] transition hover:border-[#9b5e3b] hover:text-[#9b5e3b]"
              >
                View all
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <span className="flex size-14 items-center justify-center bg-[#f1eee6] text-[#9b5e3b]">
                <Package className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-medium tracking-[-0.04em] text-[#11130f]">
                Your first piece is waiting.
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#756d61]">
                Explore the collection and your order will appear here with delivery updates.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex min-h-11 items-center gap-2 bg-[#263228] px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f1eee6] transition hover:bg-[#11130f]"
              >
                Start shopping
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-black/10">
              {recentOrders.map((order) => (
                <li key={order.id} className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative size-16 shrink-0 overflow-hidden bg-[#f1eee6] sm:size-20">
                      <Image
                        src={order.items[0]?.image || "/placeholder.svg"}
                        alt={order.items[0]?.name || "Order item"}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-[#11130f]">Order #{order.id}</p>
                          <p className="mt-1 text-xs text-[#756d61]">
                            {new Date(order.date).toLocaleDateString()} · {order.items.length} item
                            {order.items.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                            statusStyles[order.status],
                          )}
                        >
                          {order.status === "Delivered" && <CircleCheck className="size-3.5" />}
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>

                      <p className="mt-3 truncate text-sm font-light text-[#756d61]">
                        {order.items.map((item) => item.name).join(", ")}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/8 pt-3">
                        <span className="flex items-center gap-2 text-xs text-[#756d61]">
                          <Clock3 className="size-3.5 text-[#9b5e3b]" />
                          {order.status === "Delivered"
                            ? "Delivered safely"
                            : "Next update from the workshop"}
                        </span>
                        <span className="text-sm font-bold text-[#11130f]">
                          {formatPrice(order.total, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="border border-black/10 bg-white p-5 shadow-[0_18px_42px_-36px_rgba(17,19,15,0.45)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9b5e3b]">
              Keep exploring
            </p>
            <h3 className="mt-2 text-xl font-medium tracking-[-0.045em] text-[#11130f]">
              Your shortcuts
            </h3>
            <div className="mt-4 divide-y divide-black/10">
              {shortcuts.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 py-3"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center bg-[#f1eee6] text-[#9b5e3b]">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#11130f] group-hover:text-[#9b5e3b]">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-[#756d61]">{item.detail}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-[#b0aaa0] transition-transform group-hover:translate-x-1" />
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="border border-[#c5a274]/35 bg-[#263228] p-5 text-[#f1eee6]">
            <MessageCircle className="size-5 text-[#c5a274]" />
            <h3 className="mt-4 text-xl font-medium tracking-[-0.045em]">Need help with an order?</h3>
            <p className="mt-2 text-sm font-light leading-6 text-white/68">
              Send us your order number and our workshop team will take care of the rest.
            </p>
            <button
              type="button"
              onClick={() => openWhatsApp("Hello Paje Dhow Furniture, I need help with an order.")}
              className="mt-5 inline-flex min-h-10 items-center gap-2 border-b border-white/35 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-[#c5a274] hover:text-[#c5a274]"
            >
              Contact support
              <ArrowRight className="size-4" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
