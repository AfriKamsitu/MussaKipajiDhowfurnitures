"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { MessageCircle, Package, Search, Truck } from "lucide-react"
import { useAuth, type Order } from "@/components/auth-provider"
import { formatPrice } from "@/lib/data"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { cn } from "@/lib/utils"
import { OFFERS_DELIVERY, orderStatusLabel } from "@/lib/pricing"
import { openWhatsApp } from "@/lib/whatsapp"

const statuses = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"] as const

const statusStyles: Record<string, string> = {
  Pending: "bg-secondary text-muted-foreground",
  Processing: "bg-accent/15 text-accent",
  Shipped: "bg-chart-3/15 text-chart-3",
  Delivered: "bg-primary/15 text-primary",
  Cancelled: "bg-destructive/15 text-destructive",
}

const progressSteps: Order["status"][] = ["Pending", "Processing", "Shipped", "Delivered"]

function progressIndex(status: Order["status"]) {
  if (status === "Cancelled") return -1
  return Math.max(0, progressSteps.indexOf(status))
}

export function OrdersView() {
  const { currency } = useStoreSettings()
  const { user } = useAuth()
  const { isLiveProduct } = useStore()
  const [status, setStatus] = useState<(typeof statuses)[number]>("All")
  const [query, setQuery] = useState("")
  if (!user) return null

  const q = query.trim().toLowerCase()
  const filtered = user.orders.filter((order) => {
    const matchesStatus = status === "All" || order.status === status
    const matchesQuery =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.items.some((item) => item.name.toLowerCase().includes(q))
    return matchesStatus && matchesQuery
  })

  if (user.orders.length === 0) {
    return (
      <div className="surface-premium flex flex-col items-center justify-center gap-4 rounded-3xl px-6 py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
          <Package className="size-7" />
        </span>
        <h2 className="text-2xl font-black text-foreground">No orders yet</h2>
        <p className="text-sm text-muted-foreground">When you place an order, it will appear here.</p>
        <Link
          href="/shop"
          className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-accent"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-black/12 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b2b2b]">
            Your orders
          </p>
          <h2 className="mt-2 text-3xl font-medium tracking-[-0.06em] text-[#2a211b]">
            {OFFERS_DELIVERY ? "Orders & delivery" : "Your orders"}
          </h2>
          <p className="mt-1 text-sm font-light text-[#6f6358]">
            See what is happening with every piece you have ordered.
          </p>
        </div>
        <span className="w-fit border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6f6358]">
          {user.orders.length} {user.orders.length === 1 ? "order" : "orders"} on record
        </span>
      </div>

      <div className="border border-black/10 bg-white p-4 shadow-[0_18px_42px_-38px_rgba(17,19,15,0.5)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-lg flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order number or product..."
              className="min-h-11 w-full border border-black/15 bg-[#f6f5f3] py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#6b2b2b]"
            />
          </div>
          <div className="scrollbar-none flex gap-2 overflow-x-auto">
            {statuses.map((item) => (
              <button
                key={item}
                onClick={() => setStatus(item)}
                className={cn(
                  "min-h-10 shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors",
                  status === item
                    ? "bg-[#6b2b2b] text-[#f6f0e6]"
                    : "border border-black/12 bg-white text-[#6f6358] hover:border-[#6b2b2b]/50 hover:text-[#6b2b2b]",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-premium rounded-2xl p-12 text-center text-sm text-muted-foreground">
          No orders match your filters.
        </div>
      ) : (
        filtered.map((order) => {
          const currentStep = progressIndex(order.status)
          return (
          <div key={order.id} className="overflow-hidden border border-black/10 bg-white shadow-[0_20px_48px_-38px_rgba(17,19,15,0.45)] transition-shadow hover:shadow-[0_25px_55px_-38px_rgba(17,19,15,0.55)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-[#f6f0e6]/70 px-5 py-4">
                <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  {[
                    ["Order placed", new Date(order.date).toLocaleDateString(undefined, { dateStyle: "medium" })],
                    ["Total", formatPrice(order.total, currency)],
                    ["Order #", order.id],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex items-center gap-2">
                  <span className={cn("px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]", statusStyles[order.status])}>
                    {orderStatusLabel(order.status)}
                  </span>
                  <button
                    onClick={() => openWhatsApp(`Hello Kipaji Dhow Furniture, I need help with order #${order.id}.`)}
                    className="inline-flex min-h-10 items-center gap-1.5 border border-black/15 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b2b2b] transition hover:border-[#6b2b2b] hover:text-[#6b2b2b]"
                  >
                    <MessageCircle className="size-3.5" />
                    Help
                  </button>
                </div>
              </div>

              <div className="border-b border-black/10 px-5 py-5">
                {order.status === "Cancelled" ? (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    This order was cancelled.
                  </div>
                ) : (
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {progressSteps.map((step, index) => (
                      <div key={step} className="min-w-0">
                        <div className={cn("h-1 transition-colors", index <= currentStep ? "bg-[#6b2b2b]" : "bg-black/10")} />
                        <p className={cn("mt-2 truncate text-[10px] font-bold uppercase tracking-[0.1em]", index <= currentStep ? "text-[#6b2b2b]" : "text-[#aaa49a]")}>
                          {orderStatusLabel(step)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ul className="divide-y divide-black/8">
                {order.items.map((item, index) => (
                  <li key={`${item.name}-${index}`} className="flex items-center gap-4 px-5 py-4">
                    <div className="relative size-16 shrink-0 overflow-hidden bg-[#f6f0e6]">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      {item.productId && isLiveProduct?.(item.productId) && (
                        <Link
                          href={`/product/${encodeURIComponent(item.productId)}`}
                          className="mt-1 inline-flex min-h-6 items-center text-xs font-semibold text-[#6b2b2b] underline-offset-4 hover:underline"
                        >
                          Buy it again
                        </Link>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatPrice(item.price * item.quantity, currency)}</p>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 bg-[#f8f7f3] px-5 py-4">
                <div className="flex items-center gap-2 text-xs text-[#6f6358]">
                  <Truck className="size-4 text-[#6b2b2b]" />
                  {OFFERS_DELIVERY ? "Delivery details update as the order progresses." : "We will contact you when this order is ready to collect."}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
