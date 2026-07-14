"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  ShoppingBag,
  Store,
  User as UserIcon,
  X,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

const shopNav = [
  { label: "Dashboard", href: "/account", icon: LayoutDashboard },
  { label: "My Orders", href: "/account/orders", icon: Package },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Cart", href: "/cart", icon: ShoppingBag },
]

const accountNav = [
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Profile", href: "/account/profile", icon: UserIcon },
]

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: { label: string; href: string; icon: React.ElementType }
  active: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-[18px]" />
      <span className="flex-1">{item.label}</span>
    </Link>
  )
}

export function AccountSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (href: string) => (href === "/account" ? pathname === "/account" : pathname.startsWith(href))

  const initials = (user?.name || "Buyer")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  function handleSignOut() {
    signOut()
    router.push("/")
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Image src="/paje-dhow-logo.png" alt="Paje Dhow Furniture logo" width={36} height={36} className="size-7 object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold uppercase tracking-wide text-foreground">Paje Dhow</span>
              <span className="block text-[11px] text-muted-foreground">My Account</span>
            </span>
          </Link>
          <button onClick={onClose} className="text-muted-foreground lg:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          <div>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Shopping</p>
            <div className="space-y-1">
              {shopNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onClose} />
              ))}
            </div>
          </div>
          <div>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
            <div className="space-y-1">
              {accountNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onClose} />
              ))}
            </div>
          </div>
        </nav>

        {/* Profile footer */}
        <div className="relative border-t border-sidebar-border p-3">
          {menuOpen && (
            <div className="absolute inset-x-3 bottom-full mb-1 overflow-hidden rounded-lg border border-border bg-popover shadow-elevated">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <Store className="size-4" />
                Back to store
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {initials || "B"}
            </span>
            <span className="flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold text-foreground">{user?.name || "Buyer"}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{user?.email}</span>
            </span>
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  )
}
