"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"

const motionQuery = "(prefers-reduced-motion: reduce)"

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(motionQuery)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function getMotionPreference() {
  return window.matchMedia(motionQuery).matches
}

function getServerMotionPreference() {
  return true
}

export function HeroFilm() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduceMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    const rect = video.getBoundingClientRect()
    let inView = rect.bottom > 0 && rect.top < window.innerHeight

    function syncPlayback() {
      if (!video) return
      if (inView && !document.hidden && !reduceMotion) {
        void video.play().catch(() => undefined)
      } else {
        video.pause()
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      syncPlayback()
    }, { threshold: 0.05 })
    observer.observe(video)
    document.addEventListener("visibilitychange", syncPlayback)
    syncPlayback()

    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", syncPlayback)
      video.pause()
    }
  }, [reduceMotion])

  return (
    <div className="hero-earth-zoom absolute inset-0" aria-hidden="true">
      <video
        ref={videoRef}
        id="hero-brand-film"
        src="/videos/musa.mp4"
        poster="/videos/musa-poster.jpg"
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
        className="pointer-events-none h-full w-full object-cover object-[35%_center] sm:object-center"
      />
    </div>
  )
}
