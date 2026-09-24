"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Home, ShoppingBag, Store, UserRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useStore } from "@/components/store-provider"
import { cn } from "@/lib/utils"

export function MobileBuyerNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { cartCount, wishlistCount } = useStore()

  if (user?.role === "admin") return null

  const items = [
    { label: "Home", href: "/", icon: Home, active: pathname === "/", count: 0 },
    {
      label: "Shop",
      href: "/shop",
      icon: Store,
      active: pathname.startsWith("/shop") || pathname.startsWith("/product"),
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
      icon: ShoppingBag,
      active: pathname.startsWith("/cart") || pathname.startsWith("/checkout"),
      count: cartCount,
    },
    {
      label: "Account",
      href: user ? "/account" : "/login",
      icon: UserRound,
      active: pathname.startsWith("/account"),
      count: 0,
    },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Buyer navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 px-2 py-1">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "group relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 border-t-2 border-transparent px-1 text-[9px] font-bold transition-colors",
              item.active
                ? "border-primary bg-secondary text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <span className="relative">
              <item.icon
                className={cn(
                  "size-[19px] transition-transform duration-200 group-hover:-translate-y-0.5",
                  item.active && "stroke-[2.25]",
                )}
              />
              {Number(item.count) > 0 && (
                <span
                  className={cn(
                    "absolute -right-3 -top-2 flex min-w-[17px] items-center justify-center rounded-full px-1 text-[8px] font-black leading-[17px]",
                    item.active
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {Number(item.count) > 9 ? "9+" : item.count}
                </span>
              )}
            </span>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
