"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, type CSSProperties } from "react"
import {
  ArrowUpRight,
  Box,
  CalendarDays,
  DollarSign,
  Images,
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
import { useStoreSettings } from "@/components/store-settings-provider"
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

function CatalogPreview({
  products,
  currency,
}: {
  products: DashboardData["topSelling"]
  currency: string
}) {
  const items = products.slice(0, 8)

  return (
    <section className="admin-panel admin-enter mt-6 overflow-hidden rounded-2xl border border-white/65">
      <div className="flex flex-col gap-3 border-b border-white/55 bg-card/45 px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            <Images className="size-4" />
            Live catalogue
          </p>
          <h2 className="mt-1 text-lg font-bold text-foreground">Storefront image preview</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Browse the same full-bleed imagery your customers see.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-sm font-semibold text-foreground backdrop-blur transition-[background-color,color,transform] hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground"
        >
          Manage catalogue
          <ArrowUpRight className="size-4" />
        </Link>
      </div>

      {items.length ? (
        <div className="admin-marquee-viewport overflow-hidden px-3 py-4 sm:px-5">
          <div className="admin-marquee-track flex w-max gap-4">
            {[false, true].map((duplicate) => (
              <div
                key={duplicate ? "duplicate" : "primary"}
                className={duplicate ? "flex gap-4" : "flex gap-4"}
                aria-hidden={duplicate || undefined}
              >
                {items.map((product, index) => {
                  const content = (
                    <>
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={duplicate ? "" : product.name}
                        fill
                        sizes="(max-width: 640px) 224px, 256px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <span className="block truncate text-sm font-semibold">{product.name}</span>
                        <span className="mt-1 block text-xs font-medium text-white/75">
                          {typeof product.price === "number"
                            ? formatTZS(product.price, currency)
                            : product.price}
                        </span>
                      </span>
                    </>
                  )

                  return duplicate ? (
                    <article
                      key={`${product.name}-duplicate-${index}`}
                      className="group relative h-40 w-56 shrink-0 overflow-hidden rounded-xl border border-white/55 bg-card/55 shadow-soft backdrop-blur-xl sm:w-64"
                    >
                      {content}
                    </article>
                  ) : (
                    <Link
                      key={`${product.name}-${index}`}
                      href="/admin/products"
                      className="group relative h-40 w-56 shrink-0 overflow-hidden rounded-xl border border-white/55 bg-card/55 shadow-soft backdrop-blur-xl transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-64"
                    >
                      {content}
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <Images className="mx-auto size-8 text-primary/60" />
          <p className="mt-3 font-semibold text-foreground">Catalogue preview is ready</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Product images will slide here when catalogue data is available.
          </p>
        </div>
      )}
    </section>
  )
}

export function DashboardSummary() {
  const { currency } = useStoreSettings()
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
      <section className="admin-dashboard-hero admin-enter relative isolate mb-7 overflow-hidden rounded-2xl border border-white/20 text-[#f1eee6] shadow-[0_28px_70px_-42px_rgba(17,19,15,0.65)]">
        <Image
          src="/reference-site/craft-workshop.webp"
          alt="The Paje Dhow Furniture workshop"
          fill
          sizes="(max-width: 1024px) 100vw, 900px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,15,0.95),rgba(17,19,15,0.62)_58%,rgba(17,19,15,0.22)),linear-gradient(0deg,rgba(17,19,15,0.75),transparent_70%)]" />
        <div className="relative flex min-h-[270px] flex-col justify-between gap-10 px-5 py-6 sm:min-h-[300px] sm:px-8 sm:py-8 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c5a274]">
              Paje Dhow / Store dashboard
            </p>
            <span className="hidden text-[9px] uppercase tracking-[0.18em] text-white/55 sm:block">
              Live workshop overview
            </span>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="max-w-[12ch] text-[clamp(2.3rem,5vw,4.4rem)] font-medium leading-[0.9] tracking-[-0.065em]">
                Run the workshop
                <br />
                <span className="font-light italic text-[#c5a274]">moving.</span>
              </h1>
              <p className="mt-4 max-w-lg text-sm font-light leading-6 text-white/68">
                See what is selling, what needs attention, and what the workshop is preparing next.
              </p>
            </div>
            <Link
              href="/admin/products"
              className="group inline-flex min-h-11 w-fit items-center gap-3 border border-white/30 px-4 text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-[#c5a274] hover:text-[#c5a274]"
            >
              Manage collection
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your store performance</p>
        </div>
        <span className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          This month
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((s, index) => {
          const Icon = statIcons[s.icon ?? ""] ?? DollarSign
          return (
            <AdminCard
              key={s.label}
              className="admin-stagger p-4 sm:p-5"
              style={{ "--admin-stagger-index": index } as CSSProperties}
            >
              <div className="flex items-start justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-11">
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground sm:mt-4 sm:text-sm">{s.label}</p>
              <p className="mt-1 break-words text-[clamp(1rem,4.4vw,1.5rem)] font-bold leading-tight text-foreground sm:text-2xl">{s.value}</p>
            </AdminCard>
          )
        })}
      </div>

      <CatalogPreview products={topSelling} currency={currency} />

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
            <Link href="/admin/products" className="inline-flex min-h-11 items-center px-1 text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-3">
            {topSelling.map((p) => (
              <li key={p.name} className="group flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-secondary/55">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  <Image src={p.image || "/placeholder.svg"} alt={p.name} fill sizes="44px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {typeof p.price === "number" ? formatTZS(p.price, currency) : p.price}
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
            <Link href="/admin/orders" className="inline-flex min-h-11 items-center px-1 text-xs font-medium text-primary hover:underline">
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
                  <span className="block text-sm font-medium text-foreground">{formatTZS(o.total, currency)}</span>
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
