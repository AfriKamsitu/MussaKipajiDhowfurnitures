"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { authInputClass } from "@/components/auth/auth-shell"
import { SocialAuth } from "@/components/auth/social-auth"
import { useAuth, type Role } from "@/components/auth-provider"
import { withMinimumDuration } from "@/lib/timing"

function destinationFor(role?: Role, redirectTo?: string | null) {
  if (redirectTo) {
    if (redirectTo.startsWith("/admin") && role !== "admin") return "/account"
    if (redirectTo.startsWith("/account") && role === "admin") return "/admin"
    return redirectTo
  }
  return role === "admin" ? "/admin" : "/account"
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")
  const { signIn, signInWithProvider } = useAuth()

  const [show, setShow] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: signInError, role } = await withMinimumDuration(
        signIn({
          email: email.trim().toLowerCase(),
          password,
          marketingOptIn: marketingOptIn ? true : undefined,
        }),
      )
      if (signInError) {
        setError(signInError)
        return
      }
      router.push(destinationFor(role, redirectTo))
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Sign in failed.")
    } finally {
      setLoading(false)
    }
  }

  async function handleProvider(provider: "google" | "facebook") {
    setError(null)
    setLoading(true)
    try {
      const { error: signInError, role, redirected } = await withMinimumDuration(
        signInWithProvider(provider, undefined, marketingOptIn ? true : undefined),
      )
      if (signInError) {
        setError(signInError)
        return
      }
      if (redirected) return
      router.push(destinationFor(role, redirectTo))
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Social sign in failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" aria-busy={loading}>
      <SocialAuth action="Sign in" onProvider={handleProvider} disabled={loading} />
      {error && (
        <p role="alert" aria-live="assertive" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-foreground">Email address</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="login-email" required disabled={loading} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className={`${authInputClass} pl-9`} autoComplete="email" />
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor="login-password" className="block text-sm font-semibold text-foreground">Password</label>
          <Link href="/reset-password" className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="login-password" required disabled={loading} type={show ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className={`${authInputClass} px-9`} autoComplete="current-password" />
          <button type="button" disabled={loading} onClick={() => setShow((current) => !current)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <label className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/35 p-3 text-sm leading-5 text-muted-foreground">
        <input type="checkbox" disabled={loading} checked={marketingOptIn} onChange={(event) => setMarketingOptIn(event.target.checked)} className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]" />
        <span>Email me new products and special offers. I can unsubscribe anytime.</span>
      </label>
      <button type="submit" disabled={loading} className="interactive-press flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70">
        {loading ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Signing in...</> : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}<Link href="/register" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">Create one</Link>
      </p>
    </form>
  )
}