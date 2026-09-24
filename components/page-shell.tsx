import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Fragment, type ReactNode } from "react"
import { EditorialSiteHeader as SiteHeader } from "@/components/editorial-site-header"
import { EditorialSiteFooter as SiteFooter } from "@/components/editorial-site-footer"
import { cn } from "@/lib/utils"

export type Crumb = { label: string; href?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground sm:text-[11px]"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && <ChevronRight className="size-4" />}
          {item.href ? (
            <Link
              href={item.href}
              className="inline-flex min-h-6 items-center transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}

export function PageIntro({
  eyebrow,
  title,
  description,
  children,
  compact = false,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
  compact?: boolean
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6 border-b border-black/12 sm:flex-row sm:items-end sm:justify-between",
        compact
          ? "mb-7 mt-5 pb-7 sm:mb-9 sm:mt-8 sm:pb-9"
          : "mb-10 mt-8 pb-10 sm:mb-14 sm:mt-10 sm:pb-14",
      )}
    >
      <div className={cn(compact ? "max-w-4xl" : "max-w-3xl")}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1
          className={cn(
            "text-balance font-medium leading-[0.92] text-foreground",
            compact
              ? "mt-3 max-w-[18ch] text-[clamp(2.35rem,5vw,4.6rem)] tracking-[-0.052em]"
              : "mt-4 max-w-[13ch] text-[clamp(2.8rem,6vw,5.8rem)] tracking-[-0.062em]",
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "max-w-2xl font-light text-muted-foreground",
              compact
                ? "mt-4 text-sm leading-6 sm:text-base sm:leading-7"
                : "mt-6 text-sm leading-7 sm:text-base sm:leading-8",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </header>
  )
}

export function PageShell({
  children,
  wide = false,
}: {
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className="buyer-editorial-shell flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main
        id="main-content"
        className={cn(
          "mx-auto w-full flex-1",
          wide
            ? "max-w-[1640px] px-3 pb-16 sm:px-6 sm:pb-24 lg:px-8"
            : "max-w-[1320px] px-5 pb-16 sm:px-8 sm:pb-24 lg:px-10",
        )}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}