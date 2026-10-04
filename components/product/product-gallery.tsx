"use client"

import { useState } from "react"
import { SafeImage as Image } from "@/components/safe-image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/** Main image with thumbnail strip; arrow keys and buttons move between angles. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const gallery = images.length > 0 ? images : ["/placeholder.svg"]
  const [active, setActive] = useState(0)
  const count = gallery.length

  function step(direction: -1 | 1) {
    setActive((current) => (current + direction + count) % count)
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <div
        className="group relative aspect-square min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-secondary"
        role="group"
        aria-roledescription="carousel"
        aria-label={`${name} images`}
        tabIndex={count > 1 ? 0 : -1}
        onKeyDown={(event) => {
          if (count < 2) return
          if (event.key === "ArrowLeft") step(-1)
          if (event.key === "ArrowRight") step(1)
        }}
      >
        <Image
          key={gallery[active]}
          src={gallery[active]}
          alt={count > 1 ? `${name}, image ${active + 1} of ${count}` : name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 640px"
          className="sf-fade-in object-cover"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-soft hover:bg-white"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-soft hover:bg-white"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white md:hidden">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="scrollbar-none flex gap-2 overflow-x-auto md:max-h-[640px] md:w-[72px] md:shrink-0 md:flex-col md:overflow-y-auto md:overflow-x-visible">
          {gallery.map((image, index) => (
            <li key={`${image}-${index}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-md border-2 bg-secondary md:size-[72px]",
                  index === active ? "border-primary" : "border-transparent hover:border-input",
                )}
              >
                <Image src={image} alt="" fill sizes="72px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
