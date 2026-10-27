"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { fetchApi } from "@/lib/api"

type State = "working" | "done" | "failed"

/** Landing page for the unsubscribe link in new-product emails. */
export function UnsubscribeView() {
  const params = useSearchParams()
  const userId = params.get("u")
  const token = params.get("t")
  const [state, setState] = useState<State>(userId && token ? "working" : "failed")

  useEffect(() => {
    if (!userId || !token) return
    let active = true
    fetchApi("/api/marketing/unsubscribe", { method: "POST", body: JSON.stringify({ userId, token }) })
      .then(() => active && setState("done"))
      .catch(() => active && setState("failed"))
    return () => {
      active = false
    }
  }, [userId, token])

  return (
    <section className="mx-auto max-w-md py-16 text-center">
      {state === "working" && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Updating your email preferences…
        </p>
      )}
      {state === "done" && (
        <>
          <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">You are unsubscribed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We will not email you about new furniture any more. You can turn it back on from your account profile.
          </p>
        </>
      )}
      {state === "failed" && (
        <>
          <XCircle className="mx-auto size-10 text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">This link did not work</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in and turn off marketing emails in your account profile, or contact us and we will do it for you.
          </p>
        </>
      )}
      <Link href="/shop" className="sf-btn sf-btn-outline mt-8 inline-flex">
        Continue shopping
      </Link>
    </section>
  )
}
