"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { authInputClass } from "@/components/auth/auth-shell"
import { SocialAuth } from "@/components/auth/social-auth"
import { useAuth, type Role } from "@/components/auth-provider"

function destinationFor(role?: Role, redirectTo?: string | null) {
  if (redirectTo) return redirectTo
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err, role } = await signIn({ email, password })
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    router.push(destinationFor(role, redirectTo))
    router.refresh()
  }

  async function handleProvider(provider: "google" | "facebook") {
    setError(null)
    setLoading(true)
    const { error: err, role, redirected } = await signInWithProvider(provider)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    if (redirected) return
    // Buyers (including social) go to account; only admins use /admin.
    router.push(destinationFor(role, redirectTo))
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <SocialAuth action="Sign in" onProvider={handleProvider} disabled={loading} />
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Email Address</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${authInputClass} pl-9`}
            autoComplete="email"
          />
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">Password</label>
          <Link href="/reset-password" className="text-xs font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            required
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`${authInputClass} px-9`}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" className="size-4 rounded border-border accent-[var(--accent)]" />
        Remember me
      </label>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        Sign In
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Create one
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        Admins use email/password. Google and Facebook create a buyer account.
      </p>
    </form>
  )
}
