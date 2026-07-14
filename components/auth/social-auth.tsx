"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { getFacebookAppId, getGoogleClientId } from "@/lib/social-auth"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07Z"
      />
    </svg>
  )
}

export function SocialAuth({
  action = "Sign in",
  onProvider,
  disabled = false,
}: {
  action?: string
  onProvider?: (provider: "google" | "facebook") => void | Promise<void>
  disabled?: boolean
}) {
  const [pending, setPending] = useState<"google" | "facebook" | null>(null)
  const googleReady = Boolean(getGoogleClientId())
  const facebookReady = Boolean(getFacebookAppId())

  async function handleClick(provider: "google" | "facebook") {
    if (disabled || pending) return
    setPending(provider)
    try {
      await onProvider?.(provider)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled || !!pending || !googleReady}
          onClick={() => handleClick("google")}
          title={
            googleReady
              ? undefined
              : "Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign-in"
          }
          className="flex items-center justify-center gap-2.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary disabled:pointer-events-none disabled:opacity-60"
        >
          {pending === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          <span>Google</span>
        </button>
        <button
          type="button"
          disabled={disabled || !!pending || !facebookReady}
          onClick={() => handleClick("facebook")}
          title={
            facebookReady
              ? undefined
              : "Set NEXT_PUBLIC_FACEBOOK_APP_ID to enable Facebook sign-in"
          }
          className="flex items-center justify-center gap-2.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary disabled:pointer-events-none disabled:opacity-60"
        >
          {pending === "facebook" ? <Loader2 className="size-4 animate-spin" /> : <FacebookIcon />}
          <span>Facebook</span>
        </button>
      </div>
      {(!googleReady || !facebookReady) && (
        <p className="text-xs text-muted-foreground">
          {!googleReady && !facebookReady
            ? "Configure Google and Facebook OAuth client IDs in .env.local to enable social sign-in."
            : !googleReady
              ? "Google sign-in needs NEXT_PUBLIC_GOOGLE_CLIENT_ID."
              : "Facebook sign-in needs NEXT_PUBLIC_FACEBOOK_APP_ID."}
        </p>
      )}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">Or {action.toLowerCase()} with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}
