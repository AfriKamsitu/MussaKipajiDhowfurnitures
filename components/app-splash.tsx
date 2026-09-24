"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

type SplashPhase = "loading" | "complete" | "leaving" | "hidden"

export function AppSplash() {
  const [phase, setPhase] = useState<SplashPhase>("loading")

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("pajedhow.splash-seen") === "true") {
        setPhase("hidden")
        return
      }
      window.sessionStorage.setItem("pajedhow.splash-seen", "true")
    } catch {
      // Continue without session storage; the splash still has a short safety timeout.
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    let disposed = false
    let completed = false
    let assetsReady = false
    let minimumElapsed = false
    let leaveTimer = 0
    let hideTimer = 0
    let loadHandler: (() => void) | undefined

    function unlockPage() {
      document.body.style.overflow = previousOverflow
    }

    function finishLoading() {
      if (disposed || completed) return
      completed = true
      setPhase("complete")

      leaveTimer = window.setTimeout(() => setPhase("leaving"), 120)
      hideTimer = window.setTimeout(() => {
        unlockPage()
        setPhase("hidden")
      }, 450)
    }

    function finishWhenReady() {
      if (assetsReady && minimumElapsed) finishLoading()
    }

    async function markAssetsReady() {
      try {
        await document.fonts?.ready
      } finally {
        assetsReady = true
        finishWhenReady()
      }
    }

    if (document.readyState === "complete") {
      void markAssetsReady()
    } else {
      loadHandler = () => void markAssetsReady()
      window.addEventListener("load", loadHandler, { once: true })
    }

    const minimumTimer = window.setTimeout(() => {
      minimumElapsed = true
      finishWhenReady()
    }, 300)

    const safetyTimer = window.setTimeout(finishLoading, 1200)

    return () => {
      disposed = true
      window.clearTimeout(minimumTimer)
      window.clearTimeout(safetyTimer)
      window.clearTimeout(leaveTimer)
      window.clearTimeout(hideTimer)
      if (loadHandler) window.removeEventListener("load", loadHandler)
      unlockPage()
    }
  }, [])

  if (phase === "hidden") return null

  const completing = phase === "complete" || phase === "leaving"

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white px-6 transition-opacity duration-500 ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-busy={!completing}
      aria-label="Opening Paje Dhow Furniture"
    >
      <div className="flex flex-col items-center text-center text-foreground">
        <div className="relative flex size-28 items-center justify-center sm:size-32">
          <span className="absolute inset-0 rounded-full border border-border" aria-hidden="true" />
          <span
            className="splash-ring absolute inset-0 rounded-full border-2 border-transparent border-r-primary/35 border-t-primary"
            aria-hidden="true"
          />
          <div className="splash-logo overflow-hidden rounded-full border border-border bg-white shadow-elevated">
            <Image
              src="/paje-dhow-furniture-logo.jpeg"
              alt=""
              width={112}
              height={112}
              priority
              className="size-24 object-cover sm:size-28"
            />
          </div>
        </div>

        <div className="splash-wordmark mt-6">
          <p className="text-xl font-semibold uppercase tracking-[0.2em] sm:text-2xl">Paje Dhow</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.34em] text-muted-foreground sm:text-sm">Furniture</p>
        </div>

        <div className="mt-7 h-0.5 w-36 overflow-hidden bg-secondary sm:w-40" aria-hidden="true">
          <span className={`block h-full bg-primary ${completing ? "splash-progress-complete" : "splash-progress"}`} />
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Handcrafted in Zanzibar
        </p>
      </div>
      <span className="sr-only">Preparing the storefront</span>
    </div>
  )
}
