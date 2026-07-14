"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ShieldAlert } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/admin")
    // Buyers trying to open /admin stay on a denied screen (handled below).
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  // Signed in but not an admin — show an access-denied screen instead of the panel.
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin access required</h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Buyer accounts cannot open the admin panel. Sign in with an ADMIN account, or continue
            shopping from your buyer dashboard.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/account"
            className="rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Back to my account
          </Link>
          <Link
            href="/"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to store
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
