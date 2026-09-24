"use client"

import { useEffect, useState } from "react"

export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    function update() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const scrollable = document.documentElement.scrollHeight - window.innerHeight
        setProgress(scrollable > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollable) * 100)) : 0)
      })
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return (
    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-transparent" aria-hidden>
      <div
        className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
