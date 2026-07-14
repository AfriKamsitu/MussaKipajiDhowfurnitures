"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Loader2, Menu, MessageCircle, Store } from "lucide-react"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { useAuth } from "@/components/auth-provider"
import { openWhatsApp } from "@/lib/whatsapp"

export function AccountShell({
  title,
  breadcrumb = ["My Account", title],
  actions,
  children,
}: {
  title: string
  breadcrumb?: string[]
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/account")
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  const initials = (user.name || "Buyer")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AccountSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <Link
            href="/"
            className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:inline-flex"
          >
            <Store className="size-4" />
            Store
          </Link>

          {user.role === "admin" && (
            <Link
              href="/admin"
              className="hidden items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
            >
              Admin panel
            </Link>
          )}

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() =>
                openWhatsApp("Hello Paje Dhow Furniture, I need help with my account/order.")
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
            >
              <MessageCircle className="size-4" />
              <span className="hidden sm:inline">Support</span>
            </button>
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {initials || "B"}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {/* Page header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <nav className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
                {breadcrumb.map((crumb, i) => (
                  <span key={crumb} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="size-3.5" />}
                    <span className={i === breadcrumb.length - 1 ? "text-foreground" : undefined}>{crumb}</span>
                  </span>
                ))}
              </nav>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  )
}
