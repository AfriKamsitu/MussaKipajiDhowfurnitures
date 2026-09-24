"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useStoreSettings } from "@/components/store-settings-provider"
import { formatPrice } from "@/lib/data"

const salesConfig = {
  value: { label: "Sales", color: "var(--chart-1)" },
} satisfies ChartConfig

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function SalesOverviewChart({
  data = [],
}: {
  data?: Array<{ day: string; value: number }>
}) {
  const { currency } = useStoreSettings()
  if (!data.length) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No sales data yet</p>
  }

  return (
    <ChartContainer config={salesConfig} className="h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
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
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2.5}
          fill="url(#fillSales)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[]
  centerLabel: string
  centerValue: string
}) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>
  }

  const config = Object.fromEntries(
    data.map((d) => [d.name, { label: d.name, color: d.color }]),
  ) satisfies ChartConfig

  return (
    <div className="grid min-w-0 items-center gap-5 sm:grid-cols-[152px_minmax(0,1fr)]">
      <div className="relative mx-auto size-[152px] shrink-0">
        <ChartContainer config={config} className="size-[152px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={69}
              strokeWidth={2}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">{centerValue}</span>
          <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <ul className="min-w-0 space-y-1.5">
        {data.map((d) => (
          <li
            key={d.name}
            className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-sm"
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="min-w-0 truncate text-muted-foreground" title={d.name}>
              {d.name}
            </span>
            <span className="min-w-6 text-right font-semibold tabular-nums text-foreground">
              {d.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function OrderStatusChart({
  data = [],
}: {
  data?: Array<{ name: string; value: number; color?: string }>
}) {
  const chartData = data.map((d, i) => ({
    name: d.name,
    value: d.value,
    color: d.color || CHART_COLORS[i % CHART_COLORS.length],
  }))
  const total = chartData.reduce((sum, d) => sum + d.value, 0)
  return (
    <DonutChart data={chartData} centerLabel="Total Orders" centerValue={String(total)} />
  )
}

export function SalesByCategoryChart({
  data = [],
}: {
  data?: Array<{ name: string; value: number; color?: string }>
}) {
  const chartData = data.map((d, i) => ({
    name: d.name,
    value: d.value,
    color: d.color || CHART_COLORS[i % CHART_COLORS.length],
  }))
  const total = chartData.reduce((sum, d) => sum + d.value, 0)
  return (
    <DonutChart
      data={chartData}
      centerLabel="Total"
      centerValue={total >= 1_000_000 ? `${(total / 1_000_000).toFixed(1)}M` : String(total)}
    />
  )
}
