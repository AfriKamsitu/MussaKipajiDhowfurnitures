"use client"

import { useEffect } from "react"
import Image from "next/image"
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
      router.replace("/login?redirect=" + redirect)
    }
  }, [loading, pathname, router, user])

  if (loading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-6 animate-spin" />
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
    <div className="buyer-editorial-shell flex min-h-screen flex-col bg-[#f6f4ee] text-foreground">
      <SiteHeader />

      <main id="main-content" className="flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        <div className="mx-auto max-w-[1440px]">
          <section className="buyer-dashboard-hero relative isolate min-h-[360px] overflow-hidden bg-[#11130f] text-[#f1eee6] sm:min-h-[420px]">
            <Image
              src="/reference-site/hero.jpg"
              alt="A warm Paje Dhow Furniture interior"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-70"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,15,0.94),rgba(17,19,15,0.62)_56%,rgba(17,19,15,0.2)),linear-gradient(0deg,rgba(17,19,15,0.88),transparent_72%)]" />

            <div className="relative flex min-h-[360px] flex-col justify-between px-5 py-7 sm:min-h-[420px] sm:px-9 sm:py-9 lg:px-12 lg:py-11">
              <div className="flex items-center justify-between gap-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c5a274]">
                  Your account
                </p>
                <span className="hidden text-[9px] uppercase tracking-[0.18em] text-white/55 sm:block">
                  Paje Dhow Furniture · Zanzibar
                </span>
              </div>

              <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-light text-white/68">Welcome back, {firstName}</p>
                  <h1 className="mt-3 max-w-[10ch] text-[clamp(3.3rem,7vw,6.5rem)] font-medium leading-[0.86] tracking-[-0.075em]">
                    {title === "Account overview" ? (
                      <>
                        Your furniture,
                        <br />
                        <span className="font-light italic text-[#c5a274]">in one place.</span>
                      </>
                    ) : (
                      title
                    )}
                  </h1>
                  <p className="mt-6 max-w-xl text-[14px] font-light leading-7 text-white/68 sm:text-base">
                    Track orders, manage your account details, and get help whenever you need it.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsApp(
                        "Hello Paje Dhow Furniture, I need help with my account or order.",
                      )
                    }
                    className="inline-flex min-h-11 items-center gap-2 border border-white/30 px-4 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:border-[#c5a274] hover:text-[#c5a274]"
                  >
                    <MessageCircle className="size-4" />
                    Get help
                  </button>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="inline-flex min-h-11 items-center gap-2 border border-white/30 px-4 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:border-[#c5a274] hover:text-[#c5a274]"
                    >
                      <ShieldCheck className="size-4" />
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex min-h-11 items-center gap-2 border border-white/30 px-4 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:border-[#c5a274] hover:text-[#c5a274]"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start">
            <aside className="space-y-4 lg:sticky lg:top-28">
              <nav
                className="buyer-account-nav border border-black/10 bg-white p-2 shadow-[0_20px_45px_-38px_rgba(17,19,15,0.55)]"
                aria-label="Account pages"
              >
                <p className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9b5e3b]">
                  Your account
                </p>
                {accountLinks.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex min-h-11 items-center gap-3 px-3 text-sm font-semibold transition",
                        active
                          ? "bg-[#263228] text-[#f1eee6]"
                          : "text-[#66675f] hover:bg-[#f1eee6] hover:text-[#11130f]",
                      )}
                    >
                      <Icon className={cn("size-4", active ? "text-[#c5a274]" : "text-[#9b5e3b]")} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="border border-[#c5a274]/35 bg-[#263228] p-5 text-[#f1eee6]">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c5a274]">
                  Need help?
                </p>
                <p className="mt-3 text-sm font-light leading-6 text-white/72">
                  We can help with an order, a delivery detail, or a custom piece.
                </p>
                <button
                  type="button"
                  onClick={() => openWhatsApp("Hello Paje Dhow Furniture, I need buyer support.")}
                  className="mt-5 inline-flex min-h-10 items-center gap-2 border-b border-white/35 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-[#c5a274] hover:text-[#c5a274]"
                >
                  Contact support
                  <MessageCircle className="size-4" />
                </button>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-5 flex flex-col gap-3 border-b border-black/12 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9b5e3b]">
                    Buyer dashboard
                  </p>
                  <h2 className="mt-2 text-3xl font-medium tracking-[-0.06em] text-[#11130f]">
                    {title}
                  </h2>
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
              </div>
              {children}
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
