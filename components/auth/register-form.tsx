"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react"
import { authInputClass } from "@/components/auth/auth-shell"
import { SocialAuth } from "@/components/auth/social-auth"
import { useAuth } from "@/components/auth-provider"

export function RegisterForm() {
  const router = useRouter()
  const { signUp, signInWithProvider } = useAuth()
  const [show, setShow] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await signUp({
      name: `${firstName} ${lastName}`.trim(),
      email,
      password,
    })
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    router.push("/account")
    router.refresh()
  }

  async function handleProvider(provider: "google" | "facebook") {
    setError(null)
    setLoading(true)
    const { error: err, redirected } = await signInWithProvider(provider)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    if (redirected) return
    router.push("/account")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <SocialAuth action="Sign up" onProvider={handleProvider} disabled={loading} />
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">First Name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className={`${authInputClass} pl-9`}
              autoComplete="given-name"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Last Name</label>
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            className={authInputClass}
            autoComplete="family-name"
          />
        </div>
      </div>
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
        <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            required
            minLength={6}
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className={`${authInputClass} px-9`}
            autoComplete="new-password"
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
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input required type="checkbox" className="mt-0.5 size-4 rounded border-border accent-[var(--accent)]" />
        <span>
          I agree to the{" "}
          <Link href="/" className="font-medium text-accent hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/" className="font-medium text-accent hover:underline">
            Privacy Policy
          </Link>
        </span>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        Create Account
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        New accounts are buyers. Google/Facebook also create a buyer profile.
      </p>
    </form>
  )
}
