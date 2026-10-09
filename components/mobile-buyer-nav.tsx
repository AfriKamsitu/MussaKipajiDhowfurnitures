"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Home, Menu, ShoppingCart, UserRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { openBuyerMenu } from "@/components/site-header"
import { useStore } from "@/components/store-provider"
import { cn } from "@/lib/utils"

const tab =
  "group relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 border-t-2 border-transparent px-1 text-[10px] font-bold transition-colors"

/** App-style tab bar for phones and tablets: Home, You, Saved, Cart and the browse menu. */
export function MobileBuyerNav({
  onMenu = openBuyerMenu,
}: {
  /** Pages without the storefront header open their own menu instead. */
  onMenu?: () => void
}) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { cartCount, wishlistCount } = useStore()

  if (user?.role === "admin") return null

  const items = [
    { label: "Home", href: "/", icon: Home, active: pathname === "/", count: 0 },
    {
      label: "You",
      href: user ? "/account" : "/login",
      icon: UserRound,
      active: pathname.startsWith("/account"),
      count: 0,
    },
    {
      label: "Saved",
      href: "/wishlist",
      icon: Heart,
      active: pathname.startsWith("/wishlist"),
      count: wishlistCount,
    },
    {
      label: "Cart",
      href: "/cart",
      icon: ShoppingCart,
      active: pathname.startsWith("/cart"),
      count: cartCount,
    },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Buyer navigation"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-5 px-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              tab,
              item.active ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="relative">
              <item.icon className={cn("size-[21px]", item.active && "stroke-[2.25]")} aria-hidden="true" />
              {item.count > 0 && (
                <span className="absolute -right-3 -top-2 flex min-w-[17px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black leading-[17px] text-primary-foreground">
                  {item.count > 99 ? "99+" : item.count}
                </span>
              )}
            </span>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        ))}
        <button type="button" onClick={onMenu} aria-haspopup="dialog" className={cn(tab, "text-muted-foreground hover:text-foreground")}>
          <Menu className="size-[21px]" aria-hidden="true" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  )
}
