"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Banknote,
  BarChart3,
  CalendarDays,
  Download,
  Loader2,
  Package,
  Printer,
  ReceiptText,
  RefreshCw,
  Repeat2,
  ShoppingBag,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react"
import { AdminCard, AdminPageHeader, StatusBadge } from "@/components/admin/admin-ui"
import { OrdersLineChart, RevenueBarChart } from "@/components/admin/analytics-charts"
import { downloadApiFile, fetchApi } from "@/lib/api"
import { cn } from "@/lib/utils"

type ReportTab = "sales" | "inventory" | "customers" | "orders"

type ReportData = {
  period: { from: string; to: string; label: string }
  currency: string
  timezone: string
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    unitsSold: number
    totalCustomers: number
    newCustomers: number
    repeatCustomers: number
    totalProducts: number
    totalStock: number
    lowStockProducts: number
    outOfStockProducts: number
    inventoryValue: number
  }
  sales: Array<{ date: string; label: string; revenue: number; orders: number; units: number }>
  orderStatuses: Array<{ status: string; orders: number; revenue: number }>
  topProducts: Array<{
    productId: number
    name: string
    category: string
    unitsSold: number
    revenue: number
    stock: number
  }>
  inventory: Array<{
    id: number
    name: string
    sku?: string | null
    category: string
    stock: number
    status: string
    price: number
    stockValue: number
  }>
  customers: Array<{
    id: string
    name: string
    email: string
    phone?: string | null
    joinedAt: string
    orders: number
    totalSpent: number
    lastOrderAt?: string | null
  }>
  orders: Array<{
    id: number
    orderNumber: string
    customerName: string
    customerEmail?: string | null
    status: string
    paymentStatus: string
    units: number
    total: number
    createdAt: string
  }>
  generatedAt: string
}

const tabs: Array<{ id: ReportTab; label: string; icon: typeof BarChart3 }> = [
  { id: "sales", label: "Sales", icon: BarChart3 },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "orders", label: "Orders", icon: ReceiptText },
]

const wholeNumber = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 })

function reportCurrency(data: ReportData) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: data.currency || "TZS",
    maximumFractionDigits: data.currency === "USD" ? 2 : 0,
  })
}

function reportDate(data: ReportData, value?: string | null) {
  if (!value) return "No orders in period"
  return new Intl.DateTimeFormat("en-TZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: data.timezone || "Africa/Dar_es_Salaam",
  }).format(new Date(value))
}

function reportDateTime(data: ReportData, value: string) {
  return new Intl.DateTimeFormat("en-TZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: data.timezone || "Africa/Dar_es_Salaam",
  }).format(new Date(value))
}

function inputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function initialDates() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 29)
  return { from: inputDate(from), to: inputDate(to) }
}

