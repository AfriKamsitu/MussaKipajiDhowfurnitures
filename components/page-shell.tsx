import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Fragment, type ReactNode } from "react"
import { MobileBuyerNav } from "@/components/mobile-buyer-nav"
import { SiteFooter } from "@/components/site-footer"
import { CheckoutHeader, SiteHeader } from "@/components/site-header"
import { cn } from "@/lib/utils"

export type Crumb = { label: string; href?: string }

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "scrollbar-none flex items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-muted-foreground sm:text-[13px]",
        className,
      )}
    >
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
          {item.href ? (
            <Link href={item.href} className="inline-flex min-h-6 items-center hover:text-primary hover:underline">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="max-w-[60vw] truncate font-semibold text-foreground">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}

/** Compact page heading: title, optional one-line description and actions. */
export function PageIntro({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
  /** Kept for callers of the previous editorial layout; no longer rendered. */
  eyebrow?: string
  compact?: boolean
}) {
  return (
    <header className="mb-5 mt-3 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-light tracking-[0.01em] text-foreground sm:text-[2rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </header>
  )
}

/** Standard buyer page frame: shared header, centred content column and footer. */
export function PageShell({
  children,
  className,
  variant = "default",
  footer = true,
}: {
  children: ReactNode
  className?: string
  /** Kept for callers of the previous layout; every page now uses one width. */
  wide?: boolean
  /** Checkout drops the browse header, footer links and tab bar so nothing pulls the buyer away. */
  variant?: "default" | "checkout"
  /** False leaves out the footer links; phones and tablets keep the bottom tab bar. */
  footer?: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {variant === "checkout" ? <CheckoutHeader /> : <SiteHeader />}
      <main
        id="main-content"
        className={cn("sf-container flex-1 pb-12 pt-4 sm:pb-16 sm:pt-5", !footer && "max-lg:pb-28", className)}
      >
        {children}
      </main>
      {variant === "checkout" ? (
        <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          <Link href="/contact" className="hover:text-primary hover:underline">
            Need help? Contact us
          </Link>
        </footer>
      ) : footer ? (
        <SiteFooter />
      ) : (
        <MobileBuyerNav />
      )}
    </div>
  )
}
