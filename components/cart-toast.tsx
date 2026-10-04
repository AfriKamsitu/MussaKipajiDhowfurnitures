"use client"

import { useEffect } from "react"
import { SafeImage as Image } from "@/components/safe-image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check, X } from "lucide-react"
import { useStore } from "@/components/store-provider"

const VISIBLE_MS = 4500

/** Confirms an add-to-cart without leaving the page, with a direct route to the cart. */
export function CartToast() {
  const pathname = usePathname()
  const { cartNotice, dismissCartNotice, cartCount } = useStore()

  useEffect(() => {
    if (!cartNotice) return
    const timer = window.setTimeout(dismissCartNotice, VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [cartNotice, dismissCartNotice])

  // The cart and checkout already show the result of the action.
  useEffect(() => {
    dismissCartNotice()
  }, [pathname, dismissCartNotice])

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-3 top-[calc(var(--site-header-height)+0.5rem)] z-[95] flex justify-center sm:inset-x-auto sm:right-5 sm:justify-end"
    >
      {cartNotice && (
        <div
          key={cartNotice.at}
          className="sf-toast-enter sf-card pointer-events-auto flex w-full max-w-sm items-center gap-3 p-3 shadow-elevated"
        >
          <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-secondary">
            <Image
              src={cartNotice.product.image || "/placeholder.svg"}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-success">
              <Check className="size-4" aria-hidden="true" />
              {cartNotice.quantity > 0 ? "Added to cart" : "Already at the stock limit"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {cartNotice.quantity > 1 ? `${cartNotice.quantity} × ` : ""}
              {cartNotice.product.name}
              {cartNotice.limited && cartNotice.quantity > 0 ? " (limited by stock)" : ""}
            </p>
            <Link
              href="/cart"
              className="mt-1 inline-flex min-h-6 items-center text-xs font-bold text-primary underline-offset-2 hover:underline"
            >
              View cart ({cartCount})
            </Link>
          </div>
          <button
            type="button"
            onClick={dismissCartNotice}
            aria-label="Dismiss"
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
