"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Check, Printer } from "lucide-react"
import { AdminCard, AdminPageHeader, StatusBadge } from "@/components/admin/admin-ui"
import { formatTZS, prettifyStatus } from "@/lib/admin-data"
import { fetchApi } from "@/lib/api"
import { useStoreSettings } from "@/components/store-settings-provider"

type OrderDetail = {
  id: string
  orderNumber: string
  date: string
  payment: string
  paymentStatus: string
  status: string
  total: number
  subtotal: number
  delivery: number
  discount: number
  couponCode: string | null
  customer: string
  address: string
  phone: string
  items: Array<{ name: string; image: string; price: number; qty: number }>
  timeline: Array<{ label: string; at: string; done: boolean }>
}

export default function OrderDetailsPage() {
  const { currency } = useStoreSettings()
  const params = useParams<{ id: string }>()
  const id = params.id
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchApi<Record<string, unknown>>(`/api/admin/orders/${id}`)
      .then((raw) => {
        setOrder({
          id: String(raw.id),
          orderNumber: String(raw.orderNumber ?? raw.id),
          date: raw.createdAt ? new Date(String(raw.createdAt)).toLocaleString() : "—",
          payment: String(raw.payment ?? "—"),
          paymentStatus: prettifyStatus(String(raw.paymentStatus ?? "")),
          status: prettifyStatus(String(raw.status ?? "")),
          total: Number(raw.total ?? 0),
          subtotal: Number(raw.subtotal ?? 0),
          delivery: Number(raw.delivery ?? 0),
          discount: Number(raw.discount ?? 0),
          couponCode: raw.couponCode ? String(raw.couponCode) : null,
          customer: String(raw.customerName ?? "—"),
          address: String(raw.shippingAddress ?? "—"),
          phone: String(raw.phone ?? "—"),
          items: Array.isArray(raw.items)
            ? (raw.items as Record<string, unknown>[]).map((it) => ({
                name: String(it.name ?? ""),
                image: String(it.image ?? "/placeholder.svg"),
                price: Number(it.price ?? 0),
                qty: Number(it.quantity ?? 1),
              }))
            : [],
          timeline: Array.isArray(raw.timeline)
            ? (raw.timeline as Record<string, unknown>[]).map((step) => ({
                label: String(step.label ?? ""),
                at: step.at ? new Date(String(step.at)).toLocaleString() : "",
                done: Boolean(step.done),
              }))
            : [],
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load order"))
  }, [id])

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Order Details" breadcrumb={["Dashboard", "Orders"]} />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div>
        <AdminPageHeader title="Order Details" breadcrumb={["Dashboard", "Orders"]} />
        <p className="text-sm text-muted-foreground">Loading order…</p>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Order Details"
        breadcrumb={["Dashboard", "Orders", order.orderNumber]}
        actions={
          <>
            <StatusBadge status={order.status} />
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary">
              <Printer className="size-4" />
              Print Invoice
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <AdminCard>
            <h2 className="mb-4 text-base font-semibold text-foreground">Order Information</h2>
            <dl className="space-y-3 text-sm">
              {[
                ["Order ID", order.orderNumber],
                ["Order Date", order.date],
                ["Payment Method", order.payment],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium text-foreground">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Payment Status</dt>
                <dd>
                  <StatusBadge status={order.paymentStatus} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Order Status</dt>
                <dd>
                  <StatusBadge status={order.status} />
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-3">
                <dt className="text-muted-foreground">Total Amount</dt>
                <dd className="text-right text-base font-bold text-foreground">{formatTZS(order.total, currency)}</dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-3 text-base font-semibold text-foreground">Shipping Address</h2>
            <p className="text-sm font-medium text-foreground">{order.customer}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{order.address}</p>
            <p className="mt-2 text-sm text-muted-foreground">{order.phone}</p>
          </AdminCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <AdminCard className="p-0">
            <h2 className="px-5 pt-5 text-base font-semibold text-foreground">Order Items</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-y border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium">Price</th>
                    <th className="px-5 py-3 font-medium">Quantity</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((it) => (
                    <tr key={it.name}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                            <Image src={it.image || "/placeholder.svg"} alt={it.name} fill sizes="40px" className="object-cover" />
                          </span>
                          <span className="font-medium text-foreground">{it.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatTZS(it.price, currency)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{it.qty}</td>
                      <td className="px-5 py-3 text-right font-medium text-foreground">
                        {formatTZS(it.price * it.qty, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 border-t border-border px-5 py-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatTZS(order.subtotal, currency)}</span>
              </div>
              {(order.discount > 0 || order.couponCode) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Discount{order.couponCode ? ` (coupon ${order.couponCode})` : ""}
                  </span>
                  <span className="font-medium text-foreground">
                    {order.discount > 0 ? `-${formatTZS(order.discount, currency)}` : "Free delivery"}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-medium text-foreground">
                  {formatTZS(order.delivery, currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-base font-bold text-foreground">{formatTZS(order.total, currency)}</span>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-5 text-base font-semibold text-foreground">Timeline</h2>
            <ol className="grid grid-cols-1 gap-6 sm:grid-cols-4">
              {order.timeline.map((step, i) => (
                <li key={step.label} className="relative flex flex-col gap-2 sm:items-center sm:text-center">
                  {i < order.timeline.length - 1 && (
                    <span className="absolute left-3 top-3 h-[calc(100%+1.5rem)] w-px bg-emerald-300 sm:left-1/2 sm:top-3 sm:h-px sm:w-full" />
                  )}
                  <span
                    className={`relative z-10 flex size-6 items-center justify-center rounded-full ${
                      step.done ? "bg-emerald-500 text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{step.label}</span>
                  <span className="text-xs text-muted-foreground">{step.at}</span>
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
