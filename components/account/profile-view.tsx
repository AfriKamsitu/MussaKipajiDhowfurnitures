"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Loader2, LockKeyhole } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { authInputClass } from "@/components/auth/auth-shell"

export function ProfileView() {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [marketingOptIn, setMarketingOptIn] = useState(user?.marketingOptIn ?? false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await updateProfile({ name, email, phone, marketingOptIn })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? profileError.message
          : "Profile changes could not be saved.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <form
        onSubmit={handleSubmit}
        className="surface-premium overflow-hidden rounded-2xl"
      >
        <div className="flex items-center gap-4 border-b border-border p-5 sm:p-6">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-black text-primary-foreground">
            {user.name.charAt(0).toUpperCase() || "U"}
          </span>
          <div>
            <p className="font-bold text-foreground">{user.name || "Buyer"}</p>
            <p className="text-sm text-muted-foreground">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <h3 className="font-bold text-foreground">Contact details</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              We use these details to contact you about your orders.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={authInputClass}
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={authInputClass}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+255 700 000 000"
                className={authInputClass}
                autoComplete="tel"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-secondary/60 p-4">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(event) => setMarketingOptIn(event.target.checked)}
              className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]"
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Send me furniture news and selected offers
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                You can change this preference at any time.
              </span>
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/account/addresses"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              Manage addresses
              <ArrowRight className="size-4" />
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : saved ? (
                <Check className="size-4" />
              ) : null}
              {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
            </button>
          </div>
        </div>
      </form>

      <div className="surface-premium mt-4 flex items-start gap-3 rounded-2xl p-4 text-sm text-muted-foreground">
        <LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="leading-6">
          Your account details are sent securely to the store API and are not displayed publicly.
        </p>
      </div>
    </div>
  )
}
