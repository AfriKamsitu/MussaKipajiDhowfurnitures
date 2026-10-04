import type { ReactNode } from "react"
import { AlertTriangle, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Shared empty state: one icon, one line of explanation, one clear next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("sf-card flex flex-col items-center gap-3 px-6 py-12 text-center sm:py-16", className)}>
      {Icon && (
        <span className="grid size-14 place-items-center rounded-full bg-secondary text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  )
}

/** Shared failure state for a request that can be retried. */
export function ErrorState({
  title = "We couldn't load this right now",
  description = "Check your connection and try again.",
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div role="alert" className={cn("sf-card flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      <span className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="sf-btn sf-btn-outline mt-1">
          Try again
        </button>
      )}
    </div>
  )
}
