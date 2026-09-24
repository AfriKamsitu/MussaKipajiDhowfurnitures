"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Pause, Play } from "lucide-react"

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
  const manuallyPaused = useRef(false)
  const motionRequested = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const reduceMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    motionRequested.current = false
    const rect = video.getBoundingClientRect()
    let inView = rect.bottom > 0 && rect.top < window.innerHeight

    function syncPlayback() {
      if (!video) return
      const motionAllowed = !reduceMotion || motionRequested.current
      if (inView && !document.hidden && motionAllowed && !manuallyPaused.current) {
        void video.play().catch(() => {
          // Keep the play button available when a browser declines autoplay.
          if (video.paused) setIsPlaying(false)
        })
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

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      manuallyPaused.current = false
      motionRequested.current = true
      video.muted = true
      void video.play().catch(() => {
        if (video.paused) setIsPlaying(false)
      })
    } else {
      manuallyPaused.current = true
      video.pause()
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        id="hero-brand-film"
        src="/videos/paje-dhow-preview.mp4"
        poster="/videos/paje-dhow-preview-poster.jpg"
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[35%_center] sm:object-center"
      />
      <div className="absolute right-5 top-5 z-20 flex max-w-[calc(100%-2.5rem)] flex-wrap items-center justify-end gap-2 sm:right-10 sm:top-8 lg:right-[60px]">
        <a
          href="#brand-film"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/35 bg-black/50 px-4 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <Play aria-hidden="true" className="size-3.5" />
          Watch 13s film
        </a>
        {hasError ? (
          <span role="status" className="rounded-full bg-black/70 px-4 py-3 text-xs text-white">
            Video unavailable — use the film player below.
          </span>
        ) : (
          <button
            type="button"
            onClick={togglePlayback}
            aria-controls="hero-brand-film"
            aria-label={isPlaying ? "Pause background film" : "Play background film"}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/35 bg-black/50 px-4 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {isPlaying ? <Pause aria-hidden="true" className="size-3.5" /> : <Play aria-hidden="true" className="size-3.5" />}
            {isPlaying ? "Pause film" : "Play film"}
          </button>
        )}
      </div>
    </>
  )
}
