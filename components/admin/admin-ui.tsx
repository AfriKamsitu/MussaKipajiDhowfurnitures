import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminPageHeader({
  title,
  breadcrumb,
  actions,
}: {
  title: string
  breadcrumb: string[]
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <nav className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5" />}
              <span className={cn(i === breadcrumb.length - 1 && "text-foreground")}>{crumb}</span>
            </span>
          ))}
        </nav>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  )
}

const badgeStyles: Record<string, string> = {
  Published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Draft: "bg-amber-50 text-amber-700 ring-amber-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Processing: "bg-violet-50 text-violet-700 ring-violet-200",
  Shipped: "bg-sky-50 text-sky-700 ring-sky-200",
  Archived: "bg-slate-100 text-slate-600 ring-slate-200",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  Expired: "bg-slate-100 text-slate-600 ring-slate-200",
  Cancelled: "bg-red-50 text-red-700 ring-red-200",
}

function prettifyStatus(status: string) {
  if (!status) return status
  const normalized = status.replace(/_/g, " ")
  if (normalized === normalized.toUpperCase()) {
    return normalized
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return normalized
}

export function StatusBadge({ status }: { status: string }) {
  const label = prettifyStatus(status)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        badgeStyles[label] ?? "bg-slate-100 text-slate-600 ring-slate-200",
      )}
    >
      {label}
    </span>
  )
}

export function PrimaryButton({
  children,
  href,
  onClick,
  type = "button",
  className,
}: {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  type?: "button" | "submit"
  className?: string
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
    className,
  )
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  )
}
