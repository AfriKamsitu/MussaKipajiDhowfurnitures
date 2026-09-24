import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function SectionHeading({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1.5 rounded-full bg-accent sm:h-7" />
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent/80"
        >
          {actionLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}
