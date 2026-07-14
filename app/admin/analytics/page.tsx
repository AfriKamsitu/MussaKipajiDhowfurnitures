"use client"

import { useEffect, useState } from "react"
import { DollarSign, Repeat, ShoppingCart, Users } from "lucide-react"
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui"
import { RevenueBarChart, OrdersLineChart } from "@/components/admin/analytics-charts"
import { fetchApi } from "@/lib/api"

type AnalyticsData = {
  stats: Array<{ label: string; value: string; icon?: string }>
  salesOverview: Array<{ day: string; value: number }>
  orderStatusBreakdown: Array<{ name: string; value: number }>
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchApi<AnalyticsData>("/api/admin/dashboard")
      .then((payload) => setData(payload))
      .catch(() => setData(null))
  }, [])

  const kpis = (data?.stats ?? []).slice(0, 4).map((s, i) => {
    const icons = [DollarSign, ShoppingCart, Users, Repeat]
    return { ...s, icon: icons[i] ?? DollarSign }
  })

  const salesSeries =
    data?.salesOverview?.map((row) => ({
      month: row.day,
      revenue: row.value,
      orders: 0,
    })) ?? []

  return (
    <div>
      <AdminPageHeader title="Analytics" breadcrumb={["Dashboard", "Analytics"]} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <AdminCard key={k.label}>
              <div className="flex items-start justify-between">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{k.value}</p>
            </AdminCard>
          )
        })}
        {!kpis.length && (
          <p className="col-span-full text-sm text-muted-foreground">No analytics data yet</p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="mb-4 text-base font-semibold text-foreground">Revenue</h2>
          <RevenueBarChart data={salesSeries.map(({ month, revenue }) => ({ month, revenue }))} />
        </AdminCard>
        <AdminCard>
          <h2 className="mb-4 text-base font-semibold text-foreground">Orders by Status</h2>
          <OrdersLineChart
            data={(data?.orderStatusBreakdown ?? []).map((row) => ({
              month: row.name,
              orders: row.value,
            }))}
          />
        </AdminCard>
      </div>
    </div>
  )
}