export default function AdminReportsPage() {
  const [defaults] = useState(initialDates)
  const [tab, setTab] = useState<ReportTab>("sales")
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<ReportTab | null>(null)
  const [error, setError] = useState<string | null>(null)
  const shortDate = useMemo(() => new Intl.DateTimeFormat("en-TZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: data?.timezone || "Africa/Dar_es_Salaam",
  }), [data?.timezone])
  const dateTime = useMemo(() => new Intl.DateTimeFormat("en-TZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: data?.timezone || "Africa/Dar_es_Salaam",
  }), [data?.timezone])

  function displayDate(value?: string | null) {
    return value ? shortDate.format(new Date(value)) : "No orders in period"
  }

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ from, to })
      setData(await fetchApi<ReportData>(`/api/admin/reports?${params}`))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The report could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  async function exportCsv(type: ReportTab) {
    setExporting(type)
    setError(null)
    try {
      const params = new URLSearchParams({ from, to })
      const file = await downloadApiFile(`/api/admin/reports/export/${type}?${params}`)
      const url = URL.createObjectURL(file.blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = file.filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The report could not be exported.")
    } finally {
      setExporting(null)
    }
  }

  const selectedLabel = tabs.find((item) => item.id === tab)?.label || "Report"

  return (
    <div className="admin-report-print">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .admin-report-print, .admin-report-print * { visibility: visible !important; }
          .admin-report-print { position: absolute; inset: 0; width: 100%; background: white; }
          .report-print-hidden { display: none !important; }
          .admin-report-print table { font-size: 10px; }
        }
      `}</style>

      <AdminPageHeader
        title="Reports"
        breadcrumb={["Dashboard", "Reports"]}
        actions={
          <div className="report-print-hidden flex gap-2">
            <button
              type="button"
              onClick={() => void loadReport()}
              disabled={loading}
              title="Refresh report"
              className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!data || loading}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <Printer className="size-4" /> Print / PDF
            </button>
          </div>
        }
      />

      <section className="report-print-hidden border-y border-border bg-card py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-foreground">
              <span className="mb-1.5 flex items-center gap-2 text-xs uppercase text-muted-foreground">
                <CalendarDays className="size-3.5" /> From
              </span>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 outline-none focus:border-primary sm:w-44"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              <span className="mb-1.5 flex items-center gap-2 text-xs uppercase text-muted-foreground">
                <CalendarDays className="size-3.5" /> To
              </span>
              <input
                type="date"
                value={to}
                min={from}
                max={inputDate(new Date())}
                onChange={(event) => setTo(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 outline-none focus:border-primary sm:w-44"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void exportCsv(tab)}
            disabled={!data || loading || exporting !== null}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {exporting === tab ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Export {selectedLabel} CSV
          </button>
        </div>

        <div className="mt-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="Report type">
          {tabs.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors",
                  tab === item.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> {item.label}
              </button>
            )
          })}
        </div>
      </section>

      {error && (
        <div role="alert" className="mt-5 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => void loadReport()} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="flex min-h-80 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading real report data...
        </div>
      ) : data ? (
        <div className="mt-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{selectedLabel} report</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                {displayDate(data.period.from)} - {displayDate(data.period.to)}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">Generated {dateTime.format(new Date(data.generatedAt))}</p>
          </div>

          {tab === "sales" && <SalesReport data={data} />}
          {tab === "inventory" && <InventoryReport data={data} />}
          {tab === "customers" && <CustomerReport data={data} />}
          {tab === "orders" && <OrdersReport data={data} />}
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Banknote
}) {
  return (
    <AdminCard>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 break-words text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </div>
    </AdminCard>
  )
}

function SalesReport({ data }: { data: ReportData }) {
  const currency = reportCurrency(data)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue" value={currency.format(data.summary.totalRevenue)} detail="Cancelled orders excluded" icon={Banknote} />
        <MetricCard label="Orders" value={wholeNumber.format(data.summary.totalOrders)} detail="Created in selected period" icon={ShoppingBag} />
        <MetricCard label="Average order" value={currency.format(data.summary.averageOrderValue)} detail="Across non-cancelled orders" icon={BarChart3} />
        <MetricCard label="Units sold" value={wholeNumber.format(data.summary.unitsSold)} detail="Across all order items" icon={Package} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <AdminCard>
          <h3 className="text-base font-semibold text-foreground">Revenue trend</h3>
          <p className="mt-1 text-sm text-muted-foreground">Daily non-cancelled order value from the database.</p>
          <div className="mt-4">
            <RevenueBarChart data={data.sales.map((row) => ({ month: row.label, revenue: row.revenue }))} />
          </div>
        </AdminCard>
        <AdminCard>
          <h3 className="text-base font-semibold text-foreground">Orders trend</h3>
          <p className="mt-1 text-sm text-muted-foreground">Orders recorded each day.</p>
          <div className="mt-4">
            <OrdersLineChart data={data.sales.map((row) => ({ month: row.label, orders: row.orders }))} />
          </div>
        </AdminCard>
      </div>

      <AdminCard className="overflow-hidden p-0">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold text-foreground">Top-selling products</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ranked by revenue in the selected period.</p>
        </div>
        <ResponsiveTable
          empty="No product sales were recorded in this period."
          headers={["Product", "Category", "Units", "Stock", "Revenue"]}
          rows={data.topProducts.map((product) => [
            product.name,
            titleCase(product.category),
            wholeNumber.format(product.unitsSold),
            wholeNumber.format(product.stock),
            currency.format(product.revenue),
          ])}
        />
      </AdminCard>
    </div>
  )
}

function InventoryReport({ data }: { data: ReportData }) {
  const currency = reportCurrency(data)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Products" value={wholeNumber.format(data.summary.totalProducts)} detail="All database products" icon={Package} />
        <MetricCard label="Stock units" value={wholeNumber.format(data.summary.totalStock)} detail={currency.format(data.summary.inventoryValue) + " stock value"} icon={ShoppingBag} />
        <MetricCard label="Low stock" value={wholeNumber.format(data.summary.lowStockProducts)} detail="Between 1 and 5 units" icon={TriangleAlert} />
        <MetricCard label="Out of stock" value={wholeNumber.format(data.summary.outOfStockProducts)} detail="Requires restocking" icon={Package} />
      </div>

      <AdminCard className="overflow-hidden p-0">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold text-foreground">Current inventory</h3>
          <p className="mt-1 text-sm text-muted-foreground">Live stock levels, lowest stock first.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-secondary/70 text-xs uppercase text-muted-foreground">
              <tr>
                {['Product', 'SKU', 'Category', 'Status', 'Stock', 'Price', 'Stock value'].map((header) => (
                  <th key={header} className="px-5 py-3 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.inventory.map((product) => (
                <tr key={product.id} className="hover:bg-secondary/35">
                  <td className="px-5 py-3 font-medium text-foreground">{product.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{product.sku || "Not set"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{titleCase(product.category)}</td>
                  <td className="px-5 py-3"><StatusBadge status={product.status} /></td>
                  <td className={cn("px-5 py-3 font-semibold", product.stock <= 5 ? "text-red-600" : "text-foreground")}>{wholeNumber.format(product.stock)}</td>
                  <td className="px-5 py-3 text-foreground">{currency.format(product.price)}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{currency.format(product.stockValue)}</td>
                </tr>
              ))}
              {!data.inventory.length && <EmptyTableRow colSpan={7} message="No products exist in the database." />}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}

function CustomerReport({ data }: { data: ReportData }) {
  const currency = reportCurrency(data)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Customers" value={wholeNumber.format(data.summary.totalCustomers)} detail="Registered buyer accounts" icon={Users} />
        <MetricCard label="New customers" value={wholeNumber.format(data.summary.newCustomers)} detail="Joined during selected period" icon={UserPlus} />
        <MetricCard label="Repeat customers" value={wholeNumber.format(data.summary.repeatCustomers)} detail="More than one non-cancelled order" icon={Repeat2} />
        <MetricCard label="Customer order value" value={currency.format(data.summary.totalRevenue)} detail="Selected-period revenue" icon={Banknote} />
      </div>

      <AdminCard className="overflow-hidden p-0">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold text-foreground">Customer performance</h3>
          <p className="mt-1 text-sm text-muted-foreground">Registered buyers ranked by selected-period spend.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-secondary/70 text-xs uppercase text-muted-foreground">
              <tr>
                {['Customer', 'Contact', 'Joined', 'Orders', 'Total spent', 'Last order'].map((header) => (
                  <th key={header} className="px-5 py-3 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-secondary/35">
                  <td className="px-5 py-3 font-medium text-foreground">{customer.name}</td>
                  <td className="px-5 py-3">
                    <span className="block text-foreground">{customer.email}</span>
                    <span className="text-xs text-muted-foreground">{customer.phone || "No phone"}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{reportDate(data, customer.joinedAt)}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{wholeNumber.format(customer.orders)}</td>
                  <td className="px-5 py-3 font-semibold text-foreground">{currency.format(customer.totalSpent)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{reportDate(data, customer.lastOrderAt)}</td>
                </tr>
              ))}
              {!data.customers.length && <EmptyTableRow colSpan={6} message="No buyer accounts exist in the database." />}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}

function OrdersReport({ data }: { data: ReportData }) {
  const currency = reportCurrency(data)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {data.orderStatuses.map((status) => (
          <AdminCard key={status.status}>
            <StatusBadge status={status.status} />
            <p className="mt-4 text-2xl font-bold text-foreground">{wholeNumber.format(status.orders)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{currency.format(status.revenue)} order value</p>
          </AdminCard>
        ))}
      </div>

      <AdminCard className="overflow-hidden p-0">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold text-foreground">Order register</h3>
          <p className="mt-1 text-sm text-muted-foreground">Every database order created in the selected period.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-secondary/70 text-xs uppercase text-muted-foreground">
              <tr>
                {['Order', 'Customer', 'Status', 'Payment', 'Units', 'Total', 'Created'].map((header) => (
                  <th key={header} className="px-5 py-3 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.orders.map((order) => (
                <tr key={order.id} className="hover:bg-secondary/35">
                  <td className="px-5 py-3 font-semibold text-primary">{order.orderNumber}</td>
                  <td className="px-5 py-3">
                    <span className="block font-medium text-foreground">{order.customerName}</span>
                    <span className="text-xs text-muted-foreground">{order.customerEmail || "Seller-created order"}</span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-5 py-3"><StatusBadge status={order.paymentStatus} /></td>
                  <td className="px-5 py-3 text-foreground">{wholeNumber.format(order.units)}</td>
                  <td className="px-5 py-3 font-semibold text-foreground">{currency.format(order.total)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{reportDateTime(data, order.createdAt)}</td>
                </tr>
              ))}
              {!data.orders.length && <EmptyTableRow colSpan={7} message="No orders were created in this period." />}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}

function ResponsiveTable({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-secondary/70 text-xs uppercase text-muted-foreground">
          <tr>{headers.map((header) => <th key={header} className="px-5 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`} className="hover:bg-secondary/35">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className={cn("px-5 py-3 text-muted-foreground", cellIndex === 0 && "font-medium text-foreground", cellIndex === row.length - 1 && "font-semibold text-foreground")}>{cell}</td>
              ))}
            </tr>
          ))}
          {!rows.length && <EmptyTableRow colSpan={headers.length} message={empty} />}
        </tbody>
      </table>
    </div>
  )
}

function EmptyTableRow({ colSpan, message }: { colSpan: number; message: string }) {
  return <tr><td colSpan={colSpan} className="px-5 py-12 text-center text-sm text-muted-foreground">{message}</td></tr>
}

function titleCase(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase())
}
