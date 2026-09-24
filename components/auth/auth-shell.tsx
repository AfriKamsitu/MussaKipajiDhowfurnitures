"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Pause, Play } from "lucide-react"
import type { ReactNode } from "react"
import { fetchApi } from "@/lib/api"
import { cn } from "@/lib/utils"

const perks = [
  "Save pieces and compare your shortlist",
  "Track orders from workshop to delivery",
  "Request tailored finishes for your space",
]

type AuthBanner = {
  image?: string
  location?: string
  sortOrder?: number
}

export function AuthShell({
  title,
  subtitle,
  children,
  image = "/hero-living-room.png",
  images = [],
  placement = "Login Background",
  panelClassName,
}: {
  title: string
  subtitle: string
  children: ReactNode
  image?: string
  images?: string[]
  placement?: "Login Background" | "Register Background"
  panelClassName?: string
}) {
  const [adminImages, setAdminImages] = useState<string[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [paused, setPaused] = useState(false)
  const fallbackImages = useMemo(
    () => Array.from(new Set([image, ...images].filter(Boolean))),
    [image, images],
  )
  const backgroundImages = adminImages.length ? adminImages : fallbackImages

  useEffect(() => {
    fetchApi<AuthBanner[]>("/api/banners/active")
      .then((payload) => {
        const selected = (Array.isArray(payload) ? payload : [])
          .filter(
            (banner) =>
              String(banner.location ?? "").toLowerCase() === placement.toLowerCase() &&
              banner.image,
          )
          .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
          .map((banner) => String(banner.image))
        setAdminImages(selected)
      })
      .catch(() => setAdminImages([]))
  }, [placement])

  useEffect(() => {
    setActiveImage(0)
  }, [backgroundImages.length])

  useEffect(() => {
    if (paused || backgroundImages.length < 2) return
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % backgroundImages.length)
    }, 5200)
    return () => window.clearInterval(timer)
  }, [backgroundImages.length, paused])

  function carouselControls(compact = false) {
    if (backgroundImages.length < 2) return null
    return (
      <div className="flex items-center gap-1" role="group" aria-label="Background image controls">
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveImage(index)}
            aria-label={`Show background image ${index + 1}`}
            aria-pressed={index === activeImage}
            className="grid size-11 place-items-center rounded-full"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeImage
                  ? compact
                    ? "w-6 bg-primary"
                    : "w-6 bg-[#d8c7ae]"
                  : compact
                    ? "w-2.5 bg-primary/25"
                    : "w-3 bg-white/35",
              )}
              aria-hidden="true"
            />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPaused((current) => !current)}
          aria-label={paused ? "Resume background images" : "Pause background images"}
          aria-pressed={paused}
          className={cn(
            "grid size-11 place-items-center rounded-full border transition-colors",
            compact
              ? "border-border bg-white text-primary hover:bg-secondary"
              : "border-white/25 bg-black/10 text-white hover:bg-white/10",
          )}
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      </div>
    )
  }

  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden bg-[#171b17]">
      <div className="fixed inset-0" aria-hidden="true">
        {backgroundImages.map((background, index) => (
          <Image
            key={`${background}-${index}`}
            src={background || "/placeholder.svg"}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className={cn(
              "object-cover transition-[opacity,transform] duration-[1400ms] ease-out",
              index === activeImage
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-105 opacity-0",
            )}
          />
        ))}
        <div className="absolute inset-0 bg-[#171b17]/64" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(470px,0.95fr)]">
        <div className="hidden min-h-screen flex-col justify-between p-10 text-white lg:flex xl:p-14">
          <Link href="/" className="w-fit" aria-label="Go to Paje Dhow Furniture home page">
            <Image
              src="/paje-dhow-furniture-logo.jpeg"
              alt="Paje Dhow Furniture logo"
              width={82}
              height={82}
              className="size-[82px] rounded-2xl object-cover shadow-2xl ring-1 ring-white/20"
            />
          </Link>

          <div className="max-w-xl pb-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d8c7ae]">
              Made in Zanzibar
            </p>
            <p className="mt-4 text-balance text-4xl font-black leading-[1.02] tracking-[-0.04em] xl:text-6xl">
              Handmade furniture, designed for your space.
            </p>
            <ul className="mt-8 grid gap-3">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="size-1.5 rounded-full bg-[#d8c7ae]" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-6">
            {carouselControls()}
            <p className="text-xs text-white/60">&copy; {new Date().getFullYear()} Paje Dhow Furniture</p>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center bg-white px-0 py-0 sm:bg-[#f5f6f2]/96 sm:px-8 sm:py-8 lg:px-10 lg:py-12">
          <div
            className={cn(
              "reveal-scale min-h-screen w-full max-w-md rounded-none border-0 bg-white p-5 pt-7 shadow-none sm:min-h-0 sm:rounded-[1.5rem] sm:border sm:border-border/80 sm:p-8 sm:shadow-[0_28px_80px_-34px_rgba(17,19,15,0.42)]",
              panelClassName,
            )}
          >
            <div className="mb-7 flex items-center justify-between gap-3 sm:mb-8">
              <Link href="/" aria-label="Go to Paje Dhow Furniture home page">
                <Image
                  src="/paje-dhow-furniture-logo.jpeg"
                  alt="Paje Dhow Furniture logo"
                  width={58}
                  height={58}
                  className="size-[58px] rounded-xl object-cover shadow-soft"
                />
              </Link>
              <div className="lg:hidden">{carouselControls(true)}</div>
            </div>
            <h1 className="text-3xl font-black tracking-[-0.035em] text-foreground sm:text-[2rem]">{title}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{subtitle}</p>
            <div className="mt-7 sm:mt-8">{children}</div>
          </div>
        </div>
      </div>
    </main>
  )
}

export const authInputClass =
  "min-h-12 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition-[border-color,box-shadow,background-color] focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-secondary/60 disabled:text-muted-foreground"