"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Box,
  CalendarDays,
  DollarSign,
  Package,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react"
import { AdminCard, StatusBadge } from "@/components/admin/admin-ui"
import {
  SalesOverviewChart,
  OrderStatusChart,
  SalesByCategoryChart,
} from "@/components/admin/dashboard-charts"
import { formatTZS } from "@/lib/admin-data"
import { fetchApi } from "@/lib/api"

type DashboardData = {
  stats: Array<{ label: string; value: string; icon?: string }>
  salesOverview: Array<{ day: string; value: number }>
  topSelling: Array<{ name: string; price: number | string; image: string }>
  orderStatusBreakdown: Array<{ name: string; value: number }>
  salesByCategory: Array<{ name: string; value: number }>
  recentOrders: Array<{ id: string; customer: string; total: number; status: string }>
}

const statIcons: Record<string, typeof DollarSign> = {
  revenue: DollarSign,
  "dollar-sign": DollarSign,
  orders: ShoppingCart,
  "shopping-bag": ShoppingBag,
  customers: Users,
  users: Users,
  products: Box,
  package: Package,
}

export function DashboardSummary() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetchApi<DashboardData>("/api/admin/dashboard")
      .then((payload) => setData(payload))
      .catch(() => setData(null))
  }, [])

  const stats = data?.stats ?? []
  const recentOrders = data?.recentOrders ?? []
  const topSelling = data?.topSelling ?? []

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your store performance</p>
        </div>
        <button className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          This month
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = statIcons[s.icon ?? ""] ?? DollarSign
          return (
            <AdminCard key={s.label}>
              <div className="flex items-start justify-between">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
            </AdminCard>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Sales Overview</h2>
            </div>
            <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
              This Week
            </span>
          </div>
          <SalesOverviewChart data={data?.salesOverview ?? []} />
        </AdminCard>

        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Top Selling Products</h2>
            <Link href="/admin/products" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-3">
            {topSelling.map((p) => (
              <li key={p.name} className="flex items-center gap-3">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  <Image src={p.image || "/placeholder.svg"} alt={p.name} fill sizes="44px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {typeof p.price === "number" ? formatTZS(p.price) : p.price}
                </span>
              </li>
            ))}
            {!topSelling.length && (
              <li className="text-sm text-muted-foreground">No products yet</li>
            )}
          </ul>
        </AdminCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard>
          <h2 className="mb-4 text-base font-semibold text-foreground">Order Status</h2>
          <OrderStatusChart data={data?.orderStatusBreakdown ?? []} />
        </AdminCard>
        <AdminCard>
          <h2 className="mb-4 text-base font-semibold text-foreground">Sales by Category</h2>
          <SalesByCategoryChart data={data?.salesByCategory ?? []} />
        </AdminCard>
        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-3">
            {recentOrders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{o.id}</span>
                  <span className="block truncate text-xs text-muted-foreground">{o.customer}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-medium text-foreground">{formatTZS(o.total)}</span>
                </span>
                <StatusBadge status={o.status} />
              </li>
            ))}
            {!recentOrders.length && (
              <li className="text-sm text-muted-foreground">No recent orders</li>
            )}
          </ul>
        </AdminCard>
      </div>
    </div>
  )
}
