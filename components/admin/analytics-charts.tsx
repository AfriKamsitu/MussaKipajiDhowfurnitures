"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useStoreSettings } from "@/components/store-settings-provider"
import { formatPrice } from "@/lib/data"

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig

const ordersConfig = {
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig

export function RevenueBarChart({
  data = [],
}: {
  data?: Array<{ month: string; revenue: number }>
}) {
  const { currency } = useStoreSettings()
  if (!data.length) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No revenue data yet</p>
  }

  return (
    <ChartContainer config={revenueConfig} className="h-[280px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={42}
          fontSize={11}
          tickFormatter={(v) => `${v / 1_000_000}M`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value) => formatPrice(Number(value), currency)} />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

export function OrdersLineChart({
  data = [],
}: {
  data?: Array<{ month: string; orders: number }>
}) {
  if (!data.length) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No order trend data yet</p>
  }

  return (
    <ChartContainer config={ordersConfig} className="h-[280px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} width={36} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="orders"
          stroke="var(--color-orders)"
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
