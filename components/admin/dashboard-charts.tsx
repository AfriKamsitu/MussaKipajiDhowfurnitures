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
            <ChartTooltipContent formatter={(value) => `TZS ${Number(value).toLocaleString()}`} />
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
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative">
        <ChartContainer config={config} className="h-[180px] w-[180px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={82}
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
      <ul className="flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="flex-1 text-muted-foreground">{d.name}</span>
            <span className="font-medium text-foreground">{d.value}</span>
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
