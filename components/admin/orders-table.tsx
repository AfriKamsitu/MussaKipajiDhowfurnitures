"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Eye, Filter, Search } from "lucide-react"
import { StatusBadge } from "@/components/admin/admin-ui"
import { formatTZS, prettifyStatus } from "@/lib/admin-data"
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

export function OrdersTable() {
  const [tab, setTab] = useState("All Orders")
  const [query, setQuery] = useState("")
  const [orders, setOrders] = useState<AdminOrder[]>([])

  useEffect(() => {
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
  }, [])

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
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
          <Filter className="size-4 text-muted-foreground" />
          Filters
        </button>
      </div>

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
              <tr key={o.numericId} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium text-foreground">{o.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.customer}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                <td className="px-4 py-3 font-medium text-foreground">{formatTZS(o.total)}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.payment}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <Link
                      href={`/admin/orders/${o.numericId}`}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                      aria-label="View order"
                    >
                      <Eye className="size-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
