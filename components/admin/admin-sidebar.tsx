"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  BarChart3,
  Box,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Settings,
  Ticket,
  Users,
  X,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

const mainNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Box },
  { label: "Categories", href: "/admin/categories", icon: LayoutGrid },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Banners", href: "/admin/banners", icon: ImageIcon },
  { label: "Reports", href: "/admin/reports", icon: FileText },
]

const manageNav = [
  { label: "Users & Roles", href: "/admin/users", icon: ShieldCheck },
  { label: "System Settings", href: "/admin/settings", icon: Settings },
  { label: "Activity Logs", href: "/admin/activity", icon: Activity },
]

function NavLink({
  item,
  active,
  onNavigate,
  badge = 0,
}: {
  item: { label: string; href: string; icon: React.ElementType }
  active: boolean
  onNavigate?: () => void
  badge?: number
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-200",
        active
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-primary",
      )}
    >
      <Icon className="size-4" />
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span
          className={cn(
            "flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
            active ? "bg-white/20 text-white" : "bg-accent text-accent-foreground",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const initials = (user?.name || "Admin User")
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
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/35 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/admin" className="group flex items-center gap-2.5">
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10">
              <Image src="/kipaji-dhow-furniture-logo.jpg" alt="Kipaji Dhow Furniture logo" width={44} height={44} className="size-11 rounded-full object-cover" />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-medium uppercase tracking-[0.16em] text-foreground">Kipaji Dhow</span>
              <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Admin panel</span>
            </span>
          </Link>
          <button type="button" data-admin-drawer-close onClick={onClose} className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary lg:hidden" aria-label="Close admin menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          <div>
            <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">Main</p>
            <div className="space-y-1">
              {mainNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onClose} />
              ))}
            </div>
          </div>
          <div>
            <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">Manage</p>
            <div className="space-y-1">
              {manageNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onClose} />
              ))}
            </div>
          </div>
        </nav>

        {/* Admin profile */}
        <div className="relative border-t border-sidebar-border p-3">
          {menuOpen && (
            <div className="admin-glass admin-enter absolute inset-x-3 bottom-full mb-1 overflow-hidden rounded-xl border border-white/60 shadow-elevated">
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
            className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-[background-color,transform] hover:translate-x-0.5 hover:bg-sidebar-accent/80"
          >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-transform duration-200 group-hover:scale-105">
              {initials || "AU"}
            </span>
            <span className="flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold text-foreground">{user?.name || "Admin User"}</span>
              <span className="block text-[11px] capitalize text-muted-foreground">{user?.role ?? "admin"}</span>
            </span>
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  )
}
