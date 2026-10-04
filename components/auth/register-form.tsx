"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react"
import { authInputClass } from "@/components/auth/auth-shell"
import { SocialAuth } from "@/components/auth/social-auth"
import { useAuth } from "@/components/auth-provider"
import { safeRedirectPath } from "@/lib/redirect"
import { withMinimumDuration } from "@/lib/timing"

export function RegisterForm() {
  const router = useRouter()
  // New buyers return to where they were (for example checkout); never into the admin area.
  const requested = safeRedirectPath(useSearchParams().get("redirect"))
  const destination = requested && !requested.startsWith("/admin") ? requested : "/account"
  const redirectQuery = requested ? `?redirect=${encodeURIComponent(requested)}` : ""
  const { signUp, signInWithProvider } = useAuth()
  const [show, setShow] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
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
      const { error: signUpError } = await withMinimumDuration(
        signUp({
          name: `${firstName} ${lastName}`.trim(),
          email: email.trim().toLowerCase(),
          password,
          marketingOptIn,
        }),
      )
      if (signUpError) {
        setError(signUpError)
        return
      }
      router.push(destination)
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Registration failed.")
    } finally {
      setLoading(false)
    }
  }

  async function handleProvider(provider: "google" | "facebook") {
    setError(null)
    setLoading(true)
    try {
      const { error: signInError, redirected } = await withMinimumDuration(
        signInWithProvider(provider, undefined, marketingOptIn ? true : undefined),
      )
      if (signInError) {
        setError(signInError)
        return
      }
      if (redirected) return
      router.push(destination)
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Social registration failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" aria-busy={loading}>
      <SocialAuth action="Sign up" onProvider={handleProvider} disabled={loading} />
      {error && <p role="alert" aria-live="assertive" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="register-first-name" className="mb-1.5 block text-sm font-semibold text-foreground">First name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input id="register-first-name" required disabled={loading} value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className={`${authInputClass} pl-9`} autoComplete="given-name" />
          </div>
        </div>
        <div>
          <label htmlFor="register-last-name" className="mb-1.5 block text-sm font-semibold text-foreground">Last name</label>
          <input id="register-last-name" required disabled={loading} value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" className={authInputClass} autoComplete="family-name" />
        </div>
      </div>
      <div>
        <label htmlFor="register-email" className="mb-1.5 block text-sm font-semibold text-foreground">Email address</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="register-email" required disabled={loading} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className={`${authInputClass} pl-9`} autoComplete="email" />
        </div>
      </div>
      <div>
        <label htmlFor="register-password" className="mb-1.5 block text-sm font-semibold text-foreground">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="register-password" required disabled={loading} minLength={8} type={show ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className={`${authInputClass} px-9`} autoComplete="new-password" aria-describedby="register-password-help" />
          <button type="button" disabled={loading} onClick={() => setShow((current) => !current)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p id="register-password-help" className="mt-1.5 text-xs leading-5 text-muted-foreground">Use 8 or more characters.</p>
      </div>
      <label className="flex items-start gap-2.5 text-sm leading-5 text-muted-foreground">
        <input required disabled={loading} type="checkbox" className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]" />
        <span>I agree to the <Link href="/" className="font-semibold text-primary hover:underline">Terms of Service</Link> and <Link href="/" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.</span>
      </label>
      <label className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/35 p-3 text-sm leading-5 text-muted-foreground">
        <input type="checkbox" disabled={loading} checked={marketingOptIn} onChange={(event) => setMarketingOptIn(event.target.checked)} className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]" />
        <span>Email me new furniture, special offers, and workshop updates. I can unsubscribe anytime.</span>
      </label>
      <button type="submit" disabled={loading} className="interactive-press flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70">
        {loading ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Creating account...</> : "Create account"}
      </button>
      <p className="text-center text-sm text-muted-foreground">Already have an account?{" "}<Link href={`/login${redirectQuery}`} className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">Sign in</Link></p>
    </form>
  )
}