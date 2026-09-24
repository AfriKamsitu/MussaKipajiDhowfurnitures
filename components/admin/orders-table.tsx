"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Eye, Loader2, Search, Trash2, X } from "lucide-react"
import { StatusBadge } from "@/components/admin/admin-ui"
import { formatTZS, prettifyStatus } from "@/lib/admin-data"
import { useStoreSettings } from "@/components/store-settings-provider"
import { fetchApi } from "@/lib/api"
import type { SpringPage } from "@/lib/data"

type AdminOrder = {
  id: string
  numericId: string
  customer: string
  date: string
  total: number
  payment: string
  status: string
}

const nextStatuses: Record<string, string[]> = {
  Pending: ["Pending", "Processing", "Cancelled"],
  Processing: ["Processing", "Shipped", "Cancelled"],
  Shipped: ["Shipped", "Delivered"],
  Delivered: ["Delivered"],
  Cancelled: ["Cancelled"],
}

export function OrdersTable() {
  const { currency } = useStoreSettings()
  const [tab, setTab] = useState("All Orders")
  const [query, setQuery] = useState("")
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)

  function loadOrders() {
    fetchApi<SpringPage<Record<string, unknown>>>("/api/admin/orders?size=50")
      .then((payload) => {
        const content = Array.isArray(payload?.content) ? payload.content : []
        setOrders(
          content.map((o) => ({
            id: String(o.orderNumber ?? o.id),
            numericId: String(o.id),
            customer: String(o.customerName ?? "—"),
            date: o.createdAt ? new Date(String(o.createdAt)).toLocaleDateString() : "—",
            total: Number(o.total ?? 0),
            payment: String(o.payment ?? "—"),
            status: prettifyStatus(String(o.status ?? "Pending")),
          })),
        )
      })
      .catch(() => setOrders([]))
  }

  useEffect(() => {
    loadOrders()
  }, [])

  async function updateStatus(order: AdminOrder, status: string) {
    setBusyId(order.numericId)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/orders/${order.numericId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      setNotice({ type: "success", text: "Order status updated." })
      loadOrders()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to update order." })
    } finally {
      setBusyId(null)
    }
  }

  async function deleteOrder(order: AdminOrder) {
    setBusyId(order.numericId)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/orders/${order.numericId}`, { method: "DELETE" })
      setOrders((current) => current.filter((item) => item.numericId !== order.numericId))
      setConfirmDeleteId(null)
      setNotice({ type: "success", text: "Order deleted from the database." })
      loadOrders()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to delete order." })
    } finally {
      setBusyId(null)
    }
  }

  const tabs = useMemo(() => {
    const statuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
    const counts: Record<string, number> = { "All Orders": orders.length }
    for (const s of statuses) counts[s] = orders.filter((o) => o.status === s).length
    return Object.entries(counts).map(([label, count]) => ({ label, count }))
  }, [orders])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesTab = tab === "All Orders" || o.status === tab
      const matchesQuery =
        o.id.toLowerCase().includes(query.toLowerCase()) ||
        o.customer.toLowerCase().includes(query.toLowerCase())
      return matchesTab && matchesQuery
    })
  }, [orders, tab, query])

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-4 pt-4">
        {tabs.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.label)}
            className={`relative flex items-center gap-1.5 rounded-t-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === t.label ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                tab === t.label ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}
            >
              {t.count}
            </span>
            {tab === t.label && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders..."
            className="w-full rounded-lg border border-border bg-secondary py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:bg-card"
          />
        </div>
      </div>

      {notice && (
        <div className="px-4 pb-4">
          <div className={`rounded-lg border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}>
            {notice.text}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-y border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((o) => (
              <Fragment key={o.numericId}>
              <tr className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium text-foreground">{o.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.customer}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                <td className="px-4 py-3 font-medium text-foreground">{formatTZS(o.total, currency)}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.payment}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <StatusBadge status={o.status} />
                    <select
                      value={o.status.toUpperCase()}
                      onChange={(event) => updateStatus(o, event.target.value)}
                      disabled={busyId === o.numericId || nextStatuses[o.status]?.length === 1}
                      className="w-32 rounded-md border border-border bg-card px-2 py-1 text-xs outline-none"
                    >
                      {(nextStatuses[o.status] ?? [o.status]).map((status) => (
                        <option key={status} value={status.toUpperCase()}>{status}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/orders/${o.numericId}`}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                      aria-label="View order"
                    >
                      <Eye className="size-4" />
                    </Link>
                    {o.status === "Cancelled" && (
                      <button
                        onClick={() => {
                          setNotice(null)
                          setConfirmDeleteId((current) => (current === o.numericId ? null : o.numericId))
                        }}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                        aria-label="Delete cancelled order"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              {confirmDeleteId === o.numericId && (
                <tr className="bg-red-50/70">
                  <td colSpan={7} className="px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-red-700">Delete order {o.id}?</p>
                        <p className="text-xs text-red-600">Only cancelled orders can be removed. This cannot be undone.</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => deleteOrder(o)} disabled={busyId === o.numericId} className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-70">
                          {busyId === o.numericId ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                          Delete
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteId(null)} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">
                          <X className="size-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
