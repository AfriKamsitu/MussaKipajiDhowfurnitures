"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, MapPin, Menu, ShoppingCart, Sparkles, UserRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { cn } from "@/lib/utils"

export function DesktopBuyerRail() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { cartCount, wishlistCount } = useStore()
  const settings = useStoreSettings()

  if (user?.role === "admin") return null

  const items = [
    {
      label: "Category",
      href: "/shop",
      icon: Menu,
      active: pathname.startsWith("/shop") || pathname.startsWith("/product"),
      count: 0,
    },
    {
      label: "Faves",
      href: "/wishlist",
      icon: Heart,
      active: pathname.startsWith("/wishlist"),
      count: wishlistCount,
    },
    {
      label: "Cart",
      href: "/cart",
      icon: ShoppingCart,
      active: pathname.startsWith("/cart") || pathname.startsWith("/checkout"),
      count: cartCount,
    },
    {
      label: "Account",
      href: user ? "/account" : "/login",
      icon: UserRound,
      active: pathname.startsWith("/account") || pathname.startsWith("/login"),
      count: 0,
    },
  ]

  return (
    <aside className="buyer-desktop-rail fixed inset-y-0 left-0 z-[80] hidden w-[88px] flex-col items-center bg-[linear-gradient(180deg,#aeb9a8_0%,#777b55_52%,#394332_100%)] text-white shadow-[14px_0_40px_-24px_rgba(44,48,33,0.65)] xl:flex">
      <Link
        href="/"
        aria-label={settings.storeName + " home"}
        className="group mt-5 flex size-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-white/50 transition duration-300 hover:-translate-y-0.5 hover:scale-105"
      >
        <Image
          src={settings.logoUrl}
          alt=""
          width={56}
          height={56}
          className="size-full object-cover"
          unoptimized
        />
      </Link>

      <nav className="mt-12 flex w-full flex-1 flex-col items-center gap-5" aria-label="Desktop buyer shortcuts">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "group relative flex w-[72px] flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-[10px] font-black transition-all duration-300",
              item.active
                ? "bg-white/18 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]"
                : "text-white/88 hover:-translate-y-0.5 hover:bg-white/12 hover:text-white",
            )}
          >
            <span className="relative">
              <item.icon className="size-7 stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              {item.count > 0 && (
                <span className="absolute -right-3 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-black leading-[18px] text-[#53583f] shadow-sm">
                  {item.count > 9 ? "9+" : item.count}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mb-6 flex flex-col items-center gap-3">
        <Link
          href="/contact"
          className="group flex w-[72px] flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-[10px] font-black text-white/88 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/12 hover:text-white"
        >
          <MapPin className="size-6 transition-transform duration-300 group-hover:scale-110" />
          Visit
        </Link>
        <Link
          href="/offers"
          aria-label="Current offers"
          className="flex size-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-all duration-300 hover:rotate-6 hover:scale-105 hover:bg-white/20"
        >
          <Sparkles className="size-5" />
        </Link>
      </div>
    </aside>
  )
}