"use client"

import { useEffect, useState, type ReactNode } from "react"

export function HeroCopyReveal({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    let revealed = false

    const reveal = () => {
      if (revealed) return
      revealed = true
      setVisible(true)
      window.removeEventListener("scroll", reveal)
    }

    if (motionQuery.matches || window.scrollY > 24) {
      reveal()
      return
    }

    const timer = window.setTimeout(reveal, 1400)
    window.addEventListener("scroll", reveal, { passive: true })

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("scroll", reveal)
    }
  }, [])

  return (
    <div className={"hero-copy-reveal " + className} data-visible={visible}>
      {children}
    </div>
  )
}

