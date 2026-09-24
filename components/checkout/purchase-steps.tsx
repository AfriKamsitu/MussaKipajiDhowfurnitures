import { Check, MapPin, MessageCircle, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  { id: "cart", label: "Cart", detail: "Your pieces", icon: ShoppingBag },
  { id: "details", label: "Details", detail: "Delivery", icon: MapPin },
  { id: "confirm", label: "Confirm", detail: "WhatsApp", icon: MessageCircle },
] as const

export function PurchaseSteps({
  current,
}: {
  current: (typeof steps)[number]["id"]
}) {
  const currentIndex = steps.findIndex((step) => step.id === current)

  return (
    <nav aria-label="Order progress" className="w-full min-w-[17rem] max-w-md">
      <ol className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {steps.map((step, index) => {
          const complete = index < currentIndex
          const active = index === currentIndex
          return (
            <li
              key={step.id}
              aria-current={active ? "step" : undefined}
              className={cn(
                "relative flex min-w-0 items-center gap-2 border-r border-border px-3 py-3 last:border-r-0",
                active && "bg-primary/[0.06]",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                  complete && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/10 text-primary",
                  !complete && !active && "border-border bg-secondary/55 text-muted-foreground",
                )}
              >
                {complete ? <Check className="size-4" /> : <step.icon className="size-3.5" />}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-[10px] font-black sm:text-xs",
                    active || complete ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span className="hidden truncate text-[9px] text-muted-foreground sm:block">
                  {step.detail}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
