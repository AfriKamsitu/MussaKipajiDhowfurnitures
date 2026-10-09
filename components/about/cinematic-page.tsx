"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Pins the workshop film behind the whole About page: crash-zoom intro, slow push-in,
 * and a scroll-driven dolly while the page content scrolls over it.
 */
export function CinematicPage({ children }: { children: ReactNode }) {
  const pageRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const page = pageRef.current
    const stage = stageRef.current
    if (!page || !stage) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videoRef.current?.pause()
      // Keep the film dimmed so the copy below the hero stays readable.
      page.style.setProperty("--cine-hero", "1")
      return
    }

    let frame = 0
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1)
    const update = () => {
      frame = 0
      const stageHeight = stage.offsetHeight
      const scrolled = stage.getBoundingClientRect().top - page.getBoundingClientRect().top
      page.style.setProperty("--cine-hero", clamp(scrolled / stageHeight).toFixed(4))
      page.style.setProperty(
        "--cine-page",
        clamp(scrolled / Math.max(page.offsetHeight - stageHeight, 1)).toFixed(4),
      )
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={pageRef} className="cine-page">
      <div ref={stageRef} className="cine-stage" aria-hidden="true">
        <div className="cine-stage__dolly">
          <div className="cine-stage__crash">
            <video
              ref={videoRef}
              className="cine-stage__media"
              poster="/videos/paje-dhow-poster-v2.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            >
              <source src="/videos/paje-dhow-hero-v2-1080.mp4" type="video/mp4" media="(min-width: 1024px)" />
              <source src="/videos/paje-dhow-hero-v2-720.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
        <div className="cine-stage__grade" />
        <div className="cine-stage__dim" />
        <div className="cine-stage__grain" />
        <div className="cine-stage__bar cine-stage__bar--top" />
        <div className="cine-stage__bar cine-stage__bar--bottom" />
      </div>

      <div className="cine-flow sf-container">{children}</div>
    </div>
  )
}
