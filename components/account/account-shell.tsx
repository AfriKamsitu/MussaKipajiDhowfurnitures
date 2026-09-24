"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Heart,
  Home,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { EditorialSiteFooter as SiteFooter } from "@/components/editorial-site-footer"
import { EditorialSiteHeader as SiteHeader } from "@/components/editorial-site-header"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { openWhatsApp } from "@/lib/whatsapp"

const accountLinks = [
  { label: "Overview", href: "/account", icon: Home },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Saved", href: "/wishlist", icon: Heart },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Profile", href: "/account/profile", icon: UserRound },
]

export function AccountShell({
  title,
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(pathname || "/account")
      router.replace(`/login?redirect=${redirect}`)
    }
  }, [loading, pathname, router, user])

  if (loading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-6 animate-spin" aria-hidden="true" />
        <span className="sr-only">Preparing your account</span>
      </div>
    )
  }

  const firstName = user.name.split(" ")[0] || "there"
  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href)

  function handleSignOut() {
    signOut()
    router.push("/")
  }

  return (
    <div className="buyer-editorial-shell flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-[linear-gradient(180deg,#f6f4ee_0%,#ffffff_280px)] px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="flex flex-col gap-5 bg-primary px-5 py-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-sm text-primary-foreground/75">Welcome back, {firstName}</p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">Your shopping account</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/80">
                  Check orders, delivery addresses, and saved furniture in one simple place.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp("Hello Paje Dhow Furniture, I need help with my account or order.")
                  }
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-card px-4 text-sm font-bold text-foreground hover:bg-card/90"
                >
                  <MessageCircle className="size-4" />
                  Get help
                </button>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary-foreground/30 px-4 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <ShieldCheck className="size-4" />
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary-foreground/30 px-4 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </div>

            <nav
              className="scrollbar-none flex overflow-x-auto border-b border-border bg-card px-2 sm:px-5"
              aria-label="Account pages"
            >
              {accountLinks.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-14 shrink-0 items-center gap-2 px-3 text-sm font-bold transition-colors sm:px-4",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                    {active && (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-black text-foreground">{title}</h2>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
              </div>
              {children}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
