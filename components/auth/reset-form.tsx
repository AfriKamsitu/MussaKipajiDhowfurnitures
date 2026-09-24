"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, LockKeyhole, Mail, MailCheck } from "lucide-react"
import { authInputClass } from "@/components/auth/auth-shell"
import { fetchApi } from "@/lib/api"

export function ResetForm() {
  const [token, setToken] = useState<string | null | undefined>(undefined)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [sent, setSent] = useState(false)
  const [complete, setComplete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"))
  }, [])

  async function requestReset(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await fetchApi("/api/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "A reset link could not be requested.")
    } finally {
      setSaving(false)
    }
  }

  async function confirmReset(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.")
      return
    }
    if (password !== confirmation) {
      setError("The passwords do not match.")
      return
    }
    setSaving(true)
    try {
      await fetchApi("/api/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      })
      setComplete(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your password could not be reset.")
    } finally {
      setSaving(false)
    }
  }

  if (token === undefined) {
    return <Loader2 className="mx-auto size-6 animate-spin text-primary" aria-label="Loading password reset" />
  }

  if (complete) {
    return (
      <div className="grid gap-5 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-7" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Password updated</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Your reset link has been used and you can sign in now.</p>
        </div>
        <Link href="/login" className="mx-auto text-sm font-semibold text-primary hover:underline">
          Continue to sign in
        </Link>
      </div>
    )
  }

  if (token) {
    return (
      <form onSubmit={confirmReset} className="grid gap-5" aria-busy={saving}>
        <PasswordField
          id="new-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
        />
        {error && <ErrorMessage message={error} />}
        <SubmitButton saving={saving} label="Reset Password" busyLabel="Resetting..." />
        <Link href="/login" className="mx-auto flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </form>
    )
  }

  if (sent) {
    return (
      <div className="grid gap-5 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
          <MailCheck className="size-7" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Check your inbox</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            If an active account exists for that email, a one-time reset link has been sent. It expires in 30 minutes.
          </p>
        </div>
        <Link href="/login" className="mx-auto flex items-center gap-2 text-sm font-medium text-accent hover:underline">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={requestReset} className="grid gap-5" aria-busy={saving}>
      <div>
        <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-foreground">Email Address</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="reset-email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={`${authInputClass} pl-9`}
          />
        </div>
      </div>
      {error && (
        <>
          <ErrorMessage message={error} />
          <Link href="/contact" className="text-center text-sm font-semibold text-primary hover:underline">
            Contact the store for account support
          </Link>
        </>
      )}
      <SubmitButton saving={saving} label="Send Reset Link" busyLabel="Sending..." />
      <Link href="/login" className="mx-auto flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </form>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          required
          minLength={8}
          maxLength={128}
          type="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className={`${authInputClass} pl-9`}
        />
      </div>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  )
}

function SubmitButton({ saving, label, busyLabel }: { saving: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving && <Loader2 className="size-4 animate-spin" />}
      {saving ? busyLabel : label}
    </button>
  )
}
